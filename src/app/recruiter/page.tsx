"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { shortAddr } from "@/lib/solana";

interface RecruiterRow {
  wallet: string;
  matches: number;
  wins: number;
  avgHumanScore: number;
  bestProblem: string | null;
  langs: string[];
}

export default function RecruiterPage() {
  const [rows, setRows] = useState<RecruiterRow[]>([]);
  const [minScore, setMinScore] = useState(70);
  const [maxPaste, setMaxPaste] = useState(40);
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    fetch(`/api/recruiter/search?minScore=${minScore}&maxPaste=${maxPaste}&tag=${tag}`)
      .then((r) => r.json())
      .then((j) => !cancel && setRows(j.rows ?? []))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [minScore, maxPaste, tag]);

  return (
    <>
      <PageHeader
        eyebrow="Recruiter view"
        title={<>Talent discovery without <span className="aurora-text">trust falls.</span></>}
        subtitle="Filter devs by Human-Code Score, paste ratio, and problem tags. Every result links to a replayable on-chain match — not a screenshot."
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-24 lg:px-12">
        <GlassPanel variant="strong" rounded="2xl" className="p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Slider label="Min Human-Code Score" value={minScore} onChange={setMinScore} max={100} />
            <Slider label="Max paste ratio (%)" value={maxPaste} onChange={setMaxPaste} max={100} />
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Tag filter
              </span>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. anchor, hashmap"
                className="mt-1.5 block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-4 outline-none focus:border-[var(--color-brand-500)]"
              />
            </label>
          </div>
        </GlassPanel>

        <div className="mt-10">
          <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white/60">
            <table className="min-w-full text-left text-[14px]">
              <thead className="bg-white/80 text-[12px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                <tr>
                  <th className="px-5 py-3">Wallet</th>
                  <th className="px-5 py-3">Matches</th>
                  <th className="px-5 py-3">Win rate</th>
                  <th className="px-5 py-3">Avg Human</th>
                  <th className="px-5 py-3">Best problem</th>
                  <th className="px-5 py-3">Languages</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-[var(--color-ink-muted)]">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-[var(--color-ink-muted)]">
                      No devs match these filters yet. Loosen them, or seed the network with /arena.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.wallet} className="border-t border-black/5">
                      <td className="px-5 py-4 font-mono">{shortAddr(r.wallet)}</td>
                      <td className="px-5 py-4">{r.matches}</td>
                      <td className="px-5 py-4">
                        {r.matches > 0 ? `${Math.round((r.wins / r.matches) * 100)}%` : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono">{r.avgHumanScore}</td>
                      <td className="px-5 py-4">{r.bestProblem ?? "—"}</td>
                      <td className="px-5 py-4 text-[12px] text-[var(--color-ink-muted)]">
                        {r.langs.join(", ") || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/credentials/${r.wallet}`}
                          className="rounded-full bg-[var(--color-ink-primary)] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[var(--color-brand-700)]"
                        >
                          Dossier
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function Slider({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <span>{label}</span>
        <span className="font-mono text-[var(--color-ink-primary)]">{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full appearance-none rounded-full bg-[var(--color-brand-100)] accent-[var(--color-brand-600)]"
      />
    </label>
  );
}
