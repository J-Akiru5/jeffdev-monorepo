import { cn } from "@syntaxure/ui";
import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { InlineCode } from "./inline-code";
import {
  claims,
  evidence,
  publishedClaims,
  retiredClaims,
  sectionIds,
} from "./content";
import type { ClaimStatus } from "./content";

/**
 * EvidenceLedger — the section that cannot be copied without doing the work.
 *
 * Every claim the page makes, with its status and where it can be checked, then
 * the claims that were deliberately not made and the reason for each. The count
 * line carries its own provenance (a claim count is a fact about this file, not
 * a growth metric), which is why it reads `12 traced · 5 refused` rather than a
 * big animated number.
 *
 * The statuses come from `content.ts`, and `content.test.ts` fails the build if
 * a published claim loses its source or if a retired claim sneaks back in. The
 * ledger is therefore load-bearing rather than decorative.
 */

const statusStyles: Record<ClaimStatus, string> = {
  VERIFIED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  STATED: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  UNSUPPORTED: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  UNVERIFIED: "border-[var(--border-active)] bg-white/[0.03] text-[var(--text-tertiary)]",
};

function StatusPill({ status }: { status: ClaimStatus }) {
  return (
    <span
      title={evidence.statusLabels[status]}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

export function EvidenceLedger() {
  return (
    <Section id={sectionIds.evidence}>
      <SectionHeading
        eyebrow={evidence.eyebrow}
        headline={evidence.headline}
        sub={evidence.sub}
      />

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] md:text-xs">
        {claims.length} claims traced to source · {retiredClaims.length} refused
      </p>

      <ul className="mt-8 divide-y divide-[var(--border-subtle)] overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        {publishedClaims.map((claim) => (
          <li
            key={claim.id}
            className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] md:gap-8 md:p-6"
          >
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              <InlineCode text={claim.text} />
            </p>
            <div className="flex flex-col gap-2 md:items-end md:text-right">
              <StatusPill status={claim.status} />
              <span className="font-mono text-[10px] leading-relaxed text-[var(--text-tertiary)] [overflow-wrap:anywhere] md:text-[11px]">
                {claim.source}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <h3 className="border-b border-[var(--border-subtle)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] md:px-6">
          {evidence.publishedNote}
        </h3>
        <ul className="divide-y divide-[var(--border-subtle)]">
          {retiredClaims.map((claim) => (
            <li
              key={claim.id}
              className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-start md:gap-6 md:px-6"
            >
              <div className="flex items-start gap-3 md:w-1/2">
                <StatusPill status={claim.status} />
                <p className="text-sm leading-relaxed text-[var(--text-tertiary)] line-through decoration-[var(--border-glow)]">
                  {claim.text}
                </p>
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-[var(--text-quiet)] md:w-1/2 md:text-[11px]">
                {claim.source}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export default EvidenceLedger;
