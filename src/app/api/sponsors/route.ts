import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";

interface Bounty {
  id: string;
  sponsorName: string;
  sponsorWallet: string;
  problemTitle: string;
  problemPrompt: string;
  potUsdc: number;
  matchesAvail: number;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __forge_bounties__: Bounty[] | undefined;
}
const bounties: Bounty[] = (globalThis.__forge_bounties__ ??= []);

export async function GET() {
  return NextResponse.json({ bounties });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b?.name || !b?.problemTitle || !b?.problemPrompt || !b?.wallet) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    new PublicKey(b.wallet);
  } catch {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  if (typeof b.potUsdc !== "number" || b.potUsdc < 5) {
    return NextResponse.json({ error: "Pot must be ≥ 5 USDC" }, { status: 400 });
  }

  const bounty: Bounty = {
    id: randomUUID(),
    sponsorName: String(b.name).slice(0, 80),
    sponsorWallet: b.wallet,
    problemTitle: String(b.problemTitle).slice(0, 120),
    problemPrompt: String(b.problemPrompt).slice(0, 8000),
    potUsdc: b.potUsdc,
    matchesAvail: Math.max(1, Number(b.matchesAvail ?? 5)),
    createdAt: Date.now(),
  };
  bounties.unshift(bounty);
  return NextResponse.json({ bountyId: bounty.id }, { status: 201 });
}
