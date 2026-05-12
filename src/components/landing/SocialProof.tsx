"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Props {
  className?: string;
  rating?: number;       // out of 5
  reviewCount?: number;  // shown in label
  label?: string;
}

export function SocialProof({
  className,
  rating = 4.9,
  reviewCount = 2700,
  label,
}: Props) {
  const text =
    label ?? `Rated ${rating}/5 by ${reviewCount.toLocaleString()}+ devs in cohort programs`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "glass-soft inline-flex items-center gap-3 rounded-full px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-[3px]" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < Math.floor(rating)} />
        ))}
      </div>
      <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--color-ink-secondary)]">
        {text}
      </span>
    </motion.div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5l1.95 4.32 4.55.45-3.4 3.18.97 4.55L8 11.7l-4.07 2.3.97-4.55-3.4-3.18 4.55-.45L8 1.5z"
        fill={filled ? "var(--color-forge-orange)" : "rgba(255,128,30,0.20)"}
        stroke={filled ? "var(--color-forge-orange)" : "rgba(255,128,30,0.40)"}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
