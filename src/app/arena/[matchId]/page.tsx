"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ProofOfHumanCoding, type ProofSignals } from "@/lib/proof-of-human";
import type { Match, MatchSnapshot, Problem, JudgeVerdict } from "@/lib/forge-types";
import { shortAddr } from "@/lib/solana";
import { cn } from "@/lib/cn";

// Monaco loaded only on client to avoid SSR weight
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center text-sm text-[var(--color-ink-muted)]">
      Loading editor…
    </div>
  ),
});

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { publicKey, connected } = useWallet();

  const [match, setMatch] = useState<Match | null>(null);
  const [problem, setProblem] = useState<Omit<Problem, "hiddenTests"> | null>(null);
  const [code, setCode] = useState<string>("");
  const [opponentSnap, setOpponentSnap] = useState<MatchSnapshot | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phc = useMemo(() => new ProofOfHumanCoding(), []);
  const [signals, setSignals] = useState<ProofSignals>(() => phc.compute());
  const lastLen = useRef(0);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await fetch(`/api/matches/${matchId}`);
      if (!r.ok) return;
      const j: { match: Match; problem: Omit<Problem, "hiddenTests"> } = await r.json();
      if (cancelled) return;
      setMatch(j.match);
      setProblem(j.problem);
      const starter = j.problem.starterCode[j.problem.language] ?? "";
      setCode(starter);
      lastLen.current = starter.length;
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  // SSE for opponent state + match status
  useEffect(() => {
    const es = new EventSource(`/api/matches/${matchId}/stream`);
    es.addEventListener("snapshot", (e) => {
      try {
        const snap: MatchSnapshot = JSON.parse((e as MessageEvent).data);
        if (snap.player !== publicKey?.toBase58()) {
          setOpponentSnap(snap);
        }
      } catch {}
    });
    es.addEventListener("status", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        setMatch((m) => (m ? { ...m, status: data.status } : m));
      } catch {}
    });
    es.addEventListener("settled", (e) => {
      try {
        const m: Match = JSON.parse((e as MessageEvent).data);
        setMatch(m);
      } catch {}
    });
    return () => es.close();
  }, [matchId, publicKey]);

  // Stream local snapshots back to server every 1s while typing
  useEffect(() => {
    if (!publicKey || !match) return;
    if (match.status !== "live") return;
    const interval = setInterval(() => {
      const sig = phc.compute();
      const snap: Omit<MatchSnapshot, "ts"> & { ts?: number } = {
        matchId: match.id,
        player: publicKey.toBase58(),
        language: (problem?.language ?? "typescript") as MatchSnapshot["language"],
        code,
        humanScore: sig.humanScore,
        pasteRatio: sig.pasteRatio,
        charCount: code.length,
      };
      void fetch(`/api/matches/${match.id}/snapshot`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(snap),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [publicKey, match, code, problem, phc]);

  const onJoin = async () => {
    if (!publicKey || !match) return;
    setError(null);
    const r = await fetch(`/api/matches/${match.id}/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ opponent: publicKey.toBase58() }),
    });
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).error ?? "Join failed");
      return;
    }
    const j = await r.json();
    setMatch(j.match);
  };

  const onCodeChange = (v: string | undefined) => {
    const next = v ?? "";
    const delta = next.length - lastLen.current;
    if (delta > 1) phc.record("p", delta);
    else if (delta < 0) phc.record("d", -delta);
    else if (delta === 1) phc.record("k", 1);
    lastLen.current = next.length;
    setCode(next);
    setSignals(phc.compute());
  };

  const onSubmit = async () => {
    if (!publicKey || !match) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/matches/${match.id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          player: publicKey.toBase58(),
          code,
          signals,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Submit failed");
      const j: { verdict: JudgeVerdict; match: Match } = await r.json();
      setVerdict(j.verdict);
      setMatch(j.match);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!match || !problem) {
    return (
      <PageHeader
        eyebrow="Loading match"
        title="Fetching on-chain state…"
        subtitle="If this hangs, the match id may not exist or the dev server hasn't seeded yet."
      />
    );
  }

  const isParticipant =
    publicKey &&
    (match.challenger === publicKey.toBase58() || match.opponent === publicKey.toBase58());
  const canJoin = match.status === "open" && publicKey && match.challenger !== publicKey.toBase58();

  const blinkUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/actions/duel/${match.id}`
    : "";

  return (
    <>
      <PageHeader
        eyebrow={`Match ${match.id.slice(0, 8)} · ${match.status}`}
        title={problem.title}
        subtitle={
          <>
            Challenger {shortAddr(match.challenger)}{" "}
            {match.opponent ? <>vs {shortAddr(match.opponent)}</> : <>· awaiting opponent</>} ·
            stake <span className="font-mono">{match.stakeUsdc} USDC</span>
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            {!connected ? (
              <ConnectWalletButton size="md" />
            ) : canJoin ? (
              <GlassButton onClick={onJoin}>Match the stake & join</GlassButton>
            ) : null}
            {match.status === "open" ? (
              <button
                onClick={() => void navigator.clipboard.writeText(blinkUrl)}
                className="rounded-[14px] border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-medium text-[var(--color-ink-primary)] hover:bg-white"
                title="Solana Action / Blink endpoint — paste in any X post"
              >
                Copy as Blink ↗
              </button>
            ) : null}
          </div>
        }
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-24 lg:px-12">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <GlassPanel variant="soft" rounded="2xl" className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-black/5 bg-white/40 px-5 py-3">
              <span className="text-[12px] font-medium text-[var(--color-ink-muted)]">
                forge://{match.id}/{problem.language}
              </span>
              <div className="flex items-center gap-2">
                {isParticipant && match.status === "live" ? (
                  <GlassButton onClick={onSubmit} size="sm" disabled={submitting}>
                    {submitting ? "Judging…" : "Submit & judge"}
                  </GlassButton>
                ) : null}
              </div>
            </div>
            <MonacoEditor
              height="520px"
              language={problem.language}
              value={code}
              onChange={onCodeChange}
              options={{
                fontSize: 13.5,
                fontFamily: "JetBrains Mono, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                readOnly: !isParticipant || match.status !== "live",
              }}
              theme="vs"
            />
          </GlassPanel>

          <div className="flex flex-col gap-6">
            <ProblemPanel problem={problem} />
            <SignalCard signals={signals} />
            <OpponentMirror snap={opponentSnap} mePub={publicKey?.toBase58()} />
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl bg-rose-50 p-4 text-[13px] text-rose-700">{error}</div>
        ) : null}

        {verdict ? (
          <GlassPanel variant="strong" rounded="2xl" className="mt-8 p-8">
            <h3
              className="text-[28px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {verdict.passed ? "✓ Verdict: PASS" : "✗ Verdict: FAIL"}
            </h3>
            <p className="mt-2 text-[14px] text-[var(--color-ink-secondary)]">
              {verdict.testsPassed}/{verdict.testsTotal} tests passed in{" "}
              {verdict.runtimeMs}ms.
            </p>
            {verdict.stderr ? (
              <pre className="mt-4 max-h-[200px] overflow-auto rounded-lg bg-black/90 p-4 font-mono text-[12px] text-rose-300">
                {verdict.stderr}
              </pre>
            ) : null}
          </GlassPanel>
        ) : null}
      </section>
    </>
  );
}

function ProblemPanel({ problem }: { problem: Omit<Problem, "hiddenTests"> }) {
  return (
    <GlassPanel variant="soft" rounded="2xl" className="p-5">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-700)]">
        Problem
      </h3>
      <h4
        className="mt-2 text-[18px] font-bold tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {problem.title}
      </h4>
      <pre className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-ink-secondary)]">
        {problem.prompt}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        {problem.tags.map((t) => (
          <span key={t} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-secondary)]">
            #{t}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}

function SignalCard({ signals }: { signals: ProofSignals }) {
  return (
    <GlassPanel variant="soft" rounded="2xl" className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-700)]">
          Live Human-Code Score
        </h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            signals.flag === "human-likely" && "bg-emerald-50 text-emerald-700",
            signals.flag === "mixed" && "bg-amber-50 text-amber-700",
            signals.flag === "ai-suspected" && "bg-rose-50 text-rose-700"
          )}
        >
          {signals.flag.replace("-", " ")}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <motion.span
          key={signals.humanScore}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="text-[44px] font-bold leading-none tracking-[-0.04em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {signals.humanScore}
        </motion.span>
        <span className="pb-1 text-[14px] text-[var(--color-ink-muted)]">/ 100</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-[var(--color-ink-muted)]">
        <span>paste {(signals.pasteRatio * 100).toFixed(0)}%</span>
        <span>churn {(signals.churnRatio * 100).toFixed(0)}%</span>
        <span>H {signals.intervalEntropyBits.toFixed(2)}b</span>
      </div>
    </GlassPanel>
  );
}

function OpponentMirror({
  snap,
  mePub,
}: {
  snap: MatchSnapshot | null;
  mePub?: string;
}) {
  return (
    <GlassPanel variant="soft" rounded="2xl" className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-black/5 bg-white/40 px-5 py-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-700)]">
          Opponent (live)
        </span>
        <span className="text-[11px] text-[var(--color-ink-muted)]">
          {snap ? `${snap.charCount} chars · score ${snap.humanScore ?? "—"}` : "no opponent yet"}
        </span>
      </div>
      <pre className="max-h-[260px] overflow-auto bg-white/60 p-4 font-mono text-[12px] leading-snug text-[var(--color-ink-primary)]">
        {snap?.code ?? "// awaiting opponent's first commit…"}
      </pre>
      {snap && mePub === snap.player ? (
        <p className="border-t border-black/5 bg-amber-50 px-4 py-2 text-[11px] text-amber-700">
          You're seeing your own snapshot — open this URL in a second wallet to see real opponent view.
        </p>
      ) : null}
    </GlassPanel>
  );
}
