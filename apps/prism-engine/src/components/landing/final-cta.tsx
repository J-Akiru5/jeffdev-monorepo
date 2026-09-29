import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "./section-shell";
import { CommandPill } from "./command-pill";
import { finalCta, hero, sectionIds } from "./content";

/**
 * FinalCta — the closing ask.
 *
 * One command, one button, and the node version requirement stated plainly. The
 * secondary path is the sign-up route from the hero, because a judge who wants
 * the dashboard should not have to scroll back up for it.
 */

export function FinalCta() {
  const signUp = hero.ctas.find((cta) => cta.variant === "secondary");

  return (
    <Section id={sectionIds.start} className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[120px]"
      />

      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 bg-[var(--border-glow)]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-cyan)] md:text-xs">
            {finalCta.eyebrow}
          </span>
          <span aria-hidden="true" className="h-px w-6 bg-[var(--border-glow)]" />
        </div>

        <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
          {finalCta.headline}
        </h2>

        <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
          {finalCta.sub}
        </p>

        <div className="mt-2 flex w-full flex-col items-center">
          <CommandPill command={finalCta.command} />
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {signUp && (
            <Link
              href={signUp.href}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-mono text-sm font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 sm:w-auto"
            >
              <span className="relative z-10 uppercase">{signUp.label}</span>
              <ArrowRight
                className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] md:text-xs">
            {finalCta.note}
          </span>
        </div>
      </div>
    </Section>
  );
}

export default FinalCta;
