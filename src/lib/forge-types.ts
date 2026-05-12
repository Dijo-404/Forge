/**
 * Domain types for Forge — shared between API routes, lib, and components.
 * Keep this file the single source of truth.
 */

export type MatchStatus =
  | "open"        // waiting for opponent
  | "live"        // both joined, race in progress
  | "judging"     // both submitted, runner verifying
  | "settled"     // payout + credential mint complete
  | "expired"     // timed out before opponent joined
  | "void";       // dispute / refunded

export type Difficulty = "intro" | "easy" | "medium" | "hard" | "expert";

export type Language = "typescript" | "javascript" | "python" | "rust";

export interface Problem {
  id: string;
  title: string;
  prompt: string;       // markdown
  starterCode: Partial<Record<Language, string>>;
  /** Public test cases shown to player */
  publicTests: string;
  /** Hidden tests run by judge — present only on server */
  hiddenTests?: string;
  difficulty: Difficulty;
  tags: string[];
  /** Sponsor-supplied problems carry origin */
  sponsor?: { name: string; url?: string };
  language: Language;
  /** Soft deadline in seconds */
  timeBudgetSec: number;
}

export interface Match {
  id: string;
  problemId: string;
  stakeUsdc: number;
  challenger: string;     // wallet pubkey base58
  opponent?: string;      // wallet pubkey base58 (set on join)
  status: MatchStatus;
  createdAt: number;      // unix ms
  startedAt?: number;
  endedAt?: number;
  winner?: string;        // wallet pubkey
  loser?: string;
  /** On-chain references — set when each phase confirms */
  escrowPda?: string;
  openTxSig?: string;
  joinTxSig?: string;
  settleTxSig?: string;
  /** Credential mints (Token-2022) issued post-settlement */
  credentialMints?: { winner?: string; loser?: string };
}

export interface MatchSnapshot {
  matchId: string;
  player: string;
  language: Language;
  code: string;
  // batched signals for live opponent view
  humanScore?: number;
  pasteRatio?: number;
  charCount: number;
  ts: number;
}

export interface JudgeVerdict {
  matchId: string;
  player: string;
  passed: boolean;
  testsTotal: number;
  testsPassed: number;
  runtimeMs: number;
  stderr?: string;
  /** Server signature attesting verdict for on-chain settle ix */
  signature: string;
}

export interface ForgeCredential {
  mint: string;            // Token-2022 mint pubkey
  holder: string;          // wallet pubkey
  matchId: string;
  problemId: string;
  problemTitle: string;
  difficulty: Difficulty;
  outcome: "win" | "loss";
  humanScore: number;
  pasteRatio: number;
  durationSec: number;
  language: Language;
  opponentMasked: string;   // shortAddr of opponent
  replayUri: string;        // /matches/[id]/replay
  mintedAt: number;
}

export interface SponsorBounty {
  id: string;
  sponsor: { name: string; wallet: string; url?: string };
  problemId: string;
  potUsdc: number;
  matchesAvailable: number;
  matchesClaimed: number;
  expiresAt: number;
}
