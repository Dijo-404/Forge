# Forge — Deploy walkthrough

A practical guide to going from `git clone` → "On-chain mode" green light at `/status` in under 30 minutes, using only **devnet SOL** (free).

---

## 0. The SOL math (read this first)

You're working with **devnet SOL**, which is free from faucets but rate-limited. Plan for ~5 devnet SOL total.

| Action | Cost (devnet SOL) | Notes |
|---|---|---|
| Wallet creation + tx fees while running UI | < 0.01 | negligible |
| `anchor deploy` (first time) | **3.0–5.0** | program binary is ~250 KB; rent-exempt |
| `anchor upgrade` (each redeploy) | ~3.0 | old buffer rent eventually returned |
| Each `open_match` / `join_match` ix | ~0.002 | players pay |
| Creating a Token-2022 USDC ATA | ~0.002 | first time per wallet |
| Recover most rent later | refund ~3 SOL | `solana program close <id>` |

**Practical advice:** with 5 SOL you can do **one clean deploy** plus dozens of demo matches. Don't redeploy 10 times — get the Rust right first.

---

## 1. Prerequisites

You need:

```bash
node -v       # ≥ 20
npm -v        # ≥ 10
rustc -V      # ≥ 1.75
solana -V     # ≥ 1.18
anchor -V     # ≥ 0.30.1
```

Quick install commands (skip what you have):

```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Anchor (via avm)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

---

## 2. Create a deploy keypair

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --url devnet
solana address      # this is your deployer pubkey
```

> ⚠️ **Keep `id.json` safe.** It's the program upgrade authority. If you lose it, the deployed program becomes immutable forever. (For hackathons that's actually fine — but be aware.)
>
> This is a *separate* keypair from your Phantom wallet. Your 5 SOL in Phantom is unaffected.

---

## 3. Get devnet SOL

```bash
chmod +x scripts/airdrop.sh
./scripts/airdrop.sh 5
```

The script loops `solana airdrop 2` with backoff until you hit 5 SOL. If the CLI is rate-limited, the script tells you to use https://faucet.solana.com (separate rate limit pool — usually works in parallel).

Other faucets if needed:
- https://faucet.solana.com (web)
- https://faucet.quicknode.com/solana/devnet
- https://www.alchemy.com/faucets/solana-devnet

---

## 4. Get devnet USDC

The Anchor program uses Token-2022 USDC. The default mint in `.env.local.example` points to Circle's devnet Token-2022 mint:

```
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

Faucet: https://faucet.circle.com → choose **Solana devnet** → paste the wallet pubkey from each browser you'll use to demo (player 1 + player 2).

---

## 5. Run the frontend (no on-chain needed yet)

```bash
cd "100x devs proj/forge"
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

You can now:
- Browse the landing page (Liquid Glass per `design.md`)
- Connect Phantom on devnet
- Open matches in `/arena` (off-chain coordination layer)
- Run the judge runner end-to-end
- View `/credentials/<wallet>` and `/recruiter` and `/sponsor` and `/replay`
- Visit `/status` — you'll see "Forge program id: (not set)"

This is enough to demo the **off-chain** flow. The on-chain layer is bonus.

---

## 6. Deploy the Anchor program

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script:
1. Confirms cluster = devnet
2. Verifies balance ≥ 4.5 SOL (warns if not)
3. Runs `anchor build`
4. Runs `anchor deploy --provider.cluster devnet`
5. Prints the program id and the `.env.local` line to add

If you'd rather do it manually:

```bash
anchor build
anchor deploy --provider.cluster devnet
anchor keys list                # prints the program id
```

Add the printed id to `.env.local`:

```
NEXT_PUBLIC_FORGE_PROGRAM_ID=<paste>
```

Restart `npm run dev`.

---

## 7. Verify the on-chain mode

Open http://localhost:3000/status. You should see:

- ✅ Cluster: devnet
- ✅ Solana core: 1.18.x
- ✅ Block height (live)
- ✅ USDC mint: live
- ✅ Forge program id: deployed
- Phase 3 row should flip to ✅

Open `/arena`. The "Open match" button now has a green caption: **"On-chain mode · program <id>"**. When you click it, the wallet will surface a real Solana transaction to sign — that locks USDC into the escrow PDA.

---

## 8. Seed the demo (optional, for screenshots / Loom)

Pre-populate the Arena with three sample matches:

```bash
chmod +x scripts/seed-demo.sh
./scripts/seed-demo.sh                   # uses http://localhost:3000
./scripts/seed-demo.sh https://your-deploy.vercel.app   # or your prod URL
```

These are off-chain coordination records — judges/visitors land on a non-empty Arena.

---

## 9. Recovery: free up SOL between iterations

If you redeploy a fresh program (rather than upgrading):

```bash
solana program close <OLD_PROGRAM_ID> --bypass-warning
```

This returns ~3 SOL of rent to your wallet. Useful when iterating.

---

## 10. Troubleshooting

**"Account does not have enough SOL to perform the operation"**
→ Top up with `./scripts/airdrop.sh 5`. Anchor deploy needs the rent up-front in one tx.

**"Transaction simulation failed: Blockhash not found"**
→ Devnet RPC is overloaded. Either retry, or set `NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_KEY` in `.env.local`. Helius free tier is more than enough.

**`anchor build` fails on Windows**
→ Anchor is happiest on Linux/macOS. On Windows, use **WSL2 (Ubuntu)** for the build/deploy step. The Next.js frontend works fine on native Windows.

**Phantom shows "transaction unsupported" for the Action / Blink**
→ The `Copy as Blink ↗` URL needs to be tested in a Dialect-aware client (X with Phantom extension, or https://dial.to debug tool). Standard wallet popups don't render Action descriptors.

**Player can't see opponent's keystrokes in the live duel**
→ Make sure both browsers are on the same `npm run dev` instance (same `localhost:3000`). The SSE bus is in-process.
→ For a deployed Vercel build, the SSE bus needs Redis (Upstash) — see `lib/match-store.ts` comments.

**`anchor keys list` shows a different id than what was deployed**
→ Anchor 0.30 generates a fresh program keypair on first build. If you re-build after editing `declare_id!`, the on-chain account won't match. Run `anchor keys sync` to fix.

---

## 11. Going to mainnet (post-hackathon, optional)

1. Audit the Anchor program (consider Sec3 / OtterSec).
2. Provision a stable judge oracle keypair (HSM-backed ideally).
3. Swap `NEXT_PUBLIC_USDC_MINT` to the real USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
4. Switch the Token program to `TOKEN_PROGRAM_ID` (not Token-2022) if not using extensions; or keep Token-2022 and ensure mainnet USDC has the right account interface.
5. `anchor deploy --provider.cluster mainnet` — this *will* cost ~3-5 mainnet SOL.

But for the 100xDevs Frontier judging, **stay on devnet**. That's where judges test.
