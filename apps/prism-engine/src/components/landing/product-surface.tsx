"use client";

/**
 * ProductSurface — the real product, at size.
 *
 * The page's most persuasive asset is the thing itself. A dense, legible
 * screenshot of the running dashboard does more for a technical reader than any
 * amount of copy, and this page previously had no imagery at all, which is its
 * own kind of bug: a text-only marketing page reads as unfinished rather than as
 * restrained.
 *
 * Two deliberate constraints:
 *
 *  1. **The capture is never hidden behind a reveal.** Scroll modulates its
 *     scale, position and opacity, but never from zero and never gated on a
 *     class or a transition, so the image is present in the server-rendered HTML
 *     and in any environment where a scroll-driven animation never fires.
 *  2. **Nothing here quotes a number the image does not show.** The readouts
 *     describe what the interface holds, not a growth metric.
 */

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { InlineCode } from "./inline-code";
import { productSurface, sectionIds } from "./content";

export function ProductSurface() {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });

  // Ranges stay away from 0 so the frame is always visible.
  const frameScale = useTransform(scrollYProgress, [0, 1], [0.93, 1.03]);
  const frameY = useTransform(scrollYProgress, [0, 1], [26, -26]);
  const frameOpacity = useTransform(scrollYProgress, [0, 0.4], [0.72, 1]);

  return (
    /* `overflow-hidden` contains the spectral glow behind the frame. The glow is
       80rem wide on purpose but is capped at 150vw, which on a phone is still
       wider than the viewport: without this the page gained ~94px of horizontal
       scroll and the whole layout could be dragged sideways. */
    <Section id={sectionIds.product} className="overflow-hidden">
      {/* `sub` is rendered below rather than through SectionHeading, because it
          contains a backtick span that needs the InlineCode renderer. */}
      <SectionHeading
        eyebrow={productSurface.eyebrow}
        headline={productSurface.headline}
      />

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
        <InlineCode text={productSurface.sub} />
      </p>

      <div ref={frameRef} className="relative mt-12">
        {/* Light behind the frame, tying the console into the dispersion field */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[80rem] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(6,182,212,0.16),rgba(139,92,246,0.12)_42%,transparent_72%)]"
        />

        <motion.figure
          style={{
            scale: reduceMotion ? 1 : frameScale,
            y: reduceMotion ? 0 : frameY,
            opacity: reduceMotion ? 1 : frameOpacity,
          }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="overflow-hidden rounded-md border border-[var(--border-active)] bg-[#08080a] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
            {/* Browser chrome, so the capture reads as a running product */}
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-2.5">
              <span aria-hidden="true" className="flex shrink-0 gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
              </span>
              <span className="flex-1 overflow-hidden rounded-sm border border-[var(--border-subtle)] bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-[var(--text-quiet)]">
                {productSurface.url}
              </span>
            </div>

            <Image
              src="/prism-dashboard.png"
              alt={productSurface.imageAlt}
              width={1898}
              height={927}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1024px"
              loading="lazy"
              className="block h-auto w-full"
            />
          </div>

          <figcaption className="mt-4 flex items-start gap-2 font-mono text-[10px] leading-relaxed text-[var(--text-quiet)] md:text-[11px]">
            <span
              aria-hidden="true"
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400"
            />
            {productSurface.caption}
          </figcaption>
        </motion.figure>
      </div>

      <ul className="mt-12 grid gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-3">
        {productSurface.readouts.map((readout) => (
          <li key={readout.label} className="bg-[var(--bg-secondary)] p-6">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] md:text-base">
              {readout.label}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] md:text-sm">
              {readout.body}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default ProductSurface;
