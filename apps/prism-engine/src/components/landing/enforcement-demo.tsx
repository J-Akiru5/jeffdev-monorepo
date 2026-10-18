"use client";

/**
 * EnforcementDemo — the showpiece.
 *
 * A staged replay of the real thing: the hook command, the PostToolUse payload,
 * the byte-exact block output, and the exit code. Every line comes from
 * `blockTranscript` in content.ts, which cites the file each one is copied from.
 *
 * ## How the sequence moves
 *
 * On a screen that can show the whole section at once it is **pinned and held**.
 * Scrolling into it stops the page on step 01; each further scroll stops it on
 * the next step; 04 is the last hold, and after that the section scrolls away and
 * the page is free. Four steps, four holds, one scroll each.
 *
 * The holds are pushed, not enforced. The reader is never unable to scroll: they
 * are moved back to the step they are on, which is the difference between a
 * sequence with a spine and a page that fights the finger. The hold also gives
 * way to anything that is not a gesture, which is what keeps a link, a scrollbar
 * drag and the Back button from being dragged backwards into a demo.
 *
 * Below that viewport the section stacks, is taller than one screen, and cannot
 * hold anything, so it steps with the scroll instead. Same four steps, same
 * transcript, no lock.
 *
 * ## Two invariants, kept from the first version
 *
 *  1. **SSR renders the complete transcript.** The reveal is a visual effect on
 *     top, not the source of truth — lines are always in the DOM. So the terminal
 *     is meaningful with JavaScript disabled, is readable by a crawler, and the
 *     server-rendered HTML is not an empty box.
 *  2. **The manual control stays.** A presenter who has to talk over the top of it
 *     should not have to scroll to make the point, so `Run again` walks the same
 *     three reveals on a clock and then hands the sequence straight back.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@syntaxure/ui";
import { Section } from "./section-shell";
import { SectionHeading } from "./section-heading";
import { useScrollHolds } from "./scroll-holds";
import { InlineCode } from "./inline-code";
import { blockTranscript, sectionIds, theBlock } from "./content";

/** The last step. Step 3 is "the agent fixes it", and it owns the exit code. */
const LAST_BEAT = 3;
const FIRST_BEAT = 0;
const BEAT_MS = 1500;

/**
 * Where the pinned mode applies. Must stay in step with the media query on
 * `.the-block-region` in globals.css: if CSS pins and this does not, the section
 * holds a screen with nothing advancing on it, and if this pins and CSS does not,
 * the holds fire against a stage that is already moving out of the viewport.
 */
const PINNED_VIEWPORT = "(min-width: 1024px) and (min-height: 820px)";

/** Distance between holds, as a fraction of the viewport height. */
const HOLD_GAP = 0.16;


/**
 * The unpinned mapping: where in the section's travel through the viewport each
 * step sits, for readers whose screen cannot hold the section still.
 *
 * `offset` starts the mapping when the section's top has climbed to 85% of the
 * viewport height and finishes when its bottom reaches 60%, and the steps are
 * spread over the middle of that travel rather than its ends, so 01 is not on
 * screen while the section is still half below the fold.
 */
const SCROLL_RANGE = ["start 0.85", "end 0.6"] as const;
const STEP_RANGE = [0.08, 0.72] as const;

const lineColour: Record<string, string> = {
  prompt: "text-[var(--text-primary)]",
  meta: "text-[var(--text-tertiary)]",
  out: "text-[var(--text-secondary)]",
  exit: "text-emerald-400",
};

