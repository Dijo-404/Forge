"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Arena", href: "/arena" },
  { label: "Credentials", href: "/credentials" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Recruiter", href: "/recruiter" },
  { label: "Manifesto", href: "/manifesto" },
  { label: "Status", href: "/status" },
];

export function GlassNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed left-0 right-0 top-[24px] z-50 flex justify-center px-4">
      <div
        className={cn(
          "glass-strong rounded-[16px] flex items-center gap-1 px-3 py-2 transition-all duration-300",
          scrolled && "shadow-[0_8px_32px_-12px_rgba(15,39,92,0.25)]"
        )}
      >
        <Link href="/" className="group flex items-center gap-2 px-3 py-1">
          <ForgeMark />
          <span
            className="text-[20px] font-bold tracking-[-0.04em] text-[var(--color-ink-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Forge
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-[12px] px-4 py-2 text-[14px] font-medium transition-colors",
                  active
                    ? "text-[var(--color-brand-700)]"
                    : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)]"
                )}
              >
                {l.label}
                {active ? (
                  <span className="pointer-events-none absolute inset-x-3 -bottom-[3px] h-[2px] rounded-full bg-[var(--color-brand-600)]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-2 hidden lg:block">
          <ConnectWalletButton />
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/40 lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="glass-strong absolute left-4 right-4 top-[80px] rounded-[16px] p-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-[12px] px-4 py-3 text-[15px] font-medium text-[var(--color-ink-primary)] hover:bg-white/40"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2">
              <ConnectWalletButton fullWidth />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function ForgeMark() {
  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center">
      <span
        className="absolute inset-0 rounded-[10px]"
        style={{
          background:
            "linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%)",
        }}
      />
      <svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5 text-white"
        fill="none"
        aria-hidden
      >
        <path
          d="M5 5h11l-2 5h6l-9 9 2-7H6l-1-7z"
          fill="currentColor"
        />
      </svg>
      <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-[var(--color-forge-orange)] shadow-[0_0_8px_rgba(255,128,30,0.65)]" />
    </span>
  );
}
