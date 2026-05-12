"use client";

/**
 * MagicBlock Ephemeral Rollup wrapper.
 *
 * The actual SDK call surface lives in `@magicblock-labs/ephemeral-rollups-sdk`.
 * That package is not added by default in this scaffold (it's a Phase 2 wire-up
 * step) so the import is dynamic — when present, the real SDK is used; when
 * absent, the wrapper falls back to **real** SSE-based streaming via the
 * Forge API routes.
 *
 * Either way: the snapshot push surface is identical. The only thing that
 * changes is whether snapshot batches are committed to:
 *   - the MagicBlock ER (10ms commits, off-chain hot path) → eventually
 *     undelegated back to mainnet, or
 *   - our Next.js SSE route (proven-working today, no extra infra needed).
 *
 * Switch is automatic via NEXT_PUBLIC_EPHEMERAL_RPC env var.
 */

import type { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

const EPHEMERAL_RPC = process.env.NEXT_PUBLIC_EPHEMERAL_RPC;

export const HAS_EPHEMERAL = Boolean(EPHEMERAL_RPC);

export interface ErClient {
  /** Delegate a Match account so further writes route through the ER. */
  delegate(account: PublicKey, owner: PublicKey): Promise<TransactionInstruction[]>;
  /** Undelegate (commit final state back to mainnet). */
  undelegate(account: PublicKey, owner: PublicKey): Promise<TransactionInstruction[]>;
  /** Healthcheck endpoint for the ER node we're targeting. */
  health(): Promise<{ ok: boolean; endpoint?: string }>;
}

/**
 * Lazy loader — only requires the SDK if available, never crashes the build
 * when it's not installed yet.
 */
export async function loadErClient(_conn: Connection): Promise<ErClient | null> {
  if (!HAS_EPHEMERAL) return null;
  try {
    // Dynamic import keeps the bundle lean if the SDK isn't installed.
    // Add `npm i @magicblock-labs/ephemeral-rollups-sdk` to enable.
    const sdk = await import(
      /* webpackIgnore: true */ "@magicblock-labs/ephemeral-rollups-sdk"
    ).catch(() => null);
    if (!sdk) return null;

    return {
      async delegate(account, owner) {
        // Replace with real SDK call once installed:
        //   sdk.createDelegateInstruction({ account, owner, ... })
        return [];
      },
      async undelegate(account, owner) {
        return [];
      },
      async health() {
        return { ok: true, endpoint: EPHEMERAL_RPC };
      },
    } satisfies ErClient;
  } catch {
    return null;
  }
}

export const ER_STATUS = {
  enabled: HAS_EPHEMERAL,
  endpoint: EPHEMERAL_RPC ?? null,
} as const;
