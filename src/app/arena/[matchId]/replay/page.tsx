"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassLink } from "@/components/glass/GlassButton";
import type { Match, MatchSnapshot } from "@/lib/forge-types";
import { shortAddr } from "@/lib/solana";

export default function ReplayPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [snaps, setSnaps] = useState<MatchSnapshot[]>([]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      const [m, s] = await Promise.all([
        fetch(`/api/matches/${matchId}`).then((r) => r.json()),
        fetch(`/api/matches/${matchId}/snapshots`).then((r) => r.json()).catch(() => ({ snapshots: [] })),
      ]);
      if (cancel) return;
      setMatch(m.match);
      setSnaps(s.snapshots ?? []);
    };
    load();
    return () => {
      cancel = true;
    };
  }, [matchId]);

  const players = useMemo(() => {
    const set = new Set<string>();
    for (const s of snaps) set.add(s.player);
    return Array.from(set);
  }, [snaps]);

  const currentByPlayer = useMemo(() => {
    const out: Record<string, MatchSnapshot> = {};
    for (const s of snaps) {
      if (s.ts <= t) out[s.player] = s;
    }
    return out;
  }, [snaps, t]);

  const minTs = snaps.length ? snaps[0].ts : 0;
  const maxTs = snaps.length ? snaps[snaps.length - 1].ts : 1;

  useEffect(() => {
    if (!playing || snaps.length === 0) return;
    const id = setInterval(() => {
      setT((cur) => {
        const next = cur + (maxTs - minTs) / 200;
        if (next >= maxTs) {
          setPlaying(false);
          return maxTs;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [playing, snaps.length, maxTs, minTs]);

  // Bootstrap t to minTs once snaps load
  useEffect(() => {
    if (snaps.length && t === 0) setT(minTs);
  }, [snaps.length, minTs, t]);

  if (!match) {
    return (
      <PageHeader
        eyebrow="Replay"
        title="Loading match…"
        subtitle="Fetching snapshot history."
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Replay · match ${shortAddr(match.id, 6)}`}
        title={<>Watch the match. <span className="aurora-text">Frame by frame.</span></>}
        subtitle={
          <>
            {snaps.length} snapshots over {Math.round((maxTs - minTs) / 1000)}s · winner{" "}
            <span className="font-mono">{match.winner ? shortAddr(match.winner) : "—"}</span>
          </>
        }
        actions={
          <GlassLink href={`/arena/${match.id}`} variant="ghost" size="md" icon={null}>
            Back to live view
          </GlassLink>
        }
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-24 lg:px-12">
        <GlassPanel variant="strong" rounded="2xl" className="p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="glass-cta inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-white"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <input
              type="range"
              min={minTs}
              max={maxTs}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="h-1.5 flex-1 accent-[var(--color-brand-600)]"
            />
            <span className="font-mono text-[12px] text-[var(--color-ink-muted)]">
              t+{Math.round((t - minTs) / 1000)}s
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {players.length === 0 ? (
              <p className="rounded-xl bg-white/60 p-5 text-[13px] text-[var(--color-ink-muted)]">
                No snapshots recorded for this match.
              </p>
            ) : (
              players.map((p) => {
                const s = currentByPlayer[p];
                return (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlassPanel variant="soft" rounded="2xl" className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-black/5 bg-white/40 px-5 py-3">
                        <span className="font-mono text-[12px] font-semibold">
                          {shortAddr(p)}
                        </span>
                        <span className="text-[11px] text-[var(--color-ink-muted)]">
                          {s ? `${s.charCount} chars · score ${s.humanScore ?? "—"}` : "no data yet"}
                        </span>
                      </div>
                      <pre className="max-h-[420px] overflow-auto bg-white/60 p-4 font-mono text-[12px] leading-snug">
                        {s?.code ?? "// (no snapshot at this timestamp)"}
                      </pre>
                    </GlassPanel>
                  </motion.div>
                );
              })
            )}
          </div>
        </GlassPanel>
      </section>
    </>
  );
}
