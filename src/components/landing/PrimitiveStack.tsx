"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { SectionHeader } from "./HowItWorks";

const PRIMS = [
  {
    name: "MagicBlock Ephemeral Rollups",
    role: "Real-time keystroke commits",
    why: "Won 1st/2nd/4th/5th in Gaming at Breakout — proven judge magnet. We port it to dev tooling. (No one else has.)",
    metric: "~10ms commits",
  },
  {
    name: "Token-2022 + Metadata Pointer",
    role: "Tradable, gateable Proof-of-Skill credential",
    why: "Skill-credential projects today use plain SBT. Token-2022 unlocks transfer hooks, royalties, and rich on-chain metadata.",
    metric: "Mainnet-ready",
  },
  {
    name: "Anchor escrow PDA",
    role: "Trustless USDC stake-and-settle",
    why: "Same pattern that won Pregame 1st place Consumer at Radar. Battle-tested, judge-validated.",
    metric: "Audit-friendly",
  },
  {
    name: "Solana Pay + Blinks",
    role: "Distribution & one-click challenges",
    why: "Drop a `forge.gg/duel/<id>` Blink in any tweet — opponents accept without leaving X.",
    metric: "Viral loop",
  },
  {
    name: "ZK Compression (Light Protocol)",
    role: "Cohort-scale credential issuance",
    why: "Mint thousands of cohort credentials at fractional rent — perfect for 100xDevs cohorts.",
    metric: "1000× cheaper",
  },
  {
    name: "Helius / Triton DAS",
    role: "Replay storage & lookup",
    why: "Store match snapshots cheaply; resolve a credential's full history in one RPC call.",
    metric: "Indexed",
  },
];

export function PrimitiveStack() {
  return (
    <section className="relative w-full py-24 lg:py-32">
      <div className="ambient-glow-bottom" />
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="The stack nobody had assembled"
          title="Six Solana primitives. One coherent product."
          subtitle="Each piece is mainnet-proven. The combination is what makes Forge new."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PRIMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
            >
              <GlassPanel variant="soft" rounded="2xl" className="h-full p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className="text-[20px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {p.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-[var(--color-brand-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-700)]">
                    {p.metric}
                  </span>
                </div>
                <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.05em] text-[var(--color-brand-600)]">
                  {p.role}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-ink-secondary)]">
                  {p.why}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
