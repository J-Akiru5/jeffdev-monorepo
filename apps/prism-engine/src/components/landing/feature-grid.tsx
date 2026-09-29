import { ScanLine, ShieldCheck, Unlock } from "lucide-react";
import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { InlineCode } from "./inline-code";
import { features, featuresHeading, sectionIds } from "./content";

/**
 * FeatureGrid — the three capabilities.
 *
 * Rendered as a spec sheet rather than three identical cards. An equal-weight
 * card grid is the shape every tool in this category ships, and it flattens the
 * three claims into the same visual value when they are not the same claim: the
 * first is the product, the second is where the rules come from, the third is
 * what happens when it fails. A rule-separated list lets the reader's eye run
 * down the left edge and gives the third one, the limitation, the same dignity
 * as the first two. That is why the rows are rows.
 *
 * The numbered `01 / 02 / 03` markers are deliberately gone. Numbering is a
 * sequence claim, and these are three parallel claims, not three steps.
 */

const icons = {
  shield: ShieldCheck,
  scan: ScanLine,
  unlock: Unlock,
} as const;

/**
 * Each capability picks up its band from the hero's spectrum. Keyed by the icon
 * rather than by list position: an index would silently redraw the accents if
 * anyone reordered `features` in content.ts, and with
 * `noUncheckedIndexedAccess` on it would not even typecheck.
 */
const accents: Record<keyof typeof icons, { ring: string }> = {
  shield: { ring: "border-[var(--border-neon-cyan)]" },
  scan: { ring: "border-[var(--border-neon-purple)]" },
  unlock: { ring: "border-[rgba(244,63,94,0.4)]" },
};

export function FeatureGrid() {
  return (
    <Section id={sectionIds.features}>
      <SectionHeading
        eyebrow={featuresHeading.eyebrow}
        headline={featuresHeading.headline}
        sub={featuresHeading.sub}
      />

      <ul className="mt-12 border-t border-[var(--border-subtle)]">
        {features.map((feature) => {
          const Icon = icons[feature.icon];
          const accent = accents[feature.icon];
          return (
            <li
              key={feature.title}
              className="group grid gap-4 border-b border-[var(--border-subtle)] px-1 py-7 transition-colors duration-300 hover:bg-white/[0.02] sm:grid-cols-[auto_minmax(0,15rem)_minmax(0,1fr)] sm:items-baseline sm:gap-8"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors duration-300 ${accent.ring} group-hover:text-[var(--color-cyan)]`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </span>

              <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)] md:text-lg">
                {feature.title}
              </h3>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                <InlineCode text={feature.body} />
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export default FeatureGrid;
