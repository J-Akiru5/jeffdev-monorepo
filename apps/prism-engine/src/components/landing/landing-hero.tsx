"use client";

/**
 * LandingHero — the opening screen and its scroll-scrubbed sequence.
 *
 * ## The scene
 *
 * The product is a prism: light goes in, a spectrum comes out. So the hero is
 * that, literally. A beam arrives, the prism throws its spectrum, and the light
 * bends into an index of the page. It is not a particle field borrowed from an
 * unrelated site; it is the one image this product owns.
 *
 * ## Why this is not the hero it replaced
 *
 * The previous hero pinned 300vh and *revealed* itself on scroll, so the page
 * made no case until you had scrolled twice. This one is the opposite: every word
 * is painted and readable on the first frame, the calls to action never leave,
 * and scrolling only deepens the light. Nothing is gated on an animation having
 * run, so the page is intact for a crawler, for a reduced-motion reader, and for
 * someone who never scrolls at all.
 *
 * ## Why the sequence resolves into an index
 *
 * The first version of this dissolved the copy and scaled the prism up, which
 * left the reader staring at a large glass slab and an otherwise empty stage: a
 * motion demo, not a page. So the payoff carries content. The scroll trades the
 * paragraph for the three places worth going, and the prism grows into the space
 * the copy leaves: it paints roughly twice the height it does on the first
 * frame, measured by what it paints rather than by its box, and that is as large
 * as it can be while still clearing the fixed nav above it and the index beneath
 * it at every phase of its rotation.
 *
 * ## Mechanics
 *
 * `position: sticky` on the stage does the pinning, in CSS, with no scroll
 * jacking and no layout thrash; framer-motion maps scroll progress onto
 * transforms. Only `transform` and `opacity` animate, so the sequence runs on the
 * compositor. The copy and the index occupy the same grid cell, so they
 * cross-fade in place instead of swapping and reflowing the stage under the
 * reader's finger. Under `prefers-reduced-motion` the scene renders as a finished
 * still: spectrum open, copy present, no index.
 *
 * One scroll lock holds the payoff frame so a fast flick cannot sail past the
 * thing the hero is arguing. It is a one-shot gate in JavaScript, and the effect
 * below documents why it is not CSS snapping; the short version is that a lock
 * which also stops links from working, or which lets the flick through anyway, is
 * worse than no lock at all, and both of those were measured rather than guessed.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Prism3D } from "./prism-3d";
import { CommandPill } from "./command-pill";
import { useScrollHolds } from "./scroll-holds";
import { hero, heroIndex, heroIndexHeading } from "./content";

/**
 * Distance between the hero's two holds, as a fraction of the viewport height.
 *
 * Big enough that the flick which paid the first hold cannot pay the second one
 * out of its own momentum, small enough that the two frames are the same
 * composition rather than two different ones.
 */
const HOLD_GAP = 0.13;

/** Spectrum tie-in for the index rows: cyan, violet, rose, in refraction order. */
const indexAccents = [
  "var(--color-cyan)",
  "var(--color-purple)",
  "#f43f5e",
] as const;

/**
 * The payoff is a space problem, and the space is not the same on a laptop and
 * on a phone.
 *
 * A wide viewport has the room: at 2x the prism paints 432 to 470px depending on
 * where its 20s rotation is, inside a band about 490px tall between the nav and
 * the index. Swept across all twenty phases of that rotation at 1440x900, it
 * clears the nav by at least 7px and the index label by at least 16px. Those are
 * worst-phase figures rather than averages: a single still frame fits a much
 * larger prism than any phase has to.
 *
 * A phone does not, and it fails in the other direction: there the index list is
 * tall because every row wraps, so a large downward drift on it runs straight
 * into the call-to-action row. Measured at 390x844, the previous tuning put the
 * list 12px into the buttons and the same 2x first put it 49px in and brought the
 * glass within 5px of its own label. So the phone drifts less, in both places,
 * and spends the room that frees on the prism.
 *
 * The two numbers move together rather than being fixed in the component: the
 * drift is what creates the band the scale is allowed to fill, so changing one
 * without the other is how a frame that fits at 1440 stops fitting at 390.
 */
const WIDE_VIEWPORT = "(min-width: 1024px)";

interface PayoffTuning {
  /** Final scale of the whole optical assembly. */
  scale: number;
  /** How far the assembly travels down as it grows. */
  assembly: number;
  /** How far the index travels down with it, so the gap between them holds. */
  index: number;
}

