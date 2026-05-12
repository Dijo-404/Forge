import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { matchStore } from "@/lib/match-store";
import { getProblem } from "@/lib/problems";
import type { ForgeCredential, Match } from "@/lib/forge-types";
import { shortAddr } from "@/lib/solana";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await ctx.params;
  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }

  const all = matchStore.list();
  const settled = all.filter(
    (m) =>
      m.status === "settled" &&
      (m.challenger === wallet || m.opponent === wallet)
  );

  const credentials: ForgeCredential[] = settled.map((m) => toCredential(m, wallet));

  const wins = credentials.filter((c) => c.outcome === "win").length;
  const losses = credentials.length - wins;
  const avgHumanScore =
    credentials.length === 0
      ? 0
      : Math.round(
          credentials.reduce((acc, c) => acc + c.humanScore, 0) / credentials.length
        );
  const bestHumanScore = credentials.reduce((acc, c) => Math.max(acc, c.humanScore), 0);
  const avgPasteRatio =
    credentials.length === 0
      ? 0
      : credentials.reduce((acc, c) => acc + c.pasteRatio, 0) / credentials.length;

  return NextResponse.json({
    wallet,
    credentials,
    aggregate: {
      total: credentials.length,
      wins,
      losses,
      avgHumanScore,
      bestHumanScore,
      avgPasteRatio,
    },
  });
}

function toCredential(m: Match, wallet: string): ForgeCredential {
  const p = getProblem(m.problemId);
  const opponent = m.challenger === wallet ? m.opponent ?? "" : m.challenger;
  const outcome: "win" | "loss" = m.winner === wallet ? "win" : "loss";
  const durationSec = Math.max(0, Math.round(((m.endedAt ?? 0) - (m.startedAt ?? m.createdAt)) / 1000));
  return {
    mint: m.credentialMints?.[outcome] ?? `pending-${m.id.slice(0, 8)}`,
    holder: wallet,
    matchId: m.id,
    problemId: m.problemId,
    problemTitle: p?.title ?? m.problemId,
    difficulty: p?.difficulty ?? "medium",
    outcome,
    humanScore: 0, // filled below from snapshot if available
    pasteRatio: 0,
    durationSec,
    language: p?.language ?? "typescript",
    opponentMasked: shortAddr(opponent, 4),
    replayUri: `/arena/${m.id}`,
    mintedAt: m.endedAt ?? m.createdAt,
    ...latestSignals(m, wallet),
  };
}

function latestSignals(m: Match, wallet: string): Pick<ForgeCredential, "humanScore" | "pasteRatio"> {
  const snaps = matchStore.snapshotsFor(m.id).filter((s) => s.player === wallet);
  if (snaps.length === 0) return { humanScore: 0, pasteRatio: 0 };
  const last = snaps[snaps.length - 1];
  return {
    humanScore: last.humanScore ?? 0,
    pasteRatio: last.pasteRatio ?? 0,
  };
}
