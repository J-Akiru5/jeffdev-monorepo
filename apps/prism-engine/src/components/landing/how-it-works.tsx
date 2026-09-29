import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { InlineCode } from "./inline-code";
import { howItWorks, sectionIds } from "./content";

/**
 * HowItWorks — the setup path, shown as the CLI prints it.
 *
 * The left panel is `initBanner`, the literal string from `src/commands/init.ts`
 * with ANSI colour stripped. Reproducing the real banner rather than inventing a
 * prettier one is the same instinct as the block demo: the artefact is the
 * argument.
 */

export function HowItWorks() {
  return (
    <Section id={sectionIds.howItWorks}>
      <SectionHeading
        eyebrow={howItWorks.eyebrow}
        headline={howItWorks.headline}
        sub={howItWorks.sub}
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <div className="overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[#08080a]">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              terminal · init
            </span>
          </div>
          <div className="overflow-x-auto p-4 md:p-5">
            <pre className="font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] md:text-xs">
              <code>{howItWorks.banner}</code>
            </pre>
          </div>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2">
          {howItWorks.steps.map((step) => (
            <li
              key={step.label}
              className="flex flex-col gap-2 bg-[var(--bg-secondary)] p-6 transition-colors duration-300 hover:bg-[var(--bg-tertiary)]"
            >
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-cyan)]">
                {step.label}
              </span>
              <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] md:text-base">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] md:text-sm">
                <InlineCode text={step.body} />
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

export default HowItWorks;
