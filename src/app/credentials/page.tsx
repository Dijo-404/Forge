"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton, GlassLink } from "@/components/glass/GlassButton";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { shortAddr } from "@/lib/solana";

export default function CredentialsIndex() {
  const { publicKey } = useWallet();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (publicKey) setSearch(publicKey.toBase58());
  }, [publicKey]);

  return (
    <>
      <PageHeader
        eyebrow="Credentials"
        title={<>The on-chain résumé you can <span className="aurora-text">replay.</span></>}
        subtitle="Every Forge match mints a Token-2022 credential to both players. Search any wallet to view their dueling history, Human-Code Scores, and replay links."
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-24 lg:px-12">
        <GlassPanel variant="strong" rounded="2xl" className="p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Wallet pubkey
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Paste a Solana wallet…"
                className="mt-1.5 block h-12 w-full rounded-[12px] border border-black/10 bg-white/70 px-4 font-mono text-[14px] outline-none focus:border-[var(--color-brand-500)]"
              />
            </label>
            <GlassLink
              href={search ? `/credentials/${search}` : "#"}
              variant="cta"
              size="md"
            >
              View dossier
            </GlassLink>
          </div>

          {!publicKey ? (
            <div className="mt-5 flex items-center justify-between rounded-[14px] border border-black/5 bg-white/60 p-4">
              <p className="text-[13px] text-[var(--color-ink-secondary)]">
                Connect to auto-fill your own wallet.
              </p>
              <ConnectWalletButton size="sm" />
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-between rounded-[14px] border border-black/5 bg-white/60 p-4">
              <p className="text-[13px] text-[var(--color-ink-secondary)]">
                Your wallet: <span className="font-mono">{shortAddr(publicKey)}</span>
              </p>
              <Link
                href={`/credentials/${publicKey.toBase58()}`}
                className="text-[13px] font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                Open my dossier →
              </Link>
            </div>
          )}
        </GlassPanel>

        <FeaturedDevs />
      </section>
    </>
  );
}

function FeaturedDevs() {
  // Read from API; fallback empty if no on-chain credentials yet
  const [list, setList] = useState<{ wallet: string; matches: number; bestScore: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    fetch("/api/credentials/featured")
      .then((r) => r.json())
      .then((j) => {
        if (!cancel) setList(j.featured ?? []);
      })
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="mt-12">
      <h3
        className="text-[20px] font-bold tracking-[-0.03em] text-[var(--color-ink-primary)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Top forgers
      </h3>
      <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
        Computed from settled matches in this devnet instance.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="rounded-xl bg-white/60 p-5 text-[13px] text-[var(--color-ink-muted)]">
            Loading on-chain leaderboard…
          </p>
        ) : list.length === 0 ? (
          <p className="rounded-xl bg-white/60 p-5 text-[13px] text-[var(--color-ink-muted)]">
            No settled matches yet on this network. Open a match in /arena to seed this list.
          </p>
        ) : (
          list.map((d) => (
            <GlassPanel key={d.wallet} variant="soft" rounded="2xl" className="p-5">
              <div className="flex items-start justify-between">
                <p className="font-mono text-[14px] font-semibold">{shortAddr(d.wallet)}</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  best {d.bestScore}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">
                {d.matches} settled matches
              </p>
              <Link
                href={`/credentials/${d.wallet}`}
                className="mt-4 inline-block text-[13px] font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                View dossier →
              </Link>
            </GlassPanel>
          ))
        )}
      </div>
    </div>
  );
}
