"use client";

const LOGOS: { name: string; svg: React.ReactNode }[] = [
  {
    name: "Solana",
    svg: (
      <svg viewBox="0 0 120 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="Fustat, Inter" fontWeight="700" fontSize="20" fill="currentColor">solana</text>
      </svg>
    ),
  },
  {
    name: "MagicBlock",
    svg: (
      <svg viewBox="0 0 160 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="Fustat, Inter" fontWeight="700" fontSize="20" fill="currentColor">MagicBlock</text>
      </svg>
    ),
  },
  {
    name: "Superteam",
    svg: (
      <svg viewBox="0 0 160 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="Fustat, Inter" fontWeight="700" fontSize="20" fill="currentColor">Superteam</text>
      </svg>
    ),
  },
  {
    name: "100xDevs",
    svg: (
      <svg viewBox="0 0 140 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="Fustat, Inter" fontWeight="700" fontSize="20" fill="currentColor">100xDevs</text>
      </svg>
    ),
  },
  {
    name: "Token-2022",
    svg: (
      <svg viewBox="0 0 160 24" className="h-6 w-auto">
        <text x="0" y="18" fontFamily="JetBrains Mono" fontWeight="600" fontSize="18" fill="currentColor">Token-2022</text>
      </svg>
    ),
  },
];

export function TrustedLogos() {
  return (
    <section className="relative w-full pb-20 pt-4">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          Built on the primitives that already won
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-[100px] gap-y-6 text-[var(--color-ink-faint)]">
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className="grayscale opacity-70 transition-opacity hover:opacity-100"
              aria-label={l.name}
            >
              {l.svg}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
