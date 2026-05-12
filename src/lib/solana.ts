import { Connection, Commitment, clusterApiUrl, PublicKey } from "@solana/web3.js";

export type Cluster = "devnet" | "testnet" | "mainnet-beta";

export const CLUSTER: Cluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as Cluster) ?? "devnet";

export const RPC_ENDPOINT: string =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT?.trim() || clusterApiUrl(CLUSTER);

export const COMMITMENT: Commitment = "confirmed";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_ENDPOINT, {
      commitment: COMMITMENT,
      confirmTransactionInitialTimeout: 60_000,
    });
  }
  return _connection;
}

/** USDC devnet mint (Circle's official devnet USDC). Override via env. */
export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ??
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

/** Forge program id — set after `anchor deploy`. Empty string = not deployed yet. */
export const FORGE_PROGRAM_ID_STR = process.env.NEXT_PUBLIC_FORGE_PROGRAM_ID ?? "";

export function getForgeProgramId(): PublicKey | null {
  if (!FORGE_PROGRAM_ID_STR) return null;
  try {
    return new PublicKey(FORGE_PROGRAM_ID_STR);
  } catch {
    return null;
  }
}

export function explorerAddress(addr: string | PublicKey): string {
  const a = typeof addr === "string" ? addr : addr.toBase58();
  const base = `https://explorer.solana.com/address/${a}`;
  return CLUSTER === "mainnet-beta" ? base : `${base}?cluster=${CLUSTER}`;
}

export function explorerTx(sig: string): string {
  const base = `https://explorer.solana.com/tx/${sig}`;
  return CLUSTER === "mainnet-beta" ? base : `${base}?cluster=${CLUSTER}`;
}

export function shortAddr(addr?: string | PublicKey | null, n = 4): string {
  if (!addr) return "—";
  const s = typeof addr === "string" ? addr : addr.toBase58();
  if (s.length <= n * 2 + 1) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}
