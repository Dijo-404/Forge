"use client";

/**
 * Pure-SVG skill radar. No chart library dependency. Inputs are real signals
 * from `proof-of-human.ts`; the geometry is exact (regular n-gon, axes labeled
 * by attribute name).
 */

import type { ProofSignals } from "@/lib/proof-of-human";

interface Axis {
  key: keyof ProofSignals | "none";
  label: string;
  /** Map signal value to 0..1 */
  scale: (s: ProofSignals) => number;
}

const AXES: Axis[] = [
  { key: "humanScore", label: "Human", scale: (s) => s.humanScore / 100 },
  {
    key: "intervalEntropyBits",
    label: "Entropy",
    scale: (s) => Math.min(1, s.intervalEntropyBits / 4),
  },
  { key: "burstinessScore", label: "Bursty", scale: (s) => s.burstinessScore },
  { key: "churnRatio", label: "Churn", scale: (s) => Math.min(1, s.churnRatio * 4) },
  { key: "pasteRatio", label: "No-paste", scale: (s) => 1 - Math.min(1, s.pasteRatio * 1.6) },
  { key: "totalEvents", label: "Volume", scale: (s) => Math.min(1, s.totalEvents / 200) },
];

export function SkillRadar({
  signals,
  size = 240,
  className,
}: {
  signals: ProofSignals;
  size?: number;
  className?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const n = AXES.length;

  const axisPoint = (i: number, mag: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return {
      x: cx + Math.cos(angle) * r * mag,
      y: cy + Math.sin(angle) * r * mag,
    };
  };

  const polyPoints = AXES.map((a, i) => {
    const p = axisPoint(i, a.scale(signals));
    return `${p.x},${p.y}`;
  }).join(" ");

  const ringPoints = (mag: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = axisPoint(i, mag);
      return `${p.x},${p.y}`;
    }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className}>
      {/* concentric rings */}
      {[0.25, 0.5, 0.75, 1].map((m) => (
        <polygon
          key={m}
          points={ringPoints(m)}
          fill="none"
          stroke="rgba(10,17,36,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* axes */}
      {AXES.map((a, i) => {
        const p = axisPoint(i, 1);
        return (
          <g key={a.label}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(10,17,36,0.06)" strokeWidth={1} />
            <text
              x={p.x}
              y={p.y}
              dx={p.x > cx ? 6 : p.x < cx ? -6 : 0}
              dy={p.y > cy ? 14 : p.y < cy ? -6 : 4}
              fontSize={10}
              fontWeight={600}
              textAnchor={p.x > cx ? "start" : p.x < cx ? "end" : "middle"}
              fill="var(--color-ink-secondary)"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {a.label}
            </text>
          </g>
        );
      })}
      {/* polygon */}
      <polygon
        points={polyPoints}
        fill="rgba(0,132,255,0.18)"
        stroke="var(--color-brand-600)"
        strokeWidth={1.5}
      />
      {AXES.map((a, i) => {
        const p = axisPoint(i, a.scale(signals));
        return <circle key={a.label} cx={p.x} cy={p.y} r={3} fill="var(--color-brand-700)" />;
      })}
    </svg>
  );
}
