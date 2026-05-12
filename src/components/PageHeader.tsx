"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <section className="relative w-full overflow-hidden pt-[140px] pb-12 lg:pt-[160px]">
      <div className="ambient-glow" />
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-4"
        >
          {eyebrow ? (
            <span className="rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-700)]">
              {eyebrow}
            </span>
          ) : null}
          <h1
            className="text-[40px] sm:text-[56px] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-ink-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-[760px] text-[18px] leading-[1.55] text-[var(--color-ink-secondary)]">
              {subtitle}
            </p>
          ) : null}
          {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
        </motion.div>
      </div>
    </section>
  );
}
