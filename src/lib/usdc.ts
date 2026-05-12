"use client";

/**
 * Devnet USDC helpers for Token-2022.
 *
 * Devnet USDC is the official Circle devnet token. Faucet:
 *   https://faucet.circle.com  → choose Solana devnet
 *
 * Our Anchor program uses the Token-2022 program id, so the USDC mint
 * MUST be a Token-2022 mint. The default in .env.local.example points
 * to Circle's devnet Token-2022 mint.
 */

import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { USDC_MINT } from "./solana";

export async function getOrCreateUsdcAtaIx(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey
): Promise<{ ata: PublicKey; createIx?: TransactionInstruction }> {
  const ata = getAssociatedTokenAddressSync(
    USDC_MINT,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  try {
    await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return { ata };
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      const createIx = createAssociatedTokenAccountInstruction(
        payer,
        ata,
        owner,
        USDC_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      return { ata, createIx };
    }
    throw e;
  }
}

export async function readUsdcBalance(
  connection: Connection,
  owner: PublicKey
): Promise<{ uiAmount: number; raw: bigint } | null> {
  const ata = getAssociatedTokenAddressSync(
    USDC_MINT,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  try {
    const acc = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return { uiAmount: Number(acc.amount) / 1_000_000, raw: acc.amount };
  } catch {
    return null;
  }
}

/** USDC has 6 decimals. Convert UI float → raw u64-compatible bigint. */
export function usdcToRaw(uiAmount: number): bigint {
  return BigInt(Math.round(uiAmount * 1_000_000));
}

export function rawToUsdc(raw: bigint): number {
  return Number(raw) / 1_000_000;
}
