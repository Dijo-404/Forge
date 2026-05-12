"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { readUsdcBalance } from "@/lib/usdc";

export function useUsdcBalance(): { ui: number | null; loading: boolean } {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [ui, setUi] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setUi(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    readUsdcBalance(connection, publicKey)
      .then((b) => {
        if (!cancel) setUi(b ? b.uiAmount : 0);
      })
      .catch(() => !cancel && setUi(0))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [connection, publicKey]);

  return { ui, loading };
}
