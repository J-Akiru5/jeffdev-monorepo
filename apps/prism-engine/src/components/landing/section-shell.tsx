import type { ReactNode, Ref } from "react";
import { cn } from "@syntaxure/ui";

/**
 * Section — the shell every landing section sits in.
 *
 * Exists so the vertical rhythm (py-20 mobile / py-28 desktop), the hairline
 * separator and the max-width gutter are declared once instead of eight times.
 *
 * Note the absence of `.lazy-section` (the app's `content-visibility: auto`
 * utility). It reserves a guessed 3000px per element, and on a page whose whole
 * height is honest content that shows up as scroll jitter as the real heights
 * replace the guess. Eight sections is not a paint problem worth that risk.
 */

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  /**
   * React 19 passes `ref` through as a normal prop, so the demo section can
   * observe its own element without an extra wrapper div.
   */
  ref?: Ref<HTMLElement>;
}

export function Section({ id, children, className, ref }: SectionProps) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "relative scroll-mt-20 border-t border-[var(--border-subtle)] px-4 py-20 sm:px-6 md:py-28 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export default Section;
