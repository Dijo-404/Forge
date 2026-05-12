"use client";

import Link from "next/link";
import { CLUSTER } from "@/lib/solana";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Arena", href: "/arena" },
      { label: "Credentials", href: "/credentials" },
      { label: "Recruiter view", href: "/recruiter" },
      { label: "Sponsor a bounty", href: "/sponsor" },
    ],
  },
  {
    heading: "Read",
    links: [
      { label: "Manifesto", href: "/manifesto" },
      { label: "How it works", href: "/how-it-works" },
      { label: "a16z — Proof of Talent", href: "https://a16zcrypto.com/posts/article/proof-of-talent" },
      { label: "100xDevs Frontier Track", href: "https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track/" },
    ],
  },
  {
    heading: "Build",
    links: [
      { label: "GitHub", href: "https://github.com" },
      { label: "MagicBlock docs", href: "https://docs.magicblock.gg" },
      { label: "Anchor", href: "https://www.anchor-lang.com" },
      { label: "Token-2022", href: "https://spl.solana.com/token-2022" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-20 w-full border-t border-black/5 bg-white">
      <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span
                className="text-[22px] font-bold tracking-[-0.04em] text-[var(--color-ink-primary)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Forge
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--color-ink-secondary)]">
              Live on-chain coding duels with USDC stakes and AI-resistant
              Proof-of-Skill credentials. A 100xDevs Frontier Hackathon
              submission, built on Solana.
            </p>
            <div className="mt-5 flex items-center gap-3 text-[12px] text-[var(--color-ink-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {CLUSTER}
              </span>
              <span>v0.1 · phase 1 shipped</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.heading}>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-primary)]">
                  {c.heading}
                </h4>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith("http") ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[14px] text-[var(--color-ink-secondary)] hover:text-[var(--color-brand-700)]"
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className="text-[14px] text-[var(--color-ink-secondary)] hover:text-[var(--color-brand-700)]"
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="spark-divider mt-14" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-[var(--color-ink-muted)]">
            © {new Date().getFullYear()} Forge. Built for the 100xDevs Frontier
            Hackathon.
          </p>
          <p className="text-[12px] text-[var(--color-ink-muted)]">
            Not financial advice. Devnet only.
          </p>
        </div>
      </div>
    </footer>
  );
}
