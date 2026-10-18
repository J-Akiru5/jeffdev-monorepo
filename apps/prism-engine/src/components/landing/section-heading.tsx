import { cn } from "@syntaxure/ui";

/**
 * SectionHeading — the eyebrow / headline / sub rhythm every section repeats.
 *
 * `packages/ui` already ships a `SectionHeader`, but it is built for in-app
 * dashboard panels: `text-xl`, a right-aligned action button, and a hairline
 * kicker. A marketing section needs display-scale type and no action. Reusing it
 * here would have meant fighting it with overrides at every call site.
 */

interface SectionHeadingProps {
  eyebrow: string;
  headline: string;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  headline,
  sub,
  align = "left",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        centered && "items-center text-center",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-6 bg-[var(--border-glow)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-cyan)] md:text-xs">
          {eyebrow}
        </span>
      </div>

      <h2 className="max-w-3xl text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
        {headline}
      </h2>

      {sub && (
        <p
          className={cn(
            "max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base",
            centered && "mx-auto",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
