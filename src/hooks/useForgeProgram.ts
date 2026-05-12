"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getForgeClient, type ForgeClient } from "@/lib/anchor-client";
import { getForgeProgramId } from "@/lib/solana";

export function useForgeProgram(): {
  client: ForgeClient | null;
  isDeployed: boolean;
  programId: string | null;
} {
  const { connection } = useConnection();
  const wallet = useWallet();
  const programId = getForgeProgramId();

  const client = useMemo(
    () => (programId ? getForgeClient(connection, wallet) : null),
    [connection, wallet, programId]
  );

  return {
    client,
    isDeployed: Boolean(programId),
    programId: programId?.toBase58() ?? null,
  };
}