const PAYOFF: { wide: PayoffTuning; compact: PayoffTuning } = {
  wide: { scale: 2, assembly: 116, index: 108 },
  compact: { scale: 1.9, assembly: 51, index: 52 },
};

/**
 * Starts on the compact tuning so the first client render matches the server's.
 * The effect corrects it before the sequence reaches the payoff at p 0.82, so the
 * only frame that can see the difference is one no reader is looking at.
 */
function usePayoff(): PayoffTuning {
  const [payoff, setPayoff] = useState<PayoffTuning>(PAYOFF.compact);

  useEffect(() => {
    const query = window.matchMedia(WIDE_VIEWPORT);
    const apply = () => setPayoff(query.matches ? PAYOFF.wide : PAYOFF.compact);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return payoff;
}

export function LandingHero() {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIndex, setShowIndex] = useState(false);
  const payoff = usePayoff();

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  // The copy lifts away as the index arrives.
  const copyY = useTransform(scrollYProgress, [0.1, 0.52], [0, -56]);
  const copyOpacity = useTransform(scrollYProgress, [0.08, 0.46], [1, 0]);

  const indexOpacity = useTransform(scrollYProgress, [0.42, 0.72], [0, 1]);
  // The last leg still drifts the index down as the prism finishes growing, so
  // the two settle together: the prism ends 116px below where it started and the
  // index 108px with it, which holds the distance between them roughly constant
  // instead of the glass closing on the label.
  //
  // Both ramps finish at p 0.82 rather than at the end of the scroll, and that is
  // not tidiness. The hero holds twice, and the first hold lands at p 0.855: with
  // the drift still running there, the index sat 64px higher than its final
  // position while the prism was already at full size, and the glass came down on
  // the label. Ending the drift where the growth ends means every frame from
  // p 0.82 on is the same finished composition, so both holds show it and neither
  // can collide.
  const indexY = useTransform(scrollYProgress, [0.42, 0.72, 0.82], [22, 0, payoff.index]);

  // One transform moves the whole optical assembly: glow, fan, ribbon, prism.
  //
  // The ramp is late and the drift is downward, and both are load-bearing. The
  // prism has to grow into the space the copy vacates without its top vertex
  // sliding under the fixed nav, so the scale holds near 1 until the copy has
  // actually gone (p 0.45) and the assembly moves *down* as it enlarges. Growing
  // it upward, or growing it while the copy is still on screen, either slices
  // the vertex on the nav or grows it straight into the headline.
  //
  // The payoff size is capped by the two things it sits between: the 66px nav
  // above and the index below. On a 900px-tall viewport that is a band about
  // 490px tall, from y=72 to y=560. At 2x the silhouette paints 432 to 470px
  // depending on where the 20s rotation happens to be. Swept across all twenty
  // phases of it, it clears the nav by at least 7px and the index label by at
  // least 16px. The rotation, not the average, is what sets the ceiling: a single
  // still frame fits a much larger prism, and the phase that clips the top vertex
  // is the one a judge would be looking at. Two things buy the room. The assembly drifts
  // *down* 116px as it enlarges, and the index drifts down with it (see
  // `indexY`), and the prism's own base size is smaller under `md` so the same 2x
  // still fits a phone (see `--prism-scale`),
  // which keeps the top vertex off the nav without closing the gap to the label.
  //
  // Note what is being measured: not the element's box. The faces are pushed
  // toward the camera inside a `perspective` and the prism rotates, so what
  // paints is about 13% taller than the box and its edges move over a 20s cycle.
  // Measure the `.prism-face` rects, not `.hero-prism`, before changing this.
  const orbitScale = useTransform(scrollYProgress, [0, 0.45, 0.82], [1, 1.02, payoff.scale]);
  const orbitY = useTransform(scrollYProgress, [0, 0.5, 0.82], [0, 0, payoff.assembly]);

  // The spectrum opens.
  const ribbonScaleX = useTransform(scrollYProgress, [0.12, 0.6], [0, 1]);
  const ribbonOpacity = useTransform(scrollYProgress, [0.1, 0.34, 1], [0, 0.9, 0.62]);

  const fanOpacity = useTransform(scrollYProgress, [0.14, 0.58, 1], [0, 1, 0.62]);
  const fanRotate = useTransform(scrollYProgress, [0.14, 1], [-9, 12]);
  const fanScale = useTransform(scrollYProgress, [0.14, 1], [0.62, 1.34]);

  /*
   * The cue says "Scroll" twice: once when the page opens, and again on the
   * payoff, where it is the only thing telling the reader that the frame they are
   * held on has another scroll behind it. It is tied to scroll progress rather
   * than to the locks themselves, so it cannot get stuck on if a lock is released
   * early by a link.
   */
  const cueOpacity = useTransform(
    scrollYProgress,
    [0, 0.06, 0.78, 0.84],
    [1, 0, 0, 0.9],
  );

  /**
   * Both layers are in the same grid cell, so the hidden one would still swallow
   * clicks on the command pill's copy button. Pointer events follow visibility
   * rather than being left on for the whole sequence.
   */
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setShowIndex(value > 0.5);
  });

  /**
   * The two holds that end the hero.
   *
   * The page stops on the payoff frame, and it stops there twice. The first
   * scroll pays for the frame the reader is already looking at; the second pays
   * for it settling into its final position; the third scroll is free.
   *
   * It is two rather than one on purpose. A single hold can be spent by the
   * momentum of the flick that reached it, so the reader arrives, is pushed back
   * once and is gone again before the frame has been looked at. Two holds cost one
   * extra gesture and turn the payoff from something they landed on into something
   * they scrolled *through*.
   *
   * Both holds sit inside the pinned travel rather than beyond it, so both frames
   * are the composition the hero has been building towards: the prism is already at
   * its final size at the first one, and the index drifts the last of the way down
   * between them. How far apart they sit is what decides whether the second is paid
   * by a new gesture or by leftover momentum, which is why it is a fraction of the
   * viewport rather than a constant.
   *
   * `useScrollHolds` owns the rest: the cooldown that keeps momentum from skipping
   * a hold, the release on a chosen link, and the re-arm at the top of the page so
   * the sequence replays rather than staying spent.
   *
   * Why not `scroll-snap-type` in CSS, which is the obvious way to do this: CSS
   * snapping cannot express "hold, then let go". Armed, it broke fragment
   * navigation outright. Measured: a real click on any in-page link set
   * `location.hash` and the page never moved from 810, sampled every 120ms for
   * three seconds. "See the block", the hero's only primary call to action, is one
   * of those links. Unarmed, `proximity` snaps only when a gesture happens to end
   * near a snap point, so a measured 1200px flick went straight through to 1200
   * and the payoff frame was never seen at all.
   */
  const heroHolds = useCallback(() => {
    const region = scrollRef.current;
    if (!region) return [];
    const top = region.getBoundingClientRect().top + window.scrollY;
    /** Scroll offset at which the sticky stage is fully pinned: the payoff. */
    const payoff = top + region.offsetHeight - window.innerHeight;
    const gap = Math.max(72, window.innerHeight * HOLD_GAP);
    /*
     * Three positions for two holds, because the first entry in the list is where
     * the sequence comes to rest and only the entries after it are paid for. So
     * the reader passes the first, is stopped at the second, is stopped again at
     * the third, and is free after it.
     */
    return [
      Math.round(payoff - 2 * gap),
      Math.round(payoff - gap),
      Math.round(payoff),
    ];
  }, []);

  useScrollHolds({ holds: heroHolds, enabled: !reduceMotion });

  /**
   * Reduced motion gets the finished composition rather than a disabled one: the
   * spectrum sits fully open instead of collapsed at progress 0.
   */
  const still = (animated: MotionValue<number>, fallback: number) =>
    reduceMotion ? fallback : animated;

  return (
    <div
      ref={scrollRef}
      className={
        reduceMotion ? "relative" : "hero-scroll-region relative h-[190vh]"
      }
    >
      <section
        aria-label="Prism Context Engine"
        className={`hero-stage${reduceMotion ? "" : " sticky top-0"}`}
      >
        <div className="hero-column">
          {/* The optical assembly. The orbit box has to clear the prism's scaled
              height or `overflow: hidden` slices the top and bottom off it. */}
          <motion.div
            style={{ scale: still(orbitScale, 1), y: still(orbitY, 0) }}
            className="hero-orbit"
          >
            <div className="hero-prism-glow" />
            <motion.div
              className="hero-fan"
              style={{
                opacity: still(fanOpacity, 0.9),
                rotate: still(fanRotate, 3),
                scale: still(fanScale, 1.2),
              }}
            />
            <motion.div
              className="hero-ribbon"
              style={{
                scaleX: still(ribbonScaleX, 1),
                opacity: still(ribbonOpacity, 0.8),
              }}
            />
            <div className="relative z-10 transition-transform duration-1000 hover:scale-105">
              <Prism3D className="hero-prism mx-auto" />
            </div>
          </motion.div>

          {/* Copy and index share one cell so they cross-fade without reflow. */}
          <div className="hero-swap">
            <motion.div
              style={{
                y: still(copyY, 0),
                opacity: still(copyOpacity, 1),
                pointerEvents: showIndex ? "none" : "auto",
              }}
              className="hero-swap-layer"
            >
              {/* `mt-2` is the second half of the air between the prism and this
                  pill; the first half comes from the orbit's slack. */}
              <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="font-mono text-xs text-[var(--color-cyan)]"
                >
                  ◈
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] md:text-xs">
                  {hero.eyebrow}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">{hero.headline[0]}</span>
              {/* No bottom padding utility here: the gradient class owns the paint
                  box so the descender fix lives in one place. */}
              <span className="text-gradient-holographic block">
                {hero.headline[1]}
              </span>
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
                {hero.subhead}
              </p>

              <div className="mt-6 flex w-full flex-col items-center">
                <CommandPill command={hero.command} />
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] md:text-xs">
                  {hero.mechanism}
                </p>
              </div>
            </motion.div>

            {!reduceMotion && (
              <motion.div
                aria-hidden={!showIndex}
                style={{
                  opacity: indexOpacity,
                  y: indexY,
                  pointerEvents: showIndex ? "auto" : "none",
                }}
                className="hero-swap-layer w-full"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-quiet)]">
                  {heroIndexHeading}
                </p>
                <ul className="mt-3 w-full max-w-2xl border-t border-[var(--border-subtle)]">
                  {heroIndex.map((item, i) => (
                    <li key={item.title}>
                      {/*
                        * A plain anchor rather than `next/link`, and that is
                        * load-bearing. `Link` handles an in-page hash by pushing
                        * it through the router, and a hash pushed with
                        * `history.pushState` does not make the browser scroll:
                        * measured, a real click on "See the block" set
                        * `location.hash` and left the page exactly where it was.
                        * A plain anchor is a fragment navigation, which the
                        * browser performs itself, which is also the path the
                        * scroll lock's click release already knows to stand down
                        * for.
                        */}
                      <a
                        href={item.href}
                        className="group grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--border-subtle)] px-3 py-3.5 text-left transition-colors duration-300 hover:bg-white/[0.03]"
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: indexAccents[i] }}
                        />
                        <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-quiet)]">
                          {item.label}
                        </span>
                        <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                          <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                            {item.title}
                          </span>
                          <span className="text-xs leading-relaxed text-[var(--text-tertiary)]">
                            {item.body}
                          </span>
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-[var(--text-quiet)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--color-cyan)]"
                          strokeWidth={1.5}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Actions and facts stay at full opacity. The scene may dissolve around
              them; the only ways forward must never dissolve with it. */}
          {/* Actions wrap side by side rather than stacking full width. Stacked,
              three full-width buttons cost ~160px of a 732px mobile budget and
              pushed the whole column up behind the fixed nav. */}
          <div className="mt-4 flex w-full flex-row flex-wrap items-center justify-center gap-3">
            {hero.ctas.map((cta) => {
              if (cta.variant === "primary") {
                /* The only call to action that is an in-page hash. A plain
                   anchor, for the reason given on the index rows above. */
                return (
                  <a
                    key={cta.label}
                    href={cta.href}
                    className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-3 font-mono text-xs font-semibold tracking-wider !text-white transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 sm:flex-none sm:px-6 sm:text-sm"
                  >
                    <span className="relative z-10 uppercase">{cta.label}</span>
                    <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                );
              }

              if (cta.variant === "secondary") {
                return (
                  <Link
                    key={cta.label}
                    href={cta.href}
                    className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-3 font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)] active:scale-95 sm:flex-none sm:px-6 sm:text-sm"
                  >
                    {cta.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={cta.label}
                  href={cta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex basis-full items-center justify-center gap-1.5 px-2 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text-primary)] hover:underline sm:basis-auto sm:py-3"
                >
                  {cta.label}
                </Link>
              );
            })}
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] md:text-[11px]">
            {hero.facts.map((fact, index) => (
              <li key={fact} className="flex items-center gap-4">
                <span>{fact}</span>
                {index < hero.facts.length - 1 && (
                  <span aria-hidden="true" className="text-[var(--border-glow)]">
                    ·
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {!reduceMotion && (
          <motion.div style={{ opacity: cueOpacity }} className="hero-cue">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-quiet)]">
              Scroll
            </span>
            <span aria-hidden="true" className="hero-cue-rail" />
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default LandingHero;
