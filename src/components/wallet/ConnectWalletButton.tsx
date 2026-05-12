"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/cn";
import { shortAddr } from "@/lib/solana";

interface Props {
  fullWidth?: boolean;
  size?: "sm" | "md";
  variant?: "cta" | "ghost";
}

export function ConnectWalletButton({
  fullWidth = false,
  size = "sm",
  variant = "cta",
}: Props) {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const heightCls = size === "md" ? "h-12 px-5 text-[15px]" : "h-10 px-4 text-sm";

  if (!mounted) {
    // Avoid SSR/CSR mismatch from wallet auto-connect
    return (
      <span
        className={cn(
          heightCls,
          fullWidth && "w-full",
          "inline-flex items-center justify-center rounded-[14px] bg-white/40 text-transparent"
        )}
        aria-hidden
      >
        Loading
      </span>
    );
  }

  if (connected && publicKey) {
    return (
      <button
        onClick={() => disconnect()}
        className={cn(
          heightCls,
          fullWidth && "w-full",
          "group inline-flex items-center justify-center gap-2 rounded-[14px] glass-soft font-medium text-[var(--color-ink-primary)] hover:bg-white/70"
        )}
        title={publicKey.toBase58()}
      >
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
        </span>
        <span className="font-mono">{shortAddr(publicKey, 4)}</span>
        <span className="text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink-primary)] text-[12px] uppercase tracking-wider">
          {wallet?.adapter.name ?? ""}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      disabled={connecting}
      className={cn(
        heightCls,
        fullWidth && "w-full",
        variant === "cta" ? "glass-cta text-white" : "glass-soft",
        "group inline-flex items-center justify-center gap-2 rounded-[14px] font-medium transition-transform hover:scale-[1.02]"
      )}
    >
      <span>{connecting ? "Connecting…" : "Connect Wallet"}</span>
      {variant === "cta" ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--color-brand-700)]">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}
