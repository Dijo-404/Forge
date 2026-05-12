import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const m = matchStore.get(id);
  if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json({ snapshots: matchStore.snapshotsFor(id) });
}
