import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { opponent } = (await req.json().catch(() => ({}))) as { opponent?: string };
  if (!opponent) return NextResponse.json({ error: "Missing opponent" }, { status: 400 });
  try {
    new PublicKey(opponent);
  } catch {
    return NextResponse.json({ error: "Invalid opponent pubkey" }, { status: 400 });
  }
  const m = matchStore.get(id);
  if (!m) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (m.status !== "open") return NextResponse.json({ error: `Match is ${m.status}` }, { status: 409 });
  if (m.challenger === opponent) return NextResponse.json({ error: "Cannot duel yourself" }, { status: 400 });

  const next = matchStore.update(id, {
    opponent,
    status: "live",
    startedAt: Date.now(),
  })!;

  return NextResponse.json({ match: next });
}
