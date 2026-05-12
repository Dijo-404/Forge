import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";
import { getProblem } from "@/lib/problems";
import { judgeTypescript, signVerdict } from "@/lib/judge-runner";
import type { JudgeVerdict, Match } from "@/lib/forge-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | { player?: string; code?: string }
    | null;

  if (!body?.player || typeof body.code !== "string") {
    return NextResponse.json({ error: "Missing player or code" }, { status: 400 });
  }

  const match = matchStore.get(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "live") {
    return NextResponse.json({ error: `Match is ${match.status}` }, { status: 409 });
  }
  if (match.challenger !== body.player && match.opponent !== body.player) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const problem = getProblem(match.problemId);
  if (!problem) return NextResponse.json({ error: "Problem missing" }, { status: 404 });
  if (problem.language !== "typescript" && problem.language !== "javascript") {
    return NextResponse.json(
      { error: `Judge runner currently supports TS/JS only. Got: ${problem.language}` },
      { status: 501 }
    );
  }

  matchStore.update(id, { status: "judging" });

  const result = await judgeTypescript(
    body.code,
    problem.publicTests,
    problem.hiddenTests ?? ""
  );

  const partial: Omit<JudgeVerdict, "signature"> = {
    matchId: id,
    player: body.player,
    passed: result.passed,
    testsTotal: result.total,
    testsPassed: result.passedCount,
    runtimeMs: result.runtimeMs,
    stderr: result.stderr,
  };
  const verdict: JudgeVerdict = { ...partial, signature: signVerdict(partial) };

  // First passing submission wins; the loser is the other participant
  let updated: Match | undefined = matchStore.get(id);
  if (result.passed) {
    const winner = body.player;
    const loser = match.challenger === winner ? match.opponent : match.challenger;
    updated = matchStore.update(id, {
      status: "settled",
      winner,
      loser,
      endedAt: Date.now(),
    });
  } else {
    // Mark match back to live so opponent can still try
    updated = matchStore.update(id, { status: "live" });
  }

  return NextResponse.json({ verdict, match: updated });
}
