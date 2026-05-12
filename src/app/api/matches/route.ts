import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";
import { getProblem } from "@/lib/problems";
import type { Match } from "@/lib/forge-types";
import { randomUUID } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ matches: matchStore.list() });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { challenger, problemId, stakeUsdc } = body as {
    challenger?: string;
    problemId?: string;
    stakeUsdc?: number;
  };

  if (!challenger || !problemId || typeof stakeUsdc !== "number") {
    return NextResponse.json(
      { error: "Missing challenger, problemId or stakeUsdc" },
      { status: 400 }
    );
  }

  // Validate the wallet pubkey is a real PublicKey on Solana
  try {
    new PublicKey(challenger);
  } catch {
    return NextResponse.json({ error: "Invalid challenger pubkey" }, { status: 400 });
  }

  const problem = getProblem(problemId);
  if (!problem) {
    return NextResponse.json({ error: `Unknown problemId: ${problemId}` }, { status: 404 });
  }
  if (stakeUsdc < 0.1) {
    return NextResponse.json({ error: "Stake must be ≥ 0.1 USDC" }, { status: 400 });
  }

  const match: Match = {
    id: randomUUID(),
    problemId,
    stakeUsdc,
    challenger,
    status: "open",
    createdAt: Date.now(),
  };

  matchStore.create(match);

  return NextResponse.json({ match }, { status: 201 });
}
