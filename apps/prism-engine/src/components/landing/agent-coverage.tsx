import { cn } from "@syntaxure/ui";
import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { agents, agentsHeading, sectionIds, tierLabels } from "./content";
import type { EnforcementTier } from "./content";

/**
 * AgentCoverage — the honesty table.
 *
 * Most products in this category print a row of five agent logos and let the
 * reader assume parity. This one states which integration is verified firing
 * and which is configuration that has never been observed running. That is a
 * worse slide and a stronger argument, because the reader can check it.
 */

const tierStyles: Record<
  EnforcementTier,
  { pill: string; dot: string; label: string }
> = {
  enforcing: {
    pill: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    label: "01",
  },
  "config-only": {
    pill: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    label: "02",
  },
  advisory: {
    pill: "border-[var(--border-active)] bg-white/[0.03] text-[var(--text-tertiary)]",
    dot: "bg-[var(--text-quiet)]",
    label: "03",
  },
};

export function AgentCoverage() {
  return (
    <Section id={sectionIds.coverage}>
      <SectionHeading
        eyebrow={agentsHeading.eyebrow}
        headline={agentsHeading.headline}
        sub={agentsHeading.sub}
      />

      <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)]">
        {agents.map((agent) => {
          const style = tierStyles[agent.tier];
          return (
            <li
              key={agent.name}
              className="grid gap-3 bg-[var(--bg-secondary)] p-5 transition-colors duration-300 hover:bg-[var(--bg-tertiary)] sm:grid-cols-[minmax(0,11rem)_minmax(0,15rem)_minmax(0,1fr)] sm:items-center sm:gap-6 md:p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)}
                />
                <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)] md:text-base">
                  {agent.name}
                </span>
              </div>

              <div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                    style.pill,
                  )}
                >
                  {tierLabels[agent.tier]}
                </span>
              </div>

              <p className="font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)] md:text-xs">
                {agent.detail}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export default AgentCoverage;
