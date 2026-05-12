"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass/GlassPanel";

const STEPS = [
  {
    n: "01",
    title: "Stake",
    text: "Lock USDC into a Forge escrow PDA on Solana. Your opponent matches the stake to start the duel.",
    pill: "Anchor escrow",
  },
  {
    n: "02",
    title: "Code, live",
    text: "Race in Monaco. Every keystroke batches into a MagicBlock ephemeral rollup at ~10 ms. Your opponent watches in real time.",
    pill: "MagicBlock ER",
  },
  {
    n: "03",
    title: "Judge",
    text: "A sandboxed runner executes a hidden test suite. Verdict signature settles the match on mainnet — winner takes the pot.",
    pill: "Trustless verdict",
  },
  {
    n: "04",
    title: "Credential",
    text: "Both players mint a Token-2022 credential whose metadata links to the full replayable session and Human-Code Score.",
    pill: "Token-2022",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative w-full py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="How it works"
          title="From stake to credential in one round."
          subtitle="Four steps, all on-chain. No mocks, no LLM-graded ghosts of code."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <GlassPanel
                variant="soft"
                rounded="2xl"
                className="relative h-full overflow-hidden p-7"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[44px] font-bold leading-none tracking-[-0.04em] text-[var(--color-brand-600)]/90"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.n}
                  </span>
                  <span className="rounded-full border border-black/5 bg-white/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
                    {s.pill}
                  </span>
                </div>
                <h3
                  className="mt-6 text-[26px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-ink-secondary)]">
                  {s.text}
                </p>

                {/* Decorative shimmer */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
                  <span className="block h-full w-[40%] -translate-x-full bg-gradient-to-r from-transparent via-[var(--color-brand-400)] to-transparent animate-shimmer" />
                </span>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-[820px] text-center" : "max-w-[820px]"}>
      {eyebrow ? (
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-700)]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className="mt-3 text-[40px] sm:text-[52px] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-ink-primary)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-[18px] leading-[1.55] tracking-[-0.01em] text-[var(--color-ink-secondary)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
