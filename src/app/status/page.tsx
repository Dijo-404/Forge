"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassLink } from "@/components/glass/GlassButton";
import { CLUSTER, FORGE_PROGRAM_ID_STR, RPC_ENDPOINT, USDC_MINT } from "@/lib/solana";
import { ER_STATUS } from "@/lib/magicblock-er";

interface NetInfo {
  blockHeight: number | null;
  version: string | null;
  programDeployed: boolean;
  usdcMintExists: boolean;
}

export default function StatusPage() {
  const { connection } = useConnection();
  const [info, setInfo] = useState<NetInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [bh, ver, mint, prog] = await Promise.all([
          connection.getBlockHeight().catch(() => null),
          connection.getVersion().then((v) => v["solana-core"]).catch(() => null),
          connection.getAccountInfo(USDC_MINT).catch(() => null),
          FORGE_PROGRAM_ID_STR
            ? connection
                .getAccountInfo(new (await import("@solana/web3.js")).PublicKey(FORGE_PROGRAM_ID_STR))
                .catch(() => null)
            : null,
        ]);
        if (cancel) return;
        setInfo({
          blockHeight: bh,
          version: ver,
          programDeployed: Boolean(prog),
          usdcMintExists: Boolean(mint),
        });
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [connection]);

  return (
    <>
      <PageHeader
        eyebrow="System status"
        title={<>Live <span className="aurora-text">diagnostics.</span></>}
        subtitle="Real reads against the configured Solana cluster — no cached values."
        actions={
          <GlassLink href="/arena" variant="cta" size="md">
            Open the Arena
          </GlassLink>
        }
      />

      <section className="mx-auto grid max-w-[1000px] gap-5 px-6 pb-24 lg:px-12">
        <Row label="Cluster" value={CLUSTER} ok={true} />
        <Row label="RPC endpoint" value={RPC_ENDPOINT} mono ok={true} />
        <Row label="Solana core" value={info?.version ?? "checking…"} ok={!!info?.version} mono />
        <Row label="Block height" value={info?.blockHeight?.toLocaleString() ?? "checking…"} ok={!!info?.blockHeight} mono />
        <Row
          label="USDC mint"
          value={USDC_MINT.toBase58()}
          ok={!!info?.usdcMintExists}
          okText={info?.usdcMintExists ? "live" : "not found on this cluster"}
          mono
        />
        <Row
          label="Forge program id"
          value={FORGE_PROGRAM_ID_STR || "(not set)"}
          ok={!!info?.programDeployed}
          okText={
            !FORGE_PROGRAM_ID_STR
              ? "set NEXT_PUBLIC_FORGE_PROGRAM_ID after `anchor deploy`"
              : info?.programDeployed
              ? "deployed"
              : "id set but account not found on cluster"
          }
          mono
        />
        <Row
          label="MagicBlock ER"
          value={ER_STATUS.endpoint ?? "(not configured)"}
          ok={ER_STATUS.enabled}
          okText={ER_STATUS.enabled ? "configured" : "SSE fallback active"}
          mono
        />

        {error ? (
          <div className="rounded-xl bg-rose-50 p-4 text-[13px] text-rose-700">{error}</div>
        ) : null}

        <GlassPanel variant="soft" rounded="2xl" className="p-6 mt-6">
          <h3 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--color-brand-700)]">
            Phase status
          </h3>
          <ul className="mt-3 space-y-2 text-[14px] text-[var(--color-ink-secondary)]">
            <li>✅ Phase 1 — Foundation (UI, APIs, wallet, judge)</li>
            <li>✅ Phase 2 — Anchor client, USDC, ER wrapper, Action endpoint, replay, radar, stats</li>
            <li>{info?.programDeployed ? "✅" : "⏳"} Phase 3 — Anchor deploy + on-chain settle round-trip</li>
            <li>⏳ Phase 4 — Token-2022 credential mint + Walrus replay storage</li>
            <li>⏳ Phase 5 — MagicBlock ER hot path + ZK-Compressed cohort batches</li>
            <li>⏳ Phase 6 — Loom demos + final polish + submit</li>
          </ul>
        </GlassPanel>
      </section>
    </>
  );
}

function Row({
  label,
  value,
  ok,
  okText,
  mono,
}: {
  label: string;
  value: string | number;
  ok: boolean;
  okText?: string;
  mono?: boolean;
}) {
  return (
    <GlassPanel variant="soft" rounded="lg" className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          {label}
        </p>
        <p
          className={
            "mt-1 text-[15px] " +
            (mono ? "font-mono break-all text-[var(--color-ink-primary)]" : "text-[var(--color-ink-primary)]")
          }
        >
          {value}
        </p>
      </div>
      <span
        className={
          "shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold " +
          (ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
        }
      >
        {okText ?? (ok ? "ok" : "pending")}
      </span>
    </GlassPanel>
  );
}
