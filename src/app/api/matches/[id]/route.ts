import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";
import { getProblem, publicProblem } from "@/lib/problems";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const match = matchStore.get(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const p = getProblem(match.problemId);
  if (!p) return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  return NextResponse.json({ match, problem: publicProblem(p) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Partial<{
    escrowPda: string;
    openTxSig: string;
    joinTxSig: string;
    settleTxSig: string;
  }> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Whitelist patchable fields
  const patch: Partial<{
    escrowPda: string;
    openTxSig: string;
    joinTxSig: string;
    settleTxSig: string;
  }> = {};
  for (const k of ["escrowPda", "openTxSig", "joinTxSig", "settleTxSig"] as const) {
    if (typeof body[k] === "string") patch[k] = body[k];
  }
  const updated = matchStore.update(id, patch);
  if (!updated) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json({ match: updated });
}
