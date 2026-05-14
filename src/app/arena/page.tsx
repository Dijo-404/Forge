"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton, GlassLink } from "@/components/glass/GlassButton";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { Match, Problem } from "@/lib/forge-types";
import { explorerTx, shortAddr } from "@/lib/solana";
import { usdcToRaw } from "@/lib/usdc";
import { useForgeProgram } from "@/hooks/useForgeProgram";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { openMatchOnChain, newJudgeOracle } from "@/lib/anchor-client";
import { sha256 } from "@/lib/hash";

export default function ArenaPage() {
  const { publicKey, connected } = useWallet();
  const { client, isDeployed, programId } = useForgeProgram();
  const { ui: usdc } = useUsdcBalance();
  const [matches, setMatches] = useState<Match[]>([]);
  const [problems, setProblems] = useState<Omit<Problem, "hiddenTests">[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [stake, setStake] = useState(1);
  const [problemId, setProblemId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastTxSig, setLastTxSig] = useState<string | null>(null);

  // Initial load + SSE-driven refresh
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [m, p] = await Promise.all([
          fetch("/api/matches").then((r) => r.json()),
          fetch("/api/problems").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setMatches(m.matches ?? []);
        setProblems(p.problems ?? []);
        if (!problemId && p.problems?.[0]) setProblemId(p.problems[0].id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const es = new EventSource("/api/matches/stream");
    es.addEventListener("match", () => load());
    es.onerror = () => {
      // browser will auto-retry; we just keep going
    };
    return () => {
      cancelled = true;
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    if (!publicKey) return;
    setCreating(true);
    setError(null);
    setLastTxSig(null);
    try {
      // 1) Create the match record in our coordination layer (always works)
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challenger: publicKey.toBase58(),
          problemId,
          stakeUsdc: stake,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const { match } = await res.json();

      // 2) If the Anchor program is deployed, ALSO dispatch the real on-chain
      //    `open_match` ix to lock USDC into the escrow PDA.
      if (client && isDeployed) {
        try {
          const stakeRaw = new BN(usdcToRaw(stake).toString());
          const problemHash = await sha256(problemId);
          const judge = newJudgeOracle();
          const { sig, matchPda } = await openMatchOnChain(client, {
            problemIdHash: problemHash,
            stakeRaw,
            judgeOracle: judge.publicKey,
          });
          setLastTxSig(sig);
          // Backfill the off-chain record with on-chain refs
          await fetch(`/api/matches/${match.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              escrowPda: matchPda.toBase58(),
              openTxSig: sig,
            }),
          }).catch(() => {});
        } catch (chainErr: unknown) {
          // The match exists in coord but on-chain failed — surface clearly
          throw new Error(
            `On-chain open_match failed: ${chainErr instanceof Error ? chainErr.message : String(chainErr)}`
          );
        }
      }

      window.location.href = `/arena/${match.id}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create match");
    } finally {
      setCreating(false);
    }
  };

  const open = matches.filter((m) => m.status === "open");
  const live = matches.filter((m) => m.status === "live" || m.status === "judging");
  const settled = matches.filter((m) => m.status === "settled");

  return (
    <>
      <PageHeader
        eyebrow="The Arena"
        title={<>Pick a fight. <span className="aurora-text">Stake your code.</span></>}
        subtitle="Open matches are waiting for a second player. Live matches are mid-duel — open one to spectate. Every action you see below is on-chain."
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-24 lg:px-12">
        {/* Create panel */}
        <GlassPanel variant="strong" rounded="2xl" className="p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2
                className="text-[26px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Open a duel
              </h2>
              <p className="mt-2 text-[14px] text-[var(--color-ink-secondary)]">
                Pick a problem and a stake. Forge will derive an escrow PDA and
                wait for an opponent. You can cancel and refund any time before
                someone joins.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
                <label className="block">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Problem
                  </span>
                  <select
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                    className="mt-1.5 block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-3 text-[14px] outline-none focus:border-[var(--color-brand-500)]"
                  >
                    {problems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} · {p.difficulty}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Stake (USDC)
                  </span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={stake}
                    onChange={(e) => setStake(Math.max(0.1, Number(e.target.value)))}
                    className="mt-1.5 block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-3 font-mono text-[14px] outline-none focus:border-[var(--color-brand-500)]"
                  />
                </label>
              </div>

              {error ? (
                <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                  {error}
                </p>
              ) : null}

              {lastTxSig ? (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
                  [on-chain] ·{" "}
                  <a href={explorerTx(lastTxSig)} target="_blank" rel="noreferrer" className="underline">
                    view tx
                  </a>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-stretch justify-end gap-3">
              <div className="flex items-center justify-between rounded-[12px] border border-black/5 bg-white/60 px-3 py-2 text-[12px]">
                <span className="text-[var(--color-ink-muted)]">USDC balance</span>
                <span className="font-mono font-semibold text-[var(--color-ink-primary)]">
                  {usdc !== null ? usdc.toFixed(2) : "—"}
                </span>
              </div>
              {connected ? (
                <GlassButton onClick={onCreate} disabled={creating || !problemId} size="lg">
                  {creating ? "Opening match…" : "Open match"}
                </GlassButton>
              ) : (
                <ConnectWalletButton fullWidth size="md" />
              )}
              <p className="text-[12px] text-[var(--color-ink-muted)]">
                {isDeployed ? (
                  <>On-chain mode · program <span className="font-mono">{shortAddr(programId, 4)}</span></>
                ) : (
                  <>Coordination mode · set <span className="font-mono">NEXT_PUBLIC_FORGE_PROGRAM_ID</span> after <span className="font-mono">anchor deploy</span> for on-chain escrow.</>
                )}
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Open / live tables */}
        <div className="mt-14 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <MatchList title="Open matches" empty="No open matches yet — open one above." matches={open} accent="bg-amber-500" cta="Join" loading={loading} />
          <MatchList title="Live matches" empty="No live duels right now." matches={live} accent="bg-[var(--color-brand-500)]" cta="Spectate" loading={loading} />
        </div>

        <div className="mt-10">
          <MatchList title="Recently settled" empty="Settled matches show up here." matches={settled.slice(0, 8)} accent="bg-emerald-500" cta="Replay" loading={loading} />
        </div>
      </section>
    </>
  );
}

function MatchList({
  title,
  empty,
  matches,
  accent,
  cta,
  loading,
}: {
  title: string;
  empty: string;
  matches: Match[];
  accent: string;
  cta: string;
  loading: boolean;
}) {
  return (
    <GlassPanel variant="soft" rounded="2xl" className="p-6">
      <div className="flex items-center justify-between">
        <h3
          className="text-[20px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-[var(--color-ink-secondary)]">
          {loading ? "—" : matches.length}
        </span>
      </div>

      <div className="mt-5">
        {!loading && matches.length === 0 ? (
          <p className="rounded-xl bg-white/60 p-5 text-[14px] text-[var(--color-ink-muted)]">{empty}</p>
        ) : null}

        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {matches.map((m) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between rounded-[14px] border border-black/5 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${accent}`} />
                    <div>
                      <p className="font-mono text-[13px] font-semibold text-[var(--color-ink-primary)]">
                        {m.problemId}
                      </p>
                      <p className="text-[12px] text-[var(--color-ink-muted)]">
                        {shortAddr(m.challenger)} {m.opponent ? `vs ${shortAddr(m.opponent)}` : "· awaiting opponent"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-[var(--color-brand-50)] px-3 py-1 font-mono text-[12px] font-semibold text-[var(--color-brand-700)]">
                      {m.stakeUsdc} USDC
                    </span>
                    <Link
                      href={`/arena/${m.id}`}
                      className="rounded-full bg-[var(--color-ink-primary)] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--color-brand-700)]"
                    >
                      {cta}
                    </Link>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className="mt-5 flex justify-end">
        <GlassLink href="/credentials" variant="ghost" size="sm" icon={null}>
          View credentials
        </GlassLink>
      </div>
    </GlassPanel>
  );
}
