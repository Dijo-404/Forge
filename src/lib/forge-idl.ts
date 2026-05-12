/**
 * IDL for the Forge Arena Anchor program.
 *
 * This file is the canonical TS view of `programs/forge-arena/src/lib.rs`.
 * After `anchor build`, you can replace this with the auto-generated IDL at
 * `target/idl/forge_arena.json` — the shape is identical.
 */

import type { Idl } from "@coral-xyz/anchor";

export const FORGE_IDL = {
  address: "FbcFTcfpu3siEtBgCef4tQXCm4nkYX33MURJqLZSZepz",
  metadata: {
    name: "forge_arena",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Forge — on-chain coding duels",
  },
  instructions: [
    {
      name: "open_match",
      discriminator: [121, 50, 167, 213, 188, 80, 109, 232],
      accounts: [
        { name: "challenger", writable: true, signer: true },
        { name: "match", writable: true, pda: { seeds: [
          { kind: "const", value: [109, 97, 116, 99, 104] },
          { kind: "account", path: "challenger" },
          { kind: "arg", path: "args.nonce" },
        ] } },
        { name: "usdc_mint" },
        { name: "challenger_token", writable: true },
        { name: "escrow_token", writable: true, pda: { seeds: [
          { kind: "const", value: [101, 115, 99, 114, 111, 119] },
          { kind: "account", path: "match" },
        ] } },
        { name: "token_program" },
        { name: "system_program" },
        { name: "rent" },
      ],
      args: [
        { name: "args", type: { defined: { name: "OpenMatchArgs" } } },
      ],
    },
    {
      name: "join_match",
      discriminator: [216, 191, 175, 203, 137, 51, 222, 125],
      accounts: [
        { name: "opponent", writable: true, signer: true },
        { name: "match", writable: true },
        { name: "usdc_mint" },
        { name: "opponent_token", writable: true },
        { name: "escrow_token", writable: true },
        { name: "token_program" },
      ],
      args: [],
    },
    {
      name: "commit_root",
      discriminator: [22, 99, 5, 14, 191, 237, 211, 80],
      accounts: [
        { name: "player", writable: true, signer: true },
        { name: "match", writable: true },
      ],
      args: [
        { name: "root", type: { array: ["u8", 32] } },
        { name: "snapshot_idx", type: "u64" },
      ],
    },
    {
      name: "settle_match",
      discriminator: [171, 148, 39, 246, 22, 213, 113, 156],
      accounts: [
        { name: "judge_oracle", signer: true },
        { name: "match", writable: true },
        { name: "usdc_mint" },
        { name: "escrow_token", writable: true },
        { name: "winner_token", writable: true },
        { name: "token_program" },
      ],
      args: [{ name: "args", type: { defined: { name: "SettleArgs" } } }],
    },
    {
      name: "cancel_match",
      discriminator: [156, 169, 255, 21, 197, 5, 7, 156],
      accounts: [
        { name: "challenger", writable: true, signer: true },
        { name: "match", writable: true },
        { name: "usdc_mint" },
        { name: "escrow_token", writable: true },
        { name: "challenger_token", writable: true },
        { name: "token_program" },
      ],
      args: [],
    },
  ],
  accounts: [
    { name: "Match", discriminator: [231, 47, 167, 65, 162, 83, 132, 145] },
  ],
  events: [
    { name: "SnapshotCommitted", discriminator: [12, 198, 76, 55, 33, 54, 89, 42] },
    { name: "MatchSettled", discriminator: [44, 32, 78, 122, 100, 213, 65, 20] },
  ],
  errors: [
    { code: 6000, name: "InvalidStake", msg: "Stake must be positive." },
    { code: 6001, name: "InvalidProblem", msg: "Problem id hash cannot be zero." },
    { code: 6002, name: "WrongStatus", msg: "Match is in the wrong status for this action." },
    { code: 6003, name: "SelfDuel", msg: "Cannot duel yourself." },
    { code: 6004, name: "NotParticipant", msg: "Caller is not a match participant." },
    { code: 6005, name: "InvalidWinner", msg: "Winner must be challenger or opponent." },
    { code: 6006, name: "WrongOracle", msg: "Judge oracle pubkey does not match the one set at open_match." },
    { code: 6007, name: "Overflow", msg: "Numeric overflow." },
    { code: 6008, name: "TooEarly", msg: "Cancellation window has not elapsed yet." },
  ],
  types: [
    {
      name: "OpenMatchArgs",
      type: {
        kind: "struct",
        fields: [
          { name: "problem_id_hash", type: { array: ["u8", 32] } },
          { name: "stake", type: "u64" },
          { name: "judge_oracle", type: "pubkey" },
          { name: "nonce", type: "u64" },
        ],
      },
    },
    {
      name: "SettleArgs",
      type: {
        kind: "struct",
        fields: [
          { name: "winner", type: "pubkey" },
          { name: "verdict_sig_hash", type: { array: ["u8", 32] } },
        ],
      },
    },
    {
      name: "Match",
      type: {
        kind: "struct",
        fields: [
          { name: "challenger", type: "pubkey" },
          { name: "opponent", type: "pubkey" },
          { name: "problem_id_hash", type: { array: ["u8", 32] } },
          { name: "stake", type: "u64" },
          { name: "opened_at", type: "i64" },
          { name: "started_at", type: "i64" },
          { name: "ended_at", type: "i64" },
          { name: "winner", type: "pubkey" },
          { name: "judge_oracle", type: "pubkey" },
          { name: "status", type: "u8" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
} as const satisfies Idl;

export type ForgeProgram = typeof FORGE_IDL;
