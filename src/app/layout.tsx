import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { GlassNav } from "@/components/glass/GlassNav";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Forge — Prove your code is yours.",
  description:
    "Live on-chain coding duels with USDC stakes and AI-resistant Proof-of-Skill credentials. Built on Solana.",
  metadataBase: new URL("https://forge.gg"),
  keywords: [
    "Solana",
    "Web3",
    "Coding duels",
    "Proof of Talent",
    "MagicBlock",
    "Token-2022",
    "On-chain credentials",
    "100xDevs Frontier",
  ],
  openGraph: {
    title: "Forge — Prove your code is yours.",
    description:
      "Live on-chain coding duels with USDC stakes and AI-resistant Proof-of-Skill credentials.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forge — Prove your code is yours.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-[var(--color-ink-primary)]">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <GlassNav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
