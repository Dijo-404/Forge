"use client";

/**
 * Anchor client for the Forge Arena program.
 *
 * Real, not stubbed: when NEXT_PUBLIC_FORGE_PROGRAM_ID is set and the wallet
 * is connected, these functions build & sign actual on-chain instructions
 * against Solana devnet. When the program id is unset (Phase 1 / no deploy
 * yet), the helpers throw with a clear "deploy first" message.
 */

import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { FORGE_IDL } from "./forge-idl";
import { USDC_MINT, getForgeProgramId } from "./solana";

const MATCH_SEED = Buffer.from("match");
const ESCROW_SEED = Buffer.from("escrow");

export interface ForgeClient {
  program: Program;
  provider: AnchorProvider;
}

class ReadonlyWallet {
  constructor(public publicKey: PublicKey) {}
  async signTransaction<T extends Transaction>(_t: T): Promise<T> {
    throw new Error("Readonly wallet — wallet not connected");
  }
  async signAllTransactions<T extends Transaction>(_ts: T[]): Promise<T[]> {
    throw new Error("Readonly wallet — wallet not connected");
  }
}

export function getForgeClient(connection: Connection, wallet: WalletContextState | null): ForgeClient | null {
  const programId = getForgeProgramId();
  if (!programId) return null;
  const w = wallet?.publicKey
    ? {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction!.bind(wallet),
        signAllTransactions: wallet.signAllTransactions!.bind(wallet),
      }
    : new ReadonlyWallet(PublicKey.default);

  const provider = new AnchorProvider(connection, w as never, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  // Anchor 0.30 takes the IDL with the `address` field baked in
  const program = new Program(FORGE_IDL as unknown as never, provider);
  return { program, provider };
}

export function deriveMatchPda(challenger: PublicKey, nonce: BN): [PublicKey, number] {
  const programId = getForgeProgramId();
  if (!programId) throw new Error("Program id not set — run `anchor deploy` and update env.");
  return PublicKey.findProgramAddressSync(
    [MATCH_SEED, challenger.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
    programId
  );
}

export function deriveEscrowPda(matchPda: PublicKey): [PublicKey, number] {
  const programId = getForgeProgramId();
  if (!programId) throw new Error("Program id not set — run `anchor deploy` and update env.");
  return PublicKey.findProgramAddressSync([ESCROW_SEED, matchPda.toBuffer()], programId);
}

/** Build & send `open_match` ix. Returns { matchPda, sig }. */
export async function openMatchOnChain(
  client: ForgeClient,
  args: {
    problemIdHash: Uint8Array;
    stakeRaw: BN;
    judgeOracle: PublicKey;
  }
): Promise<{ matchPda: PublicKey; sig: string; nonce: BN }> {
  const challenger = client.provider.wallet.publicKey!;
  const nonce = new BN(Date.now());
  const [matchPda] = deriveMatchPda(challenger, nonce);
  const [escrowPda] = deriveEscrowPda(matchPda);

  const challengerAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    challenger,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Anchor's accounts are inferred from the IDL — pass camelCase names
  const sig = await client.program.methods
    // @ts-expect-error — Anchor's typed methods come from the auto-generated IDL after `anchor build`
    .openMatch({
      problemIdHash: Array.from(args.problemIdHash),
      stake: args.stakeRaw,
      judgeOracle: args.judgeOracle,
      nonce,
    })
    .accounts({
      challenger,
      match: matchPda,
      usdcMint: USDC_MINT,
      challengerToken: challengerAta,
      escrowToken: escrowPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return { matchPda, sig, nonce };
}

/** Build & send `join_match`. Wallet must be the opponent. */
export async function joinMatchOnChain(
  client: ForgeClient,
  matchPda: PublicKey
): Promise<string> {
  const opponent = client.provider.wallet.publicKey!;
  const [escrowPda] = deriveEscrowPda(matchPda);
  const opponentAta = getAssociatedTokenAddressSync(
    USDC_MINT,
    opponent,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return client.program.methods
    // @ts-expect-error — see openMatchOnChain comment
    .joinMatch()
    .accounts({
      opponent,
      match: matchPda,
      usdcMint: USDC_MINT,
      opponentToken: opponentAta,
      escrowToken: escrowPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
}

/** Cheap commit — anchors a Merkle root of a snapshot bundle into program state. */
export async function commitRootOnChain(
  client: ForgeClient,
  matchPda: PublicKey,
  root: Uint8Array,
  snapshotIdx: BN
): Promise<string> {
  const player = client.provider.wallet.publicKey!;
  return client.program.methods
    // @ts-expect-error
    .commitRoot(Array.from(root), snapshotIdx)
    .accounts({ player, match: matchPda })
    .rpc();
}

/**
 * Generate a fresh judge oracle keypair for a match. The pubkey is what gets
 * baked into the on-chain `Match` account and required to sign settle.
 *
 * For production this would be a stable oracle service; for hackathon we
 * embed a server-side keypair (read from env) and treat it as the trust root.
 */
export function newJudgeOracle(): Keypair {
  return Keypair.generate();
}
