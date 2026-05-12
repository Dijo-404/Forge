import { PageHeader } from "@/components/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassLink } from "@/components/glass/GlassButton";

export default function ManifestoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Manifesto"
        title={<>Résumés are claims. <span className="aurora-text">Code is evidence.</span></>}
        subtitle="The credential funnel is broken. AI made it worse. Forge is the on-chain product for the Proof of Talent thesis."
      />

      <section className="mx-auto max-w-[820px] px-6 pb-24 lg:px-12">
        <article className="prose prose-lg max-w-none text-[var(--color-ink-primary)]">
          <GlassPanel variant="soft" rounded="2xl" className="p-8">
            <p className="text-[18px] leading-[1.7] text-[var(--color-ink-secondary)]">
              In February 2026, a16z published{" "}
              <a
                href="https://a16zcrypto.com/posts/article/proof-of-talent"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                Proof of Talent
              </a>
              . The argument is simple: hiring should evaluate work itself,
              not pedigree. Crypto already produces that signal — public commits,
              deployed contracts, on-chain history. Then a footnote: "as AI
              tooling improves, that signal has grown noisier."
            </p>

            <p className="mt-6 text-[18px] leading-[1.7] text-[var(--color-ink-secondary)]">
              That footnote is a crisis. In 2026 a junior dev's GitHub looks
              identical whether they wrote it or Cursor did. Recruiters can't
              tell. Hiring managers can't tell. Code review at scale doesn't
              tell. And so we go back to pedigree — the very thing crypto was
              supposed to dismantle.
            </p>

            <h3
              className="mt-10 text-[26px] font-bold tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What Forge does instead
            </h3>

            <ul className="mt-4 space-y-4 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">
              <li>
                <strong>The proof artifact is the session, not the snapshot.</strong> Every keystroke
                Merkle-anchors to Solana via MagicBlock ephemeral rollups. The
                replay is the credential.
              </li>
              <li>
                <strong>We surface signals, not verdicts.</strong> Keystroke
                entropy, paste ratio, edit churn — all transparent, all
                inspectable. Recruiters set their own threshold. We refuse to
                ship a black-box "AI-detector."
              </li>
              <li>
                <strong>Stake is skin in the game.</strong> Devs put up USDC.
                Sponsors fund the pot. Winners take it. The credential is
                Token-2022 — tradable, gateable, and recursively composable
                with the rest of Solana.
              </li>
              <li>
                <strong>The cohort is the design partner.</strong> Forge
                fits Harkirat's 100xDevs flow exactly: weekly cohort duels,
                graduating cohorts mint credential batches via ZK Compression,
                hiring partners filter by replay.
              </li>
            </ul>

            <h3
              className="mt-10 text-[26px] font-bold tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What this isn't
            </h3>

            <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">
              We are not claiming to detect every AI assist. We are not building
              a panopticon. We are not against AI tools — most of us live in
              Cursor. The honest position is: <em>let people use whatever they
              want, but make the evidence inspectable so the labour market can
              reprice accordingly</em>.
            </p>

            <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">
              That's the whole product. The rest is wiring.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <GlassLink href="/arena" variant="cta" size="md">
                Try it now
              </GlassLink>
              <GlassLink
                href="https://a16zcrypto.com/posts/article/proof-of-talent"
                external
                variant="ghost"
                size="md"
                icon={null}
              >
                Read a16z's essay
              </GlassLink>
              <GlassLink
                href="https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track/"
                external
                variant="ghost"
                size="md"
                icon={null}
              >
                100xDevs Frontier Track
              </GlassLink>
            </div>
          </GlassPanel>
        </article>
      </section>
    </>
  );
}
