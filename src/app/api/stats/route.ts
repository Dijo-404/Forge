import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { matchStore } from "@/lib/match-store";
import { RPC_ENDPOINT } from "@/lib/solana";

export const runtime = "nodejs";

export async function GET() {
  const all = matchStore.list();
  const settled = all.filter((m) => m.status === "settled");
  const live = all.filter((m) => m.status === "live");

  let blockHeight: number | null = null;
  let cluster: string | null = null;
  try {
    const conn = new Connection(RPC_ENDPOINT, "confirmed");
    blockHeight = await conn.getBlockHeight();
    cluster = (await conn.getVersion())["solana-core"];
  } catch {
    // RPC may rate-limit on devnet; surface null
  }

  const totalStakeSettled = settled.reduce((acc, m) => acc + m.stakeUsdc * 2, 0);

  return NextResponse.json({
    matches: {
      total: all.length,
      open: all.filter((m) => m.status === "open").length,
      live: live.length,
      settled: settled.length,
    },
    usdc: { totalSettled: totalStakeSettled },
    network: {
      cluster: process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet",
      coreVersion: cluster,
      blockHeight,
    },
    fetchedAt: Date.now(),
  });
}
