import { PageHeader } from "@/components/PageHeader";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PrimitiveStack } from "@/components/landing/PrimitiveStack";
import { LiveDemo } from "@/components/landing/LiveDemo";

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title={<>The full <span className="aurora-text">stack</span>, in plain language.</>}
        subtitle="Each step uses a Solana primitive that won real prizes in 2025. The novel part is how Forge combines them — and the AI-resistance signal layer on top."
      />
      <HowItWorks />
      <PrimitiveStack />
      <LiveDemo />
    </>
  );
}
