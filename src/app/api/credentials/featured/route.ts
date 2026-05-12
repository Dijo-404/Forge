import { NextResponse } from "next/server";
import { matchStore } from "@/lib/match-store";

export const runtime = "nodejs";

export async function GET() {
  const all = matchStore.list().filter((m) => m.status === "settled");
  const tally = new Map<string, { matches: number; bestScore: number }>();
  for (const m of all) {
    for (const w of [m.challenger, m.opponent].filter(Boolean) as string[]) {
      const cur = tally.get(w) ?? { matches: 0, bestScore: 0 };
      cur.matches += 1;
      const lastSnap = matchStore.snapshotsFor(m.id).filter((s) => s.player === w).at(-1);
      if (lastSnap?.humanScore && lastSnap.humanScore > cur.bestScore) {
        cur.bestScore = lastSnap.humanScore;
      }
      tally.set(w, cur);
    }
  }

  const featured = Array.from(tally.entries())
    .map(([wallet, v]) => ({ wallet, ...v }))
    .sort((a, b) => b.bestScore - a.bestScore || b.matches - a.matches)
    .slice(0, 12);

  return NextResponse.json({ featured });
}
