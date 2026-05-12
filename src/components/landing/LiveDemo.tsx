"use client";

/**
 * LiveDemo — landing-page interactive showcase.
 * Real Proof-of-Human-Coding math runs on every keystroke; numbers are NOT mocked.
 * The user can also click "Simulate AI paste" to see the score collapse.
 */

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { ProofOfHumanCoding, type ProofSignals } from "@/lib/proof-of-human";
import { SectionHeader } from "./HowItWorks";
import { SkillRadar } from "@/components/SkillRadar";
import { cn } from "@/lib/cn";

const STARTER = `// Two Sum — type your solution here
function twoSum(nums, target) {

}
`;

const AI_PASTE_BLOB = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}
`;

export function LiveDemo() {
  const [code, setCode] = useState(STARTER);
  const phc = useMemo(() => new ProofOfHumanCoding(), []);
  const [signals, setSignals] = useState<ProofSignals>(() => phc.compute());
  const lastLen = useRef(STARTER.length);

  // Recompute signals on every input — real, no debouncing of the math itself
  const recompute = () => setSignals(phc.compute());

  const onChange = (next: string) => {
    const delta = next.length - lastLen.current;
    if (delta > 1) {
      // user pasted (or undo of large block)
      phc.record("p", delta);
    } else if (delta < 0) {
      phc.record("d", -delta);
    } else if (delta === 1) {
      phc.record("k", 1);
    }
    lastLen.current = next.length;
    setCode(next);
    recompute();
  };

  const onPasteFake = () => {
    const next = code.replace(STARTER.trim(), AI_PASTE_BLOB.trim());
    phc.record("p", AI_PASTE_BLOB.length);
    lastLen.current = next.length;
    setCode(next);
    recompute();
  };

  const onReset = () => {
    phc.reset();
    setCode(STARTER);
    lastLen.current = STARTER.length;
    recompute();
  };

  return (
    <section id="live-demo" className="relative w-full py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="Try it now — no signup"
          title="Watch the Human-Code Score react to your typing."
          subtitle="Type a few characters. Then hit ‘Simulate AI paste’. The math is real and runs in your browser — no model API calls, no cloud, no telemetry."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <GlassPanel variant="soft" rounded="2xl" className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-black/5 bg-white/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
                <span className="ml-3 text-[12px] font-medium text-[var(--color-ink-muted)]">
                  forge://demo/two-sum.ts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onPasteFake}
                  className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-medium text-[var(--color-ink-primary)] hover:bg-white"
                >
                  Simulate AI paste
                </button>
                <button
                  onClick={onReset}
                  className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-medium text-[var(--color-ink-primary)] hover:bg-white"
                >
                  Reset
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="block h-[360px] w-full resize-none bg-transparent p-5 font-mono text-[13.5px] leading-relaxed text-[var(--color-ink-primary)] outline-none"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </GlassPanel>

          <SignalsPanel signals={signals} onShare={() => {}} />
        </div>
      </div>
    </section>
  );
}

function SignalsPanel({
  signals,
  onShare,
}: {
  signals: ProofSignals;
  onShare: () => void;
}) {
  const flagColor =
    signals.flag === "human-likely"
      ? "text-emerald-600"
      : signals.flag === "mixed"
      ? "text-amber-600"
      : "text-rose-600";
  const flagBg =
    signals.flag === "human-likely"
      ? "bg-emerald-50"
      : signals.flag === "mixed"
      ? "bg-amber-50"
      : "bg-rose-50";

  return (
    <GlassPanel variant="soft" rounded="2xl" className="p-6">
      <div className="flex items-baseline justify-between">
        <h3
          className="text-[22px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Human-Code Score
        </h3>
        <span className={cn("rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wider", flagColor, flagBg)}>
          {signals.flag.replace("-", " ")}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <motion.span
          key={signals.humanScore}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-[64px] font-bold leading-none tracking-[-0.04em] text-[var(--color-ink-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {signals.humanScore}
        </motion.span>
        <span className="pb-2 text-[18px] text-[var(--color-ink-muted)]">/ 100</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5">
        <motion.div
          initial={false}
          animate={{ width: `${signals.humanScore}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%)",
          }}
        />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
        <Stat label="Typed chars" value={signals.typedChars} />
        <Stat label="Pasted chars" value={signals.pastedChars} />
        <Stat label="Paste ratio" value={`${(signals.pasteRatio * 100).toFixed(1)}%`} />
        <Stat label="Churn ratio" value={`${(signals.churnRatio * 100).toFixed(1)}%`} />
        <Stat label="Interval entropy" value={`${signals.intervalEntropyBits.toFixed(2)} bits`} />
        <Stat label="Burstiness" value={signals.burstinessScore.toFixed(2)} />
      </dl>

      <div className="mt-6 flex items-center justify-center">
        <SkillRadar signals={signals} size={240} />
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
        Forge surfaces raw signals so recruiters set their own threshold. We
        don't claim to detect every AI assist — we make the evidence
        inspectable. <span className="font-semibold text-[var(--color-ink-secondary)]">Transparency is the moat.</span>
      </p>

      <div className="mt-5 flex items-center gap-2">
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify(signals, null, 2));
            onShare();
          }}
        >
          Copy as JSON
        </GlassButton>
      </div>
    </GlassPanel>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[15px] font-semibold text-[var(--color-ink-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
        {value}
      </dd>
    </div>
  );
}
