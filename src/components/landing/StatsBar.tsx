"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass/GlassPanel";

interface Stats {
  matches: { total: number; open: number; live: number; settled: number };
  usdc: { totalSettled: number };
  network: { cluster: string; coreVersion: string | null; blockHeight: number | null };
  fetchedAt: number;
}

export function StatsBar() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let cancel = false;
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((j) => !cancel && setS(j))
        .catch(() => {});
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="relative w-full px-6 lg:px-12">
      <div className="mx-auto -mt-12 max-w-[1280px]">
        <GlassPanel variant="strong" rounded="2xl" className="p-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Cell label="Matches settled" value={s?.matches.settled ?? "—"} />
            <Cell label="Live duels" value={s?.matches.live ?? "—"} highlight />
            <Cell label="USDC settled" value={s ? `${s.usdc.totalSettled.toLocaleString()}` : "—"} />
            <Cell
              label={`Devnet block`}
              value={s?.network.blockHeight?.toLocaleString() ?? "—"}
              mono
            />
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-baseline justify-between rounded-[14px] bg-white/60 px-4 py-3"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        {label}
      </span>
      <span
        className={
          "text-[18px] font-bold tracking-[-0.02em] " +
          (highlight ? "text-[var(--color-brand-700)]" : "text-[var(--color-ink-primary)]") +
          (mono ? " font-mono" : "")
        }
      >
        {value}
      </span>
    </motion.div>
  );
}
