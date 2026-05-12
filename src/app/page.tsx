import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { TrustedLogos } from "@/components/landing/TrustedLogos";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PrimitiveStack } from "@/components/landing/PrimitiveStack";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { CTASection } from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <TrustedLogos />
      <HowItWorks />
      <PrimitiveStack />
      <LiveDemo />
      <CTASection />
    </>
  );
}
