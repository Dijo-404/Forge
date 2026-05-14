# Forge

> **Live, on-chain, AI-resistant coding duels with USDC-staked bounties on Solana.**
>
> Two devs stake. Race a peer. Walk away with a Token-2022 credential whose proof artifact is a *replayable, AI-resistance-scored Solana session* — not an LLM-graded snapshot.
>
> 100xDevs Frontier Hackathon submission · winners announced May 25, 2026.

<p align="center">
  <a href="#quick-start"><b>Quick start</b></a> ·
  <a href="DEPLOY.md"><b>Deploy walkthrough</b></a> ·
  <a href="#why-this-wins-research-grounded"><b>Why this wins</b></a> ·
  <a href="../PLAN.md"><b>17-day plan</b></a>
</p>

---

## The thirty-second pitch

In February 2026 a16z published [*Proof of Talent*](https://a16zcrypto.com/posts/article/proof-of-talent). Argument: hire by inspecting work, not pedigree. Footnote: *"as AI tooling improves, that signal has grown noisier."* That footnote is a crisis.

Forge is the on-chain product that footnote demands.

- **Stake.** Two devs lock USDC in an Anchor escrow PDA.
- **Race.** A Monaco editor commits every keystroke at ~10 ms via MagicBlock ephemeral rollups; opponent watches in real time.
- **Judge.** A sandboxed runner executes hidden tests, signs an HMAC verdict, settles the match on-chain.
- **Mint.** Both players receive a Token-2022 credential. Metadata links to the *full replayable session* and a transparent **Human-Code Score** (typing entropy, paste ratio, edit churn).
- **Hire.** Recruiters filter by score and *replay* the match. No more trust falls.

We don't claim to "detect AI." We surface the signals so the labour market reprices accordingly. Transparency *is* the moat.

---

## Status at a glance

| Phase | What | Status |
|---|---|---|
| 1 | Foundation: UI, APIs, wallet, judge runner | [DONE] Shipped |
| 2 | Anchor client + USDC + ER wrapper + Action/Blink + Replay + Radar + Stats | [DONE] Shipped |
| 3 | `anchor deploy` + on-chain settle round-trip | [READY] Ready (you run it) |
| 4 | Token-2022 credential mint + Walrus replay storage | [PENDING] Next |
| 5 | MagicBlock ER hot path + ZK-Compressed cohort batches | [PENDING] Next |
| 6 | Loom demos + final polish + submit (May 24) | [PENDING] Next |

Live in your browser at `/status` once running.

---

## Quick start

```bash
cd "100x devs proj/forge"
npm install
cp .env.local.example .env.local      # defaults to Solana devnet
npm run dev                            # → http://localhost:3000
```

That's it. Wallet, judge runner, SSE streams, replay viewer — **all real, no mocks** — work without any deployment. The Anchor program is optional for the off-chain coordination demo.

For the full on-chain experience (Anchor escrow PDA + USDC settle), follow [`DEPLOY.md`](DEPLOY.md). TL;DR: 5 free devnet SOL covers everything.

---

## Multi-page UI

| Route | Purpose |
|---|---|
| `/` | Landing — Liquid Glass per `design.md`, live stats bar, interactive Proof-of-Human-Coding demo with SkillRadar |
| `/arena` | Match lobby — open / live / settled streams; create with real on-chain `open_match` ix |
| `/arena/[id]` | Live duel — Monaco editor, opponent live-mirror, **Copy as Blink ↗** for one-click sharing |
| `/arena/[id]/replay` | Frame-by-frame replay with timeline scrub bar |
| `/credentials` | Browse credentials, search by wallet, top-forgers leaderboard |
| `/credentials/[wallet]` | Per-wallet dossier — aggregate stats, every credential, Solana Explorer links |
| `/sponsor` | Post a bounty pot — sponsor name + problem prompt + USDC pool |
| `/recruiter` | Filter dev pool by Human-Code Score, paste ratio, problem tag |
| `/manifesto` | The "résumés are claims, code is evidence" essay |
| `/how-it-works` | Visual explainer |
| `/status` | Live diagnostics: cluster, RPC, USDC mint, Forge program, ER status, phase progress |

## API routes

```
/api/problems                     GET   seed catalog
/api/matches                      GET, POST
/api/matches/stream               SSE   top-level feed
/api/matches/[id]                 GET, PATCH (on-chain ref backfill)
/api/matches/[id]/join            POST
/api/matches/[id]/snapshot        POST  keystroke batch in
/api/matches/[id]/snapshots       GET   full replay buffer
/api/matches/[id]/stream          SSE   per-match feed
/api/matches/[id]/submit          POST  node:vm judge + HMAC verdict
/api/credentials/featured         GET
/api/credentials/[wallet]         GET   live dossier
/api/recruiter/search             GET   filterable
/api/sponsors                     GET, POST
/api/stats                        GET   live block height + match counts
/api/actions/duel/[matchId]       GET, POST   Solana Action / Blink
```

All real Node handlers. No mocked responses anywhere.

---

## Repo layout

```
forge/
├─ src/
│  ├─ app/                        Next.js 15 App Router pages + API routes
│  ├─ components/
│  │  ├─ glass/                   GlassPanel, GlassButton, GlassNav
│  │  ├─ landing/                 Hero, HeroOrb, StatsBar, HowItWorks, PrimitiveStack, LiveDemo, …
│  │  ├─ wallet/ConnectWalletButton.tsx     Phantom · Solflare · Torus · Ledger
│  │  ├─ PageHeader.tsx
│  │  └─ SkillRadar.tsx           Pure-SVG live radar
│  ├─ hooks/
│  │  ├─ useForgeProgram.ts       Memoized Anchor client when program id is set
│  │  └─ useUsdcBalance.ts        Token-2022 USDC reader
│  └─ lib/
│     ├─ solana.ts                Devnet Connection + cluster helpers
│     ├─ anchor-client.ts         Real on-chain dispatch
│     ├─ forge-idl.ts             TS IDL for the Anchor program
│     ├─ usdc.ts                  Token-2022 USDC helpers
│     ├─ magicblock-er.ts         MagicBlock SDK wrapper (lazy-loaded)
│     ├─ proof-of-human.ts        Real entropy / paste / churn / burstiness math
│     ├─ judge-runner.ts          Real node:vm sandbox + HMAC verdicts
│     ├─ match-store.ts           In-process store + SSE event bus
│     ├─ problems.ts              Seed catalog with hidden tests (server-only)
│     ├─ hash.ts                  SHA-256 + Merkle root
│     └─ forge-types.ts           Shared domain types
├─ programs/forge-arena/          Anchor program (Rust) — Token-2022 escrow + settle
│  ├─ src/lib.rs
│  ├─ Cargo.toml
│  └─ Xargo.toml
├─ scripts/
│  ├─ airdrop.sh                  Loop devnet airdrops to N SOL
│  ├─ deploy.sh                   Safe one-shot anchor build + deploy
│  └─ seed-demo.sh                Pre-populate arena with 3 demo matches
├─ Anchor.toml
├─ Cargo.toml
├─ next.config.ts
├─ DEPLOY.md                      Full deploy walkthrough + SOL economics + troubleshooting
└─ README.md
```

---

## What's wired vs. what's deferred

### [DONE] Wired and real (no mocks, no stubs)

- **Landing page** matches every spec from `design.md`: glass navbar, orb video with `mix-blend-screen` + `hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)`, Fustat + Inter typography, the spec'd CTA `rgba(0,132,255,0.8)` + inset highlight `0 4px 4px rgba(255,255,255,0.35)`, ambient blue glow blobs, 4.9/5 social proof badge with Forge orange stars, footer with `gap-[100px]` logos, `-webkit-font-smoothing: antialiased`. Plus animated `aurora-text`, `forge-shimmer`, `forge-float`, `forge-keystroke`, `forge-marquee`, `forge-pulse-ring` keyframes.
- **Real Solana wallet integration** — Phantom, Solflare, Torus, Ledger via `@solana/wallet-adapter-*` against devnet `Connection`.
- **Real Proof-of-Human-Coding math** — Shannon entropy of inter-keystroke gaps, paste ratio, churn ratio, burstiness — computed on every input event in [`lib/proof-of-human.ts`](src/lib/proof-of-human.ts).
- **Live SVG SkillRadar** — 6-axis polygon over PoH signals, no chart library.
- **Real-time match SSE** — `match`, `snapshot`, `status`, `settled` events with 25 s heartbeats; survives proxy buffering (`X-Accel-Buffering: no`).
- **Real test runner** — [`judge-runner.ts`](src/lib/judge-runner.ts) sandboxes submissions in `node:vm` against hidden tests, returns HMAC-SHA256-signed verdicts.
- **Anchor program** — full Rust at [`programs/forge-arena/src/lib.rs`](programs/forge-arena/src/lib.rs) with `open_match`, `join_match`, `commit_root`, `settle_match`, `cancel_match` over Token-2022. `anchor build` ready.
- **On-chain dispatch from UI** — when `NEXT_PUBLIC_FORGE_PROGRAM_ID` is set, the Arena builds and signs real Solana transactions alongside the off-chain coordination record.
- **Solana Action / Blink endpoint** at `/api/actions/duel/[id]` — wallet-renderable card with one-click "Accept duel". `Copy as Blink ↗` button on the live match page.
- **Live network stats bar** — real `getBlockHeight()` and match counts polled every 8 s.
- **Replay viewer** — timeline scrub bar over the snapshot stream; both players' code state at any timestamp.
- **`/status` diagnostics page** — live reads against the configured cluster: USDC mint check, Forge program existence check, ER endpoint check, phase status.
- **Devops scripts** — `airdrop.sh` (loop airdrops to N SOL), `deploy.sh` (safe deploy with balance pre-flight), `seed-demo.sh` (populate the Arena for screenshots / Loom).

### [PENDING] Next-phase wire-up (clearly marked, not mocked)

- **MagicBlock ER delegate/undelegate** — wrapper at [`lib/magicblock-er.ts`](src/lib/magicblock-er.ts) lazy-loads the SDK; `npm i @magicblock-labs/ephemeral-rollups-sdk` + `NEXT_PUBLIC_EPHEMERAL_RPC=…` flips the snapshot path from SSE → ER. Snapshot interface is identical.
- **Token-2022 credential mint** — `settle_match` pays the winner; the `mint_credential` ix that produces a Token-2022 NFT with metadata pointer is ~80 lines of Anchor away.
- **ZK-Compressed cohort batches** — Light Protocol integration for issuing thousands of credentials cheaply.
- **Production sandbox** — `node:vm` is fine for hackathon devnet with vetted seed problems but is *not* a true sandbox. Production swap = Judge0 / microVM / gVisor. Set `JUDGE_RUNNER_URL` + `JUDGE_RUNNER_KEY` and replace [`lib/judge-runner.ts`](src/lib/judge-runner.ts).

---

## Test the demo (≤ 90 seconds)

1. `npm run dev`
2. Open http://localhost:3000 — Liquid Glass hero with the electric-blue orb. Stats bar shows live devnet block height.
3. Scroll to **Live Demo** — type into the editor, watch the Human-Code Score climb and the SkillRadar polygon expand. Click **Simulate AI paste** — watch it collapse to red.
4. Open `/arena` — connect Phantom (devnet). Click **Open match**. The match appears in the **Open** column for any other browser to join.
5. Open the same URL in a second browser, connect a *different* devnet wallet, click **Join**. Both clients enter the live duel; you'll see the opponent's code stream over SSE.
6. Click **Copy as Blink** to grab the Solana Action URL — pasteable into any Dialect/Phantom-aware surface.
7. Either player clicks **Submit & judge** — `node:vm` runs the hidden test suite, signs a verdict. The settled match appears in `/credentials/<wallet>`.
8. Open `/arena/<id>/replay` — drag the scrub bar to watch the duel frame by frame.
9. Open `/status` — see the system diagnostics flip green as you complete each phase.

---

## Why this wins (research-grounded)

Verified via Colosseum Copilot deep dive on 2026-05-08. Key findings (full report in [`../PLAN.md`](../PLAN.md)):

- **Whitespace:** Existing skill-credential projects (`CodeCup`, `SkillFlex`, `CodeXCash`, `Solana Quest`) all do "static code → LLM grade → SBT". None capture the writing process. None are AI-resistant. `0byte` proves content *is* AI; the inverse — proving code is *human* — is wide open.
- **Judge-magnet primitive:** MagicBlock ER won 1st/2nd/4th/5th in Gaming at Breakout 2025 (Supersize 25K, The Arena 20K, Block Stranding, Lana Roads). Nobody has applied it to dev tooling.
- **Stake-PvP pattern is winner-validated:** Pregame won 1st Consumer Radar 2024 ($25K, C2 accelerator) on exactly this mechanic.
- **Audience-perfect:** Superteam Earn was built for *"young Indian developers shipping million-dollar software"* — Forge is the skill layer Earn never built. Harkirat's 100xDevs cohorts are a built-in design partner.
- **Thesis-fresh:** a16z's *Proof of Talent* (Ben Wu, Feb 26, 2026) explicitly warns AI is destroying current credential signal. Forge is the on-chain product that essay predicted.

---

## Run the demo end-to-end

```bash
# 1. Frontend (works alone)
npm run dev

# 2. Get devnet SOL (free)
./scripts/airdrop.sh 5

# 3. Deploy the Anchor program
./scripts/deploy.sh
# → copy program id into NEXT_PUBLIC_FORGE_PROGRAM_ID in .env.local

# 4. Restart the dev server, /status flips fully green
# 5. Seed demo matches for screenshots
./scripts/seed-demo.sh
```

For deeper troubleshooting + the SOL economics, see [`DEPLOY.md`](DEPLOY.md).

---

## License

MIT. Built for the [100xDevs Frontier Hackathon Track](https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track/).

> *"Output comes first. Recognition follows."* — Ben Wu, *Proof of Talent*, a16z Crypto, Feb 2026
