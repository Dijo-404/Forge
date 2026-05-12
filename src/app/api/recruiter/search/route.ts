import { NextRequest, NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";
import { getProblem } from "@/lib/problems";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams;
  const minScore = Number(u.get("minScore") ?? "0");
  const maxPaste = Number(u.get("maxPaste") ?? "100") / 100;
  const tag = (u.get("tag") ?? "").trim().toLowerCase();

  const settled = matchStore.list().filter((m) => m.status === "settled");
  const tally = new Map<
    string,
    {
      wallet: string;
      matches: number;
      wins: number;
      humanSum: number;
      pasteCount: number;
      pasteSum: number;
      bestProblem: string | null;
      bestProblemScore: number;
      langs: Set<string>;
    }
  >();

  for (const m of settled) {
    const p = getProblem(m.problemId);
    if (tag && !p?.tags.some((t) => t.toLowerCase().includes(tag))) continue;
    for (const w of [m.challenger, m.opponent].filter(Boolean) as string[]) {
      const snaps = matchStore.snapshotsFor(m.id).filter((s) => s.player === w);
      const last = snaps.at(-1);
      const score = last?.humanScore ?? 0;
      const paste = last?.pasteRatio ?? 0;
      if (score < minScore) continue;
      if (paste > maxPaste) continue;

      const cur =
        tally.get(w) ??
        {
          wallet: w,
          matches: 0,
          wins: 0,
          humanSum: 0,
          pasteCount: 0,
          pasteSum: 0,
          bestProblem: null,
          bestProblemScore: 0,
          langs: new Set<string>(),
        };

      cur.matches++;
      if (m.winner === w) cur.wins++;
      cur.humanSum += score;
      cur.pasteSum += paste;
      cur.pasteCount++;
      if (p) cur.langs.add(p.language);
      if (score > cur.bestProblemScore && p) {
        cur.bestProblemScore = score;
        cur.bestProblem = p.title;
      }
      tally.set(w, cur);
    }
  }

  const rows = Array.from(tally.values())
    .map((r) => ({
      wallet: r.wallet,
      matches: r.matches,
      wins: r.wins,
      avgHumanScore: r.matches ? Math.round(r.humanSum / r.matches) : 0,
      bestProblem: r.bestProblem,
      langs: Array.from(r.langs),
    }))
    .sort((a, b) => b.avgHumanScore - a.avgHumanScore || b.matches - a.matches);

  return NextResponse.json({ rows });
}
