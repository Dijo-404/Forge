"use client";

import { motion } from "framer-motion";
import { GlassLink } from "@/components/glass/GlassButton";
import { SocialProof } from "./SocialProof";
import { HeroOrb } from "./HeroOrb";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden pt-[140px] pb-[100px] lg:pt-[180px] lg:pb-[140px]">
      <div className="ambient-glow" />

      <div className="relative z-10 mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-12">
        {/* LEFT */}
        <div className="flex flex-col items-start gap-8">
          <SocialProof />

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-[44px] sm:text-[58px] lg:text-[75px] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-ink-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Prove your <span className="aurora-text">code is yours.</span>
            <br />
            <span className="text-[var(--color-ink-secondary)]">
              Earn while you ship.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-[560px] text-[18px] leading-[1.55] tracking-[-0.01em] text-[var(--color-ink-secondary)]"
          >
            Forge is a real-time on-chain coding arena. Stake USDC, race a peer
            on a sponsor-posted bounty, and walk away with a{" "}
            <span className="mono-chip">Token-2022</span> credential whose proof
            artifact is a replayable, AI-resistance-scored Solana session — not
            an LLM-graded snapshot.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <GlassLink href="/arena" variant="cta" size="lg">
              Enter the Arena
            </GlassLink>
            <GlassLink href="/manifesto" variant="ghost" size="lg" icon={null}>
              Why Forge?
            </GlassLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--color-ink-muted)]"
          >
            <Stat label="Solana devnet live" dotColor="bg-emerald-500" />
            <Stat label="MagicBlock ER · 10ms commits" dotColor="bg-[var(--color-brand-500)]" />
            <Stat label="Token-2022 credentials" dotColor="bg-[var(--color-forge-orange)]" />
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
          <HeroOrb />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-[6px] w-[6px] rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}
