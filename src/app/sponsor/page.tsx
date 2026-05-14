"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export default function SponsorPage() {
  const { connected, publicKey } = useWallet();
  const [name, setName] = useState("");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemPrompt, setProblemPrompt] = useState("");
  const [potUsdc, setPotUsdc] = useState(50);
  const [matchesAvail, setMatchesAvail] = useState(10);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!publicKey) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          wallet: publicKey.toBase58(),
          problemTitle,
          problemPrompt,
          potUsdc,
          matchesAvail,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed");
      const j = await r.json();
      setSubmitted({ id: j.bountyId });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Sponsor mode"
        title={<>Hire by <span className="aurora-text">replaying matches.</span></>}
        subtitle="Post a bounty pot. Devs duel on your problem. You get a leaderboard of replayable, AI-resistance-scored solutions — and the winner gets paid automatically."
      />

      <section className="mx-auto max-w-[1100px] px-6 pb-24 lg:px-12">
        <GlassPanel variant="strong" rounded="2xl" className="p-6 lg:p-10">
          {submitted ? (
            <SuccessCard bountyId={submitted.id} />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <Field label="Sponsor name (your company / community)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="100xDevs Cohort 3.0 · Acme Corp · Solana Foundation…"
                  className="block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-4 outline-none focus:border-[var(--color-brand-500)]"
                />
              </Field>

              <Field label="Problem title">
                <input
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="Implement a sliding-window rate limiter"
                  className="block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-4 outline-none focus:border-[var(--color-brand-500)]"
                />
              </Field>

              <Field label="Problem prompt (Markdown supported)">
                <textarea
                  value={problemPrompt}
                  onChange={(e) => setProblemPrompt(e.target.value)}
                  rows={8}
                  placeholder="## Sliding Window&#10;Implement a rate limiter that…"
                  className="block w-full rounded-[12px] border border-black/10 bg-white/70 p-4 font-mono text-[13px] outline-none focus:border-[var(--color-brand-500)]"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Pot (USDC)">
                  <input
                    type="number"
                    min={5}
                    value={potUsdc}
                    onChange={(e) => setPotUsdc(Number(e.target.value))}
                    className="block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-4 font-mono outline-none focus:border-[var(--color-brand-500)]"
                  />
                </Field>
                <Field label="Matches available">
                  <input
                    type="number"
                    min={1}
                    value={matchesAvail}
                    onChange={(e) => setMatchesAvail(Number(e.target.value))}
                    className="block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-4 font-mono outline-none focus:border-[var(--color-brand-500)]"
                  />
                </Field>
              </div>

              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</p>
              ) : null}

              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[var(--color-ink-muted)]">
                  Pot is locked into a sponsor escrow PDA. Auto-released on each settled match.
                </p>
                {connected ? (
                  <GlassButton onClick={onSubmit} disabled={busy || !name || !problemTitle || !problemPrompt}>
                    {busy ? "Posting…" : "Post bounty"}
                  </GlassButton>
                ) : (
                  <ConnectWalletButton size="md" />
                )}
              </div>
            </div>
          )}
        </GlassPanel>
      </section>
    </>
  );
}

function SuccessCard({ bountyId }: { bountyId: string }) {
  return (
    <div className="text-center">
      <h3
        className="text-[28px] font-bold tracking-[-0.03em] text-emerald-700"
        style={{ fontFamily: "var(--font-display)" }}
      >
        [BOUNTY POSTED] Bounty live on devnet
      </h3>
      <p className="mt-3 text-[14px] text-[var(--color-ink-secondary)]">
        Bounty id <span className="font-mono">{bountyId}</span>. Devs can now match the
        stake from /arena. Settled matches auto-mint credentials linked to your sponsor name.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
