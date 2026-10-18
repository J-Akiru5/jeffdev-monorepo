import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { pricing, pricingNote, pricingSection, sectionIds } from "./content";

/**
 * PricingStrip — the four plans, read straight off `content.ts`, which the test
 * suite pins to `src/lib/pricing-db.ts`.
 *
 * There are deliberately no "most popular" badges and no struck-through prices
 * here: neither is supported by anything in the repository, and this page's
 * whole position is that unsupported numbers do not ship.
 */

function formatPrice(monthlyUsd: number | null): string {
  if (monthlyUsd === null) return "Custom";
  if (monthlyUsd === 0) return "$0";
  return `$${monthlyUsd}`;
}

export function PricingStrip() {
  return (
    <Section id={sectionIds.pricing}>
      <SectionHeading
        eyebrow={pricingSection.eyebrow}
        headline={pricingSection.headline}
        sub={pricingSection.sub}
      />

      <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
        {pricing.map((plan) => (
          <li
            key={plan.name}
            className="flex flex-col gap-3 bg-[var(--bg-secondary)] p-6 transition-colors duration-300 hover:bg-[var(--bg-tertiary)]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {plan.name}
            </span>
            <span className="flex items-baseline gap-1 text-[var(--text-primary)]">
              <span className="text-2xl font-bold tracking-tight md:text-3xl">
                {formatPrice(plan.monthlyUsd)}
              </span>
              {plan.monthlyUsd !== null && plan.monthlyUsd > 0 && (
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                  /month
                </span>
              )}
            </span>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              {plan.tagline}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] leading-relaxed text-[var(--text-quiet)] md:text-[11px]">
          {pricingNote}
        </p>
        <Link
          href={pricingSection.cta.href}
          className="group inline-flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text-primary)] hover:underline"
        >
          {pricingSection.cta.label}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </Link>
      </div>
    </Section>
  );
}

export default PricingStrip;
