import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";
import type { MatchSnapshot } from "@/lib/forge-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Partial<MatchSnapshot> | null;
  if (!body || !body.player || typeof body.code !== "string") {
    return NextResponse.json({ error: "Invalid snapshot" }, { status: 400 });
  }
  const m = matchStore.get(id);
  if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  // Cap snapshot size to prevent abuse — 64KB
  if (body.code.length > 64 * 1024) {
    return NextResponse.json({ error: "Snapshot too large" }, { status: 413 });
  }

  matchStore.pushSnapshot({
    matchId: id,
    player: body.player,
    language: body.language ?? "typescript",
    code: body.code,
    humanScore: body.humanScore,
    pasteRatio: body.pasteRatio,
    charCount: body.code.length,
    ts: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
