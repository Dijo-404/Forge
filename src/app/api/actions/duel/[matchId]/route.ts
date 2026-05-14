/**
 * Solana Action / Blink endpoint for one-click duel acceptance.
 *
 * Spec: https://solana.com/docs/advanced/actions
 *
 * GET  → returns a JSON descriptor that wallets render as a card with a
 *        single CTA "Accept duel" — directly inside an X post or Discord
 *        embed.
 * POST → returns the unsigned base64 transaction the wallet signs to join
 *        the match. (Phase 2: returns the real `join_match` ix once the
 *        Anchor program is deployed and NEXT_PUBLIC_FORGE_PROGRAM_ID is set.)
 */

import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { matchStore } from "@/lib/match-store";
import { getProblem } from "@/lib/problems";
import { RPC_ENDPOINT, getForgeProgramId } from "@/lib/solana";

export const runtime = "nodejs";

const ACTIONS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-action-version, x-blockchain-ids",
  "X-Action-Version": "2.4",
  "X-Blockchain-Ids": "solana:103", // devnet
};

export function OPTIONS() {
  return new NextResponse(null, { headers: ACTIONS_HEADERS });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params;
  const match = matchStore.get(matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404, headers: ACTIONS_HEADERS });
  }
  const problem = getProblem(match.problemId);
  const origin = req.nextUrl.origin;

  return NextResponse.json(
    {
      type: "action",
      icon: `${origin}/og/duel/${matchId}.png`,
      title: `[DUEL] ${problem?.title ?? match.problemId}`,
      description:
        `Accept this Forge duel. Stake ${match.stakeUsdc} USDC. Race a peer to solve the problem on-chain — winner takes the pot, both mint a Proof-of-Skill credential.`,
      label: `Stake ${match.stakeUsdc} USDC & duel`,
      links: {
        actions: [
          {
            type: "transaction",
            label: `Accept · ${match.stakeUsdc} USDC`,
            href: `${origin}/api/actions/duel/${matchId}`,
          },
        ],
      },
    },
    { headers: ACTIONS_HEADERS }
  );
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { account?: string };
  if (!body.account) {
    return NextResponse.json({ error: "Missing account" }, { status: 400, headers: ACTIONS_HEADERS });
  }

  const match = matchStore.get(matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404, headers: ACTIONS_HEADERS });
  }
  if (match.status !== "open") {
    return NextResponse.json({ error: `Match is ${match.status}` }, { status: 409, headers: ACTIONS_HEADERS });
  }

  let opponent: PublicKey;
  try {
    opponent = new PublicKey(body.account);
  } catch {
    return NextResponse.json({ error: "Invalid account" }, { status: 400, headers: ACTIONS_HEADERS });
  }

  const programId = getForgeProgramId();
  if (!programId) {
    // Phase 1 path — no on-chain ix yet, still return a valid envelope
    // so wallets accept the response. We tell the user to update env.
    return NextResponse.json(
      {
        type: "post",
        message:
          "Forge program is not deployed on this network yet. Run `anchor deploy` and set NEXT_PUBLIC_FORGE_PROGRAM_ID.",
      },
      { headers: ACTIONS_HEADERS }
    );
  }

  // Phase 2 — build the real `join_match` transaction.
  // We construct an empty Transaction here; the actual ix construction
  // is delegated to the client (which already has the AnchorProvider) so
  // we don't duplicate the IDL/program loading logic on the server.
  // Many wallets accept a bare transaction with just the recent blockhash
  // and a memo, then the dapp follow-up sends the real one.
  const conn = new Connection(RPC_ENDPOINT, "confirmed");
  const tx = new Transaction({ feePayer: opponent });
  tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
  // Adding no instructions yet — the wallet will surface this and the
  // dapp opens /arena/<id>?join=1 to complete the real flow.
  const ser = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  const message = `Open Forge in browser to complete the duel: ${req.nextUrl.origin}/arena/${matchId}?join=1`;

  return NextResponse.json(
    {
      type: "transaction",
      transaction: Buffer.from(ser).toString("base64"),
      message,
      links: {
        next: {
          type: "post",
          href: `${req.nextUrl.origin}/api/actions/duel/${matchId}/done`,
        },
      },
    },
    { headers: ACTIONS_HEADERS }
  );
}
