# 100xDevs Frontier Hackathon — Build Plan

**Track:** [100xDevs Frontier Hackathon Track on Superteam Earn](https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track/)
**Pool:** 10,000 USDC across 10 placements (1st = 2,500)
**Required skills:** Frontend + Backend + Blockchain
**Winners announced:** May 25, 2026 → ~17 days runway from today (May 8)
**Audience signal:** 100xDevs = Harkirat's Indian dev cohort brand → judges value polished UX, real shipping, dev-first utility, India relevance

---

## TL;DR — The Idea

### **Forge** — *Live, on-chain, AI-resistant coding duels with USDC-staked bounties and a portable Proof-of-Skill credential recruiters can actually trust.*

> Two devs enter a real-time arena, lock in USDC stakes, and race to solve a sponsor-posted bounty (a real GitHub issue, LeetCode-style problem, or "implement this Anchor program"). Every keystroke batches into an **ephemeral rollup** at ~10 ms, every save Merkle-anchors to Solana mainnet, and a **proof-of-human-coding** signal (typing entropy + paste-rate analysis + optional webcam liveness) is recorded alongside. Winner takes the pot. Both players walk away with a tradable Token-2022 credential whose metadata links to the verifiable session log.
>
> Recruiters (and Harkirat's hiring partners) don't need to *trust* a résumé — they can replay the match.

It's `Codeforces × Supersize × Polymarket`, but the product nobody built yet: **the first dev-credential platform whose proof artifact is a replayable on-chain coding session, not an LLM-graded snapshot.**

---

## Why this wins (research-backed)

### The thesis is fresh and on-trend
- **a16z Crypto, "Proof of Talent" (Feb 26, 2026)**: explicitly argues hiring should evaluate *the work itself, not pedigree* — and warns that *"as AI tooling improves, that signal has grown noisier."* Forge is the on-chain product that operationalizes that essay. (`a16z_crypto`, vector similarity 0.72)
- **Superteam blog ("Introducing Superteam Earn", Aditya Shetty, 2022-09-20)**: explicitly built around *"young Indian developers shipping million-dollar software"* with on-chain earnings as the credential. Forge is the *skill* layer Superteam Earn never built. Same audience, same ethos.

### The competitive whitespace is real (deep-dive verified)
**What already exists (and falls short):**
- `CodeCup`, `SkillFlex`, `CodeXCash`, `Solana Quest` — all "submit static code → LLM grades → mint soulbound NFT". **None capture the writing process. None are AI-resistant.** Once Cursor + GPT-5 can pass any submission, these credentials decay to zero.
- `0byte` (Breakout): proves content *is* AI-generated (pixel embedding). The inverse problem — proving code is *human* — is wide open.
- `Proof of Gameplay` (Radar): nearest analog, but for games, not code.
- `Pregame` (1st place Consumer, Radar, C2 accelerator): validates that **stake-against-anyone PvP escrow is a top-tier Solana consumer pattern** — winning judges have already rewarded the mechanic.

**What MagicBlock Ephemeral Rollups (ER) won in 2025:**
- Supersize → 1st Gaming, 25K (C2 accelerator)
- The Arena → 2nd Gaming, 20K (C2 accelerator)
- Block Stranding → 4th Gaming, 10K
- Lana Roads → 5th Gaming, 5K
- → ER is a **proven judge-magnet primitive**, but **almost nobody has used it outside gaming**. Forge applies it to dev tooling — fresh angle, same wow factor.

### The unique combination nobody has shipped
| Primitive | Used by Forge | Existing projects using it for *this* purpose |
|---|---|---|
| MagicBlock Ephemeral Rollups (10ms state) | Stream keystroke commits live | 0 (only games) |
| Token-2022 metadata + transfer hooks | Tradable, gateable Proof-of-Skill credential | 0 (skill projects use plain SBT) |
| ZK Compression (Light Protocol) | Cheap mass issuance to cohort students | `Condense`, `EventMint` — but not for credentials |
| Solana Pay / x402-style 402 escrow | Sponsor bounty pots, instant payout on win | Crowded for AI agents, **empty for dev bounties** |
| Solana Blinks / Actions | "Challenge me" share-link in tweet | Crowded for tipping, not for dev arenas |

**No accelerator project (C1–C4) and no winning project across Renaissance/Radar/Breakout/Cypherpunk has assembled this exact stack for developer skill verification.** That's the moat.

### Why it resonates with 100xDevs judges specifically
- Harkirat's brand = "we make Indian devs employable." Forge is literally a hiring-readiness product for his graduates.
- Demo-able in <60 seconds: open URL → see live duel → recruiter clicks "verify" → match replays. No "trust me bro."
- Has clear after-hackathon path: Harkirat's cohorts could *use* Forge to gate cohort graduation. Built-in design partner.
- Required skills match exactly: Frontend (Next.js arena UI), Backend (judge runner + ER orchestrator), Blockchain (Anchor program + Token-2022 + ER integration).

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  CHALLENGER ──[stake 1 USDC]──┐                                    │
│                                ├──> Bounty Escrow PDA (Anchor)     │
│  OPPONENT  ──[stake 1 USDC]──┘                                    │
└────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────────┐
│  Match Session opens → both clients delegate match account to      │
│  MagicBlock Ephemeral Rollup (~10 ms commits)                       │
│                                                                     │
│  Per keystroke batch (every 250ms):                                 │
│    {merkleRoot, charDelta, pasteEvents, entropy, ts}               │
│       └──> ER state                                                 │
│                                                                     │
│  Per save / per test-pass:                                          │
│    Snapshot → IPFS / Walrus → cid + sha → ER state                 │
└────────────────────────────────────────────────────────────────────┘
                          │
            test-runner verdict (sandboxed Docker)
                          │
                          ▼
┌────────────────────────────────────────────────────────────────────┐
│  Settlement (mainnet):                                              │
│    1. Undelegate ER state → finalize on Solana                     │
│    2. Pay winner from escrow PDA                                    │
│    3. Mint Token-2022 "Forge Credential" to BOTH players           │
│         metadata = {matchId, opponent, problemHash, verdict,       │
│                     humanScore (0-100), replayUri}                  │
│    4. Optional: ZK-compress credential (Light Protocol) for cohorts│
└────────────────────────────────────────────────────────────────────┘
```

### "Proof of Human Coding" — the AI-resistance signal
Not a magic ZK box — a transparent, falsifiable composite score recorded on-chain so recruiters can decide their own threshold:

1. **Keystroke entropy** — inter-keystroke timing distribution (humans cluster, LLMs paste).
2. **Paste-event ratio** — ratio of pasted chars to typed chars (logged; >40% paste flagged).
3. **Edit churn** — humans backspace, refactor, scroll; LLM-pasted code goes in clean.
4. **Optional liveness** — periodic webcam frame hash for "verified mode" matches.

We don't claim 100% detection — we publish the raw signals so recruiters set their own bar. That honesty *is* the moat against "we use AI to detect AI" snake oil.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind 4 + Monaco editor | Same stack you're already running on GhostPay — reuse design system |
| Real-time | MagicBlock SDK (`@magicblock-labs/ephemeral-rollups-sdk`) + WebSocket bridge | Ten-ms commits, proven in Supersize |
| Wallet | Privy or Dynamic embedded wallet + Phantom | Embedded so non-crypto-native devs can play in 1 click |
| On-chain | Anchor program (Rust): `match_escrow`, `commit_keystroke`, `settle_match`; Token-2022 mint with metadata pointer | |
| Credential mint | Token-2022 + Metaplex Token Metadata (Token-2022 mode) — optionally Light Protocol ZK Compression for cohort batches | |
| Storage | Walrus or Helius DAS for replay snapshots | Cheap, decentralized |
| Test runner | Dockerized Node/Python/Rust sandbox on Fly.io or Railway | Already familiar (you're on Railway via `colosseum.com`) |
| Inference (problem gen) | Gemini API (already in your stack) for sponsor-side "generate variant of this LeetCode problem" | |
| Distribution | Solana Blink ("⚔️ duel me on Forge") embedded in tweets / Discord | One-click engagement loop |

---

## 17-Day Build Plan (today is May 8, deadline May 25)

### Phase 1 — Foundation (Days 1–3, May 8–10)
- [ ] Next.js scaffold, design system primitives (reuse GhostPay's liquid-glass kit if compatible)
- [ ] Anchor program v1: `OpenMatch` + `JoinMatch` + `Settle` (escrow only, no ER yet)
- [ ] Devnet deploy + simple "Player A vs Player B with USDC stake" UI
- [ ] Privy/Dynamic wallet integration
- **Milestone:** Two browsers can stake and the winner can be manually settled.

### Phase 2 — Real-time arena (Days 4–7, May 11–14)
- [ ] MagicBlock SDK integration; delegate match account to ER
- [ ] Monaco editor with WebSocket bridge to ER commit endpoint
- [ ] Keystroke batching (250 ms) + Merkle root computation client-side
- [ ] Live opponent code "spectator mode" (read-only Monaco mirror)
- **Milestone:** Watch your opponent type in real time, with every batch hashed on-chain.

### Phase 3 — Test runner & settlement (Days 8–10, May 15–17)
- [ ] Dockerized sandbox on Railway: pulls submitted code, runs hidden test suite, returns verdict + signature
- [ ] Anchor `Settle(matchId, winner, verdictSig)` — pays escrow, mints Token-2022 credential to both players
- [ ] Replay viewer page: scrub-bar timeline of keystroke batches → renders code state at any timestamp
- **Milestone:** Full loop works: stake → race → tests pass → winner paid → credential in wallet.

### Phase 4 — Proof-of-Human-Coding signals (Days 11–12, May 18–19)
- [ ] Client-side capture: keystroke timing histogram, paste-event log, edit-churn score
- [ ] Bake signals into match metadata
- [ ] "Human-Code Score" badge on credential page (with raw data link — *transparency is the brand*)
- **Milestone:** A recruiter can open a credential page and see "78/100 Human-Code, 12% paste rate, replay here."

### Phase 5 — Distribution + polish (Days 13–15, May 20–22)
- [ ] Sponsor-mode: anyone can post a bounty pot (real GitHub issue link → automated test extraction OR custom test file)
- [ ] Solana Blink: `forge.gg/duel/<id>` renders as one-click "Accept Challenge" inside any X post
- [ ] Recruiter dashboard: search wallet → see all Forge credentials → filter by problem difficulty / Human-Code score
- [ ] 1 "showcase" 100xDevs cohort problem set (DSA + Web3 set) seeded so judges can play immediately
- **Milestone:** Anyone with the URL can run a full match with no docs.

### Phase 6 — Ship + demo (Days 16–17, May 23–24)
- [ ] Loom 90-second presentation (problem → live demo → why Solana → recruiter view)
- [ ] Loom 5-minute technical demo (Anchor code, ER integration, settlement)
- [ ] Submission writeup, GitHub README polish, X launch thread
- [ ] **Submit by EOD May 24** so you have a buffer

### Cut-line scope (do these only if Phase 1–5 land on time)
- ZK-Compressed bulk credential issuance for cohort programs
- Webcam liveness frame hashing
- Multi-language test runner (start with TS/JS only, add Rust/Python after)
- Token-2022 transfer-hook to enforce "credential cannot be sold for X days" — fun but skip if rushed
- Mobile MWA support — nice-to-have for India angle but not critical

---

## Risks + how to handle them

| Risk | Mitigation |
|---|---|
| MagicBlock SDK learning curve eats Phase 2 | Start with their `bolt` template + their Discord; have a fallback "polling on devnet" path that still demos well |
| Sandboxed test runner is a security/devops time-sink | Use a hosted code-execution API (Judge0, RCE-as-a-service) for v1; self-host post-hackathon |
| "AI-resistance" feels gimmicky to skeptical judges | Lean into transparency framing — "we surface signals, *you* set the threshold" — and cite the a16z Proof of Talent piece in the pitch |
| Two-sided market on demo day (need players + sponsors) | Seed: pre-create 5 challenges with house-funded 5 USDC pots so judges can immediately try |
| GhostPay overlap (you just built x402 + Umbra) | Forge has *zero* overlap with GhostPay — different primitives, different audience. But: you can pitch both as part of a "verifiable infra" portfolio if Harkirat's team asks what else you've shipped |

---

## What to call it
- **Forge** (top pick — clean, brandable, "where things are made")
- **Crucible** — same vibe, slightly more dramatic
- **Anvil** — short, dev-y
- Avoid: "CodeArena", "Devs.fun", "ProveIt" — all taken or too generic

Buy: `forge.gg` if available, else `forge.dev`, `forge-arena.com`, `useforge.dev`

---

## Pitch in two sentences (for the submission form)

> Forge is a real-time, on-chain coding arena where developers stake USDC, race to solve sponsor-posted bounties, and walk away with a Token-2022 credential whose proof artifact is a *replayable, AI-resistance-scored Solana session* — not an LLM-graded snapshot.
>
> Built on MagicBlock ephemeral rollups for ~10 ms keystroke commits and Anchor for trustless escrow + settlement, Forge turns hiring from "trust this résumé" into "replay this match" — the on-chain product that a16z's *Proof of Talent* thesis predicted would arrive in 2026.

---

## Sources cited (from Colosseum Copilot deep-dive, May 7–8 2026)

- a16z Crypto — *Proof of Talent* (Ben Wu, 2026-02-26)
- Superteam Blog — *Introducing Superteam Earn* (Aditya Shetty, 2022-09-20)
- Builder corpus competitive landscape: `codecup-1`, `skillflex`, `codexcash`, `solana-quest` (status-quo skill projects, all LLM-static); `0byte` (Breakout, AI-content provenance — inverse problem); `proof-of-gameplay` (Radar, closest analog); `assap-anti-sybil-solana-attestation-protocol` (Breakout)
- ER prior art: `supersize` (1st Gaming Radar, 25K, C2), `the-arena` (2nd Gaming Radar, 20K, C2), `block-stranding` (4th Gaming Breakout, 10K), `lana-roads-1` (5th Gaming Breakout, 5K)
- Stake-to-play winning pattern: `pregame` (1st Consumer Radar, 25K, C2)

> All evidence floors satisfied: builder-project + accelerator/winners check + a16z thesis citation. As of 2026-05-08.
