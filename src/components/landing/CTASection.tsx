"use client";

import { GlassLink } from "@/components/glass/GlassButton";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="relative w-full py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <GlassPanel
            variant="strong"
            rounded="3xl"
            className="relative overflow-hidden p-10 lg:p-16"
          >
            {/* Decorative orbs */}
            <div
              className="absolute -left-32 -top-24 h-[500px] w-[500px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,132,255,0.35) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
              aria-hidden
            />
            <div
              className="absolute -right-24 -bottom-24 h-[420px] w-[420px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,128,30,0.25) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
              aria-hidden
            />

            <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2
                  className="text-[36px] sm:text-[48px] lg:text-[60px] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-ink-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Stop trusting <span className="aurora-text">résumés.</span>
                  <br />
                  Start <span className="text-[var(--color-brand-700)]">replaying matches.</span>
                </h2>
                <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-[var(--color-ink-secondary)]">
                  Forge turns hiring from "this looks good on paper" into "watch
                  them solve it, on-chain, with the AI signals on display."
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-4 lg:items-end">
                <GlassLink href="/arena" variant="cta" size="lg" className="lg:min-w-[260px]">
                  Get Started Now
                </GlassLink>
                <GlassLink href="/sponsor" variant="ghost" size="lg" icon={null} className="lg:min-w-[260px]">
                  Post a bounty as a sponsor
                </GlassLink>
                <p className="mt-2 text-[12px] text-[var(--color-ink-muted)] lg:text-right">
                  Devnet only · No mainnet funds at risk during the hackathon
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
