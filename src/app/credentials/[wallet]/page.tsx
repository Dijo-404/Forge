"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassLink } from "@/components/glass/GlassButton";
import { explorerAddress, shortAddr } from "@/lib/solana";
import type { ForgeCredential } from "@/lib/forge-types";
import { cn } from "@/lib/cn";

interface Dossier {
  wallet: string;
  credentials: ForgeCredential[];
  aggregate: {
    total: number;
    wins: number;
    losses: number;
    avgHumanScore: number;
    bestHumanScore: number;
    avgPasteRatio: number;
  };
}

export default function CredentialsForWallet() {
  const { wallet } = useParams<{ wallet: string }>();
  const [d, setD] = useState<Dossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setError(null);
    fetch(`/api/credentials/${wallet}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? `HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => !cancel && setD(j))
      .catch((e) => !cancel && setError(e.message));
    return () => {
      cancel = true;
    };
  }, [wallet]);

  return (
    <>
      <PageHeader
        eyebrow="Dossier"
        title={
          <>
            <span className="font-mono text-[36px] sm:text-[44px]">
              {shortAddr(wallet, 6)}
            </span>
          </>
        }
        subtitle={
          <>
            On-chain Forge credentials, computed live from this network's match
            history. Open in{" "}
            <a
              href={explorerAddress(wallet)}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-brand-700)] underline"
            >
              Solana Explorer
            </a>
            .
          </>
        }
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-24 lg:px-12">
        {error ? (
          <div className="rounded-xl bg-rose-50 p-4 text-[13px] text-rose-700">
            {error}
          </div>
        ) : !d ? (
          <p className="rounded-xl bg-white/60 p-5 text-[13px] text-[var(--color-ink-muted)]">
            Loading…
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Total" value={d.aggregate.total} />
              <Stat label="Wins" value={d.aggregate.wins} valueClass="text-emerald-600" />
              <Stat label="Losses" value={d.aggregate.losses} valueClass="text-rose-600" />
              <Stat label="Avg Human" value={`${d.aggregate.avgHumanScore}/100`} />
              <Stat label="Best Human" value={`${d.aggregate.bestHumanScore}/100`} />
              <Stat label="Avg paste" value={`${(d.aggregate.avgPasteRatio * 100).toFixed(0)}%`} />
            </div>

            <h3
              className="mt-12 text-[22px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Match history
            </h3>

            {d.credentials.length === 0 ? (
              <p className="mt-3 rounded-xl bg-white/60 p-5 text-[13px] text-[var(--color-ink-muted)]">
                No credentials minted yet for this wallet. Settle a match in /arena.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {d.credentials.map((c) => (
                  <li key={c.mint}>
                    <GlassPanel variant="soft" rounded="2xl" className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                                c.outcome === "win"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              )}
                            >
                              {c.outcome}
                            </span>
                            <span className="rounded-full bg-[var(--color-brand-50)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)]">
                              {c.difficulty}
                            </span>
                          </div>
                          <p
                            className="mt-2 text-[18px] font-bold tracking-[-0.02em]"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {c.problemTitle}
                          </p>
                          <p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">
                            vs {c.opponentMasked} · {c.durationSec}s · {c.language} ·{" "}
                            <a
                              href={explorerAddress(c.mint)}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              mint {shortAddr(c.mint)}
                            </a>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-right">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">Human</p>
                            <p className="font-mono text-[20px] font-semibold">{c.humanScore}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">Paste</p>
                            <p className="font-mono text-[20px] font-semibold">
                              {(c.pasteRatio * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end">
                        <GlassLink href={c.replayUri} variant="ghost" size="sm" icon={null}>
                          Open replay
                        </GlassLink>
                      </div>
                    </GlassPanel>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <GlassPanel variant="soft" rounded="2xl" className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-[28px] font-bold tracking-[-0.02em] text-[var(--color-ink-primary)]",
          valueClass
        )}
      >
        {value}
      </p>
    </GlassPanel>
  );
}
