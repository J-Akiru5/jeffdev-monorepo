"use client";

/**
 * BackToTop — the floating return control.
 *
 * The page is nine sections and roughly 9,600px on a laptop, so once a reader is
 * deep in the evidence ledger the only way back to the top was the scrollbar. It
 * stays out of the way until it is earned: it appears only after the reader has
 * travelled well past the first viewport, and it fades rather than pops, so it
 * never competes with the hero on first load.
 *
 * Details that matter:
 *
 *  - **`aria-label`, not a bare chevron.** An icon-only button is announced as
 *    nothing, so the label carries the meaning and the glyph is `aria-hidden`.
 *  - **A real focus ring.** It floats over arbitrary background light, so it uses
 *    the same focus treatment as the rest of the page rather than relying on the
 *    browser default, which is invisible against this canvas.
 *  - **Reduced motion scrolls instantly.** A 9,600px smooth scroll is a long,
 *    unavoidable animation and exactly the kind of thing the setting exists to
 *    stop.
 *  - **Above the fold marker, below the nav.** It sits at a z-index under the
 *    fixed navigation so it can never cover the header, and it is hidden from
 *    assistive tech while invisible so it cannot be tabbed to at rest.
 */

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@syntaxure/ui";

/** Roughly two viewports: far enough in that "back to top" is what they want. */
const APPEAR_AFTER_PX = 1200;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > APPEAR_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--border-active)] bg-[var(--color-glass-heavy)] text-[var(--text-secondary)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-cyan)] hover:text-[var(--text-primary)] active:scale-90 md:bottom-7 md:right-7",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

export default BackToTop;
