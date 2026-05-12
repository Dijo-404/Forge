/**
 * Proof of Human Coding — transparent client-side signal capture.
 *
 * This is intentionally NOT a "we use AI to detect AI" black box.
 * We surface the raw signals so recruiters set their own threshold:
 *   1. keystroke-timing entropy (humans cluster, LLM-pasted code doesn't)
 *   2. paste-event ratio (chars pasted vs typed)
 *   3. edit churn (backspace/undo frequency vs net length)
 *
 * All math here is real and runs on every event. No mocks.
 */

export interface KeystrokeEvent {
  /** ms since session start */
  t: number;
  /** "k" = keypress, "p" = paste, "d" = delete/backspace */
  type: "k" | "p" | "d";
  /** char count delta (paste = pasted length, k = +1, d = -1 typically) */
  n: number;
}

export interface ProofSignals {
  totalEvents: number;
  typedChars: number;
  pastedChars: number;
  deletedChars: number;
  pasteRatio: number;          // 0..1, lower = more human
  churnRatio: number;          // deletes / total → humans backspace
  intervalEntropyBits: number; // shannon entropy of inter-keystroke gaps (bits)
  burstinessScore: number;     // 0..1, distinctness of typing rhythm
  humanScore: number;          // composite 0..100 (transparent, see README)
  flag: "human-likely" | "mixed" | "ai-suspected";
}

export class ProofOfHumanCoding {
  private events: KeystrokeEvent[] = [];
  private start = performance.now();

  reset(): void {
    this.events = [];
    this.start = performance.now();
  }

  /** Call from input/keydown/paste handlers in the editor. */
  record(type: KeystrokeEvent["type"], n: number = 1): void {
    this.events.push({
      t: Math.round(performance.now() - this.start),
      type,
      n,
    });
  }

  events_(): readonly KeystrokeEvent[] {
    return this.events;
  }

  /** Compute signals over the current buffer. Pure function on `events`. */
  compute(): ProofSignals {
    const ev = this.events;
    const totalEvents = ev.length;

    if (totalEvents === 0) {
      return zeroSignals();
    }

    let typedChars = 0;
    let pastedChars = 0;
    let deletedChars = 0;
    for (const e of ev) {
      if (e.type === "k") typedChars += e.n;
      else if (e.type === "p") pastedChars += e.n;
      else if (e.type === "d") deletedChars += e.n;
    }

    const writtenChars = typedChars + pastedChars;
    const pasteRatio = writtenChars > 0 ? pastedChars / writtenChars : 0;
    const churnRatio = totalEvents > 0 ? deletedChars / Math.max(1, totalEvents) : 0;

    // Inter-keystroke gaps (only between keypresses — skip pastes)
    const keystrokes = ev.filter((e) => e.type === "k");
    const gaps: number[] = [];
    for (let i = 1; i < keystrokes.length; i++) {
      gaps.push(Math.max(1, keystrokes[i].t - keystrokes[i - 1].t));
    }

    const intervalEntropyBits = shannonEntropyBits(gaps);
    const burstinessScore = burstiness(gaps);

    // Composite — transparent weighted formula. Tuned for sanity, not magic.
    //   Penalise: high paste ratio
    //   Reward:   non-trivial entropy + bursty gaps + some churn
    const pastePenalty = Math.min(1, pasteRatio * 1.6); // 50% paste → 80% penalty
    const entropyReward = Math.min(1, intervalEntropyBits / 3.5); // ~3.5 bits = decent variety
    const burstReward = burstinessScore;
    const churnReward = Math.min(1, churnRatio * 4); // 25% events are deletes → full

    const composite =
      0.45 * (1 - pastePenalty) +
      0.25 * entropyReward +
      0.20 * burstReward +
      0.10 * churnReward;

    const humanScore = Math.round(Math.max(0, Math.min(1, composite)) * 100);

    const flag: ProofSignals["flag"] =
      humanScore >= 70 ? "human-likely" : humanScore >= 45 ? "mixed" : "ai-suspected";

    return {
      totalEvents,
      typedChars,
      pastedChars,
      deletedChars,
      pasteRatio,
      churnRatio,
      intervalEntropyBits,
      burstinessScore,
      humanScore,
      flag,
    };
  }
}

function zeroSignals(): ProofSignals {
  return {
    totalEvents: 0,
    typedChars: 0,
    pastedChars: 0,
    deletedChars: 0,
    pasteRatio: 0,
    churnRatio: 0,
    intervalEntropyBits: 0,
    burstinessScore: 0,
    humanScore: 0,
    flag: "mixed",
  };
}

/** Shannon entropy in bits over a histogram-bucketed sample of gap durations (ms). */
export function shannonEntropyBits(gaps: number[]): number {
  if (gaps.length < 2) return 0;
  // Log-spaced buckets: 0-30, 30-60, 60-120, 120-250, 250-500, 500-1000, 1000-2000, 2000+
  const edges = [30, 60, 120, 250, 500, 1000, 2000, Infinity];
  const counts = new Array(edges.length).fill(0);
  for (const g of gaps) {
    for (let i = 0; i < edges.length; i++) {
      if (g <= edges[i]) {
        counts[i]++;
        break;
      }
    }
  }
  const total = gaps.length;
  let h = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return h;
}

/**
 * Burstiness: coefficient of variation mapped to 0..1.
 * B = (σ - μ) / (σ + μ). Humans → ~0.4-0.7. Pasted-only → ~0 (no gaps).
 * Returns abs() normalised.
 */
export function burstiness(gaps: number[]): number {
  if (gaps.length < 3) return 0;
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance =
    gaps.reduce((acc, g) => acc + (g - mean) ** 2, 0) / gaps.length;
  const sd = Math.sqrt(variance);
  if (sd + mean === 0) return 0;
  const b = (sd - mean) / (sd + mean);
  // Map [-1, 1] → [0, 1] with humans peaking around B≈0.3-0.5
  return Math.max(0, Math.min(1, (b + 1) / 2));
}