export function EnforcementDemo() {
  const reduceMotion = useReducedMotion();
  // Starts fully revealed, so the server-rendered HTML is never an empty box.
  const [revealedThrough, setRevealedThrough] = useState(LAST_BEAT);
  const [playing, setPlaying] = useState(false);
  const [pinned, setPinned] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: [...SCROLL_RANGE],
  });

  /** Position in the section's travel, expressed as a step from 0 to 3. */
  const stepValue = useTransform(
    scrollYProgress,
    [...STEP_RANGE],
    [FIRST_BEAT, LAST_BEAT],
  );

  const applyStep = useCallback((value: number) => {
    setRevealedThrough(Math.max(FIRST_BEAT, Math.min(LAST_BEAT, Math.round(value))));
  }, []);

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  };

  /**
   * The clock-driven pass, for the one case the scroll cannot serve: walking the
   * sequence while somebody talks over the top of it. It is muted out of both
   * scroll drivers while it runs, so three writers never touch one piece of state.
   */
  const play = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealedThrough(LAST_BEAT);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(true);
    setRevealedThrough(FIRST_BEAT);

    let beat = FIRST_BEAT as number;
    timerRef.current = setInterval(() => {
      beat += 1;
      setRevealedThrough(beat);
      if (beat >= LAST_BEAT) {
        const t = timerRef.current;
        if (t) clearInterval(t);
        timerRef.current = null;
        setPlaying(false);
      }
    }, BEAT_MS);
  };

  /** Which of the two drivers is in charge on this screen. */
  useEffect(() => {
    const query = window.matchMedia(PINNED_VIEWPORT);
    const apply = () => setPinned(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  /**
   * The scroll driver, for screens that cannot hold the section still.
   *
   * `useMotionValueEvent` only fires on change, so the first frame is applied by
   * hand, once. Without it, a reader who reloads halfway down the page or arrives
   * on `#the-block` would keep the SSR frame (fully revealed) until their first
   * scroll tick, so the terminal would already be complete and that first scroll
   * would look like a rewind. Exactly once, for the opposite reason: re-priming
   * whenever the dependencies change would snap the sequence back to the scroll's
   * position the instant a manual pass finished.
   */
  const primed = useRef(false);
  useEffect(() => {
    if (reduceMotion || pinned || playing) return;
    if (!primed.current) {
      primed.current = true;
      applyStep(stepValue.get());
    }
    return stepValue.on("change", applyStep);
  }, [applyStep, pinned, playing, reduceMotion, stepValue]);

  /**
   * The four holds, for screens that can hold the section still.
   *
   * The first hold is where the section comes to rest, which is also step 01, and
   * each hold after it pays for one more step. `useScrollHolds` keeps the index of
   * the hold the reader is standing on and hands it straight to `applyStep`, so the
   * step and the position cannot drift apart, and the cooldown that keeps momentum
   * from skipping a step lives there with it.
   *
   * The positions are measured rather than fixed. The region's height is set in CSS
   * from the viewport and the gap comes from the viewport again, so the holds are
   * re-derived on every resize instead of trusting the first reading.
   */
  const holds = useCallback(() => {
    const region = regionRef.current;
    if (!region) return [];
    const top = region.getBoundingClientRect().top + window.scrollY;
    const gap = Math.max(72, window.innerHeight * HOLD_GAP);
    return [0, 1, 2, 3].map((step) => Math.round(top + step * gap));
  }, []);

  useScrollHolds({
    holds,
    onHold: applyStep,
    enabled: pinned && !reduceMotion,
  });

  useEffect(() => stop, []);

  return (
    <div ref={regionRef} className="the-block-region">
      <Section
        ref={sectionRef}
        id={sectionIds.theBlock}
        className="the-block-stage"
      >
        <SectionHeading
          eyebrow={theBlock.eyebrow}
          headline={theBlock.headline}
          sub={theBlock.sub}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          {/* Beats */}
          <div>
            <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-quiet)]">
              <span aria-hidden="true" className="h-px w-6 bg-[var(--border-glow)]" />
              {theBlock.scrollHint}
            </p>

            <ol className="flex flex-col gap-6">
              {theBlock.beats.map((beat, index) => {
                const isActive = index === revealedThrough;
                const isDone = index < revealedThrough;
                return (
                  <li key={beat.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] transition-colors duration-300",
                          isActive
                            ? "border-[var(--color-cyan)] bg-cyan-500/10 text-[var(--color-cyan)]"
                            : "border-[var(--border-subtle)] text-[var(--text-tertiary)]",
                          isDone && "border-emerald-500/40 text-emerald-400",
                        )}
                      >
                        {beat.label}
                      </span>
                      {index < theBlock.beats.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="mt-2 w-px flex-1 bg-[var(--border-subtle)]"
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <h3
                        className={cn(
                          "text-sm font-semibold tracking-tight transition-colors duration-300 md:text-base",
                          isActive
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)]",
                        )}
                      >
                        {beat.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)] md:text-sm">
                        <InlineCode text={beat.body} />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Terminal */}
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[#08080a]">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-2.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                  />
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {theBlock.terminalTitle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={playing ? stop : play}
                  aria-label={
                    playing ? "Stop the walkthrough" : "Run the walkthrough"
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-[var(--border-subtle)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-active)] hover:text-[var(--text-primary)] active:scale-95"
                >
                  {playing ? (
                    <>
                      <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                      {theBlock.playingLabel}
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" strokeWidth={1.5} />
                      {theBlock.replayLabel}
                    </>
                  )}
                </button>
              </div>

              <div className="min-h-[220px] overflow-x-auto p-4 md:p-5">
                <pre className="font-mono text-[11px] leading-relaxed md:text-xs">
                  <code>
                    {blockTranscript.map((line, index) => (
                      <span
                        key={`${line.kind}-${index}`}
                        className={cn(
                          "block whitespace-pre-wrap break-words transition-opacity duration-300",
                          lineColour[line.kind],
                          line.beat > revealedThrough && "opacity-0",
                          line.kind === "meta" && "italic",
                        )}
                      >
                        {line.kind === "prompt" ? `$ ${line.text}` : line.text}
                      </span>
                    ))}
                  </code>
                </pre>

                {/*
                 * Step 01 is "the agent writes", and a terminal cannot show a
                 * write that has not been checked yet: no line of the real
                 * transcript belongs to it. The panel says what it is waiting for
                 * rather than pretending to be output, because a genuinely empty
                 * box reads as a broken one.
                 */}
                {revealedThrough < 1 && (
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-[var(--text-quiet)] italic md:text-xs">
                    {theBlock.idleNote}
                  </p>
                )}
              </div>
            </div>

            <p className="font-mono text-[10px] leading-relaxed text-[var(--text-quiet)] md:text-[11px]">
              {theBlock.caption}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default EnforcementDemo;
