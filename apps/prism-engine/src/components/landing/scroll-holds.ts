"use client";

import { useEffect, useRef } from "react";

/**
 * useScrollHolds — the pinned, stepped scroll lock, in one place.
 *
 * Give it the scroll positions a section should stop at and it makes the reader
 * pay for each one: arriving at a hold pins the page onto it, a **new** gesture
 * pays the next, and once the last is paid the page is free. The hero and the
 * enforcement section both use it, so the two locks behave the same way instead
 * of drifting apart as each one is tuned for its own frame.
 *
 * The rule that matters is the one about gestures, and it is worth stating on its
 * own because everything else here exists to support it:
 *
 *   **A hold is released by a new gesture, never by the one that reached it.**
 *
 * That is not a nicety. A wheel that keeps spinning, a trackpad that keeps
 * coasting and a key held down all keep emitting scroll events long after the
 * reader stopped asking for them, and a lock that only defends itself on a timer
 * lets that coast pay the next hold a moment later. From the reader's side the
 * sequence then looks like a page that stutters rather than one that stops: they
 * flick once, the page twitches, and it is gone. So the input has to go silent
 * before the next hold will be paid at all, which means the only thing that can
 * move the page on is a fresh gesture.
 *
 * The rest of it:
 *
 *  1. **A flick cannot escape.** Distance alone cannot tell a hard flick from a
 *     scrollbar drag, and the two need opposite treatment: a flick has to be
 *     pinned or the whole sequence can be thrown through in one motion, while a
 *     drag to a known place has to be allowed through. So wheel, touch, key and
 *     pointer events are recorded, and a large jump only gives way when nothing
 *     was gesturing at the time.
 *  2. **A chosen link outranks the lock.** A click on an in-page anchor, a
 *     `hashchange` or a `popstate` releases it, because a fragment the reader
 *     picked must never be dragged back into a demo. The release has to hold for
 *     a moment as well: a fragment navigation lifts off from the top of the page,
 *     so its first frames look exactly like a reader who has scrolled back up,
 *     and without the stand-down window the lock re-arms behind the navigation
 *     and pins the page on the hero instead of letting it reach the section.
 *  3. **The holds are measured, not fixed.** Positions come from a callback, and
 *     `resize` calls it again, so a window change re-derives them from the layout
 *     rather than trusting the first reading.
 *
 * The lock gives the steps back on the way up: scrolling back above a hold
 * returns the section to the state behind it, so the frame and the reader's
 * position never disagree, and going back above the first hold re-arms the whole
 * sequence so it replays rather than staying spent.
 */

export interface ScrollHoldOptions {
  /**
   * The positions to stop at, in document scroll coordinates, in order of travel.
   * Called again on every resize, so it can read the layout directly.
   *
   * The first entry is where the sequence comes to rest, and the reader is not
   * stopped on it: they arrive, and the holds they pay for are every entry after
   * it. A section that has four steps and stops on three of them therefore hands
   * over four positions, and one that wants two holds hands over three.
   */
  holds: () => number[];
  /**
   * Called with the index of the hold the reader is now standing on. Index 0 is
   * the first hold, so a section showing step 01 on arrival maps this straight
   * onto its step number.
   */
  onHold?: (index: number) => void;
  /** Off for reduced motion, and for viewports too small to pin anything. */
  enabled: boolean;
}

/**
 * How long the input has to be silent before the next hold can be paid. Long
 * enough to outlast the tail of a flick, short enough that a deliberate second
 * scroll is never waiting on it.
 */
const INPUT_QUIET_MS = 180;

/** A floor between holds, so two events in one gesture frame cannot both pay. */
const HOLD_COOLDOWN_MS = 150;

/** Above the first hold by this much, the sequence re-arms and replays. */
const REARM_PX = 48;

/**
 * How long a release holds, so a navigation can finish before the lock re-arms.
 *
 * A fragment navigation lifts off from the top of the page, which means that for
 * the first frames of it the reader is inside the re-arm zone and looks exactly
 * like someone who has just scrolled back to the top. Without this window the
 * release fired on the click and the re-arm strapped the lock back on immediately,
 * and a measured click on "See the block" set `location.hash` to `#the-block` and
 * then never moved the page at all. Longer than any anchor scroll, shorter than
 * the time it takes to scroll back up and read the hero again.
 */
const STAND_DOWN_MS = 1500;

/** How far back up a hold has to be given before the state behind it returns. */
const STEP_BACK_PX = 70;

/** How recently a gesture has to have happened for a jump to be treated as one. */
const GESTURE_WINDOW_MS = 800;

/** A jump past this many viewports, with nothing gesturing, is navigation. */
const JUMP_VIEWPORTS = 1.5;

export function useScrollHolds({
  holds,
  onHold,
  enabled,
}: ScrollHoldOptions): void {
  /* Read through refs so an inline callback does not re-subscribe the listeners
     on every render, which would drop the timestamps that hold momentum back. */
  const holdsRef = useRef(holds);
  const onHoldRef = useRef(onHold);

  useEffect(() => {
    holdsRef.current = holds;
    onHoldRef.current = onHold;
  });

  useEffect(() => {
    if (!enabled) return;

    let positions = holdsRef.current();
    if (positions.length < 2) return;

    const measure = () => {
      positions = holdsRef.current();
    };

    /** Index of the hold still to be paid. Doubles as the state behind it. */
    let owed = 1;
    let lastHoldAt = -Infinity;
    let lastGestureAt = -Infinity;
    let releasedAt = -Infinity;
    let last = window.scrollY;

    /**
     * Whether a hold can be paid right now. Cleared when one is paid, set again
     * only once the input has gone quiet, so the coast that followed the last
     * gesture cannot pay for the next one.
     */
    let armed = true;
    let quietTimer: ReturnType<typeof setTimeout> | null = null;

    /** Scroll offset at which the sticky stage is fully pinned: the payoff. */
    const stand = (index: number) => onHoldRef.current?.(index);

    /*
     * Wheel and touch are what a reader's scroll is made of; keydown covers the
     * keyboard, where PageDown is a gesture and ought to step like one; pointerdown
     * covers a scrollbar drag, which fires none of the other three and would
     * otherwise be unable to re-arm the lock. A scrollbar drag is exactly what the
     * jump test below is unable to separate from a flick, which is why it is also
     * marked as a gesture here.
     */
    const markInput = () => {
      lastGestureAt = performance.now();
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        armed = true;
      }, INPUT_QUIET_MS);
    };

    const release = () => {
      owed = positions.length;
      releasedAt = performance.now();
    };

    const onScroll = () => {
      const y = window.scrollY;
      const moved = Math.abs(y - last);
      const now = performance.now();
      last = y;

      /* Back above the sequence: reset the state behind hold 0, so a replay starts
         where the reader left it rather than mid-sequence. Re-arming is held back
         for `STAND_DOWN_MS` after a release, because a fragment navigation begins
         at the top of the page and would otherwise look like a re-entry. */
      if (y < positions[0]! - REARM_PX) {
        if (now - releasedAt < STAND_DOWN_MS) return;
        owed = 1;
        stand(0);
        return;
      }

      /* A jump with no gesture behind it: a scrollbar drag, a restored position,
         a link. Give way, and re-arm if the reader comes back through. */
      if (moved > window.innerHeight * JUMP_VIEWPORTS && now - lastGestureAt > GESTURE_WINDOW_MS) {
        release();
        return;
      }

      /*
       * Scrolling back up hands the step back, so the frame and the position agree
       * in both directions instead of the state outrunning the reader.
       *
       * Not while released, which is what `owed < positions.length` is doing here.
       * A release is expressed as every hold being paid, and a navigation starts
       * from above the first hold, so without this the first frames of a fragment
       * scroll look exactly like a reader stepping back: the release was undone,
       * the lock re-armed behind it, and a measured click on "See the block"
       * stopped the page dead on the hero's last frame instead of landing on the
       * section it asked for.
       */
      if (
        owed > 1 &&
        owed < positions.length &&
        y < positions[owed - 1]! - STEP_BACK_PX
      ) {
        owed -= 1;
        stand(owed - 1);
        return;
      }

      if (owed >= positions.length) return;

      const target = positions[owed]!;
      if (y < target) return;

      /*
       * Past the next hold, and the only question left is whether the reader asked
       * to be. Two ways the answer is no: the input has not gone quiet since the
       * last hold, or it is still going. Both put the page back and wait.
       */
      if (!armed || now - lastHoldAt < HOLD_COOLDOWN_MS) {
        window.scrollTo({ top: positions[owed - 1]!, behavior: "instant" });
        last = positions[owed - 1]!;
        return;
      }

      lastHoldAt = now;
      armed = false;
      stand(owed);
      owed += 1;
      window.scrollTo({ top: target, behavior: "instant" });
      last = target;
    };

    const onDocumentClick = (event: MouseEvent) => {
      const node = event.target as Element | null;
      if (node?.closest('a[href^="#"]')) release();
    };

    /* One pass on mount, so a reader who lands mid-sequence from a link sees the
       state their position implies rather than the server-rendered one. */
    onScroll();

    /* Capture phase: this has to run before the fragment is resolved, or the
       lock can fire on the way to a section the reader picked. */
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("hashchange", release);
    window.addEventListener("popstate", release);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("wheel", markInput, { passive: true });
    window.addEventListener("touchmove", markInput, { passive: true });
    window.addEventListener("keydown", markInput, { passive: true });
    window.addEventListener("pointerdown", markInput, { passive: true });

    return () => {
      if (quietTimer) clearTimeout(quietTimer);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("hashchange", release);
      window.removeEventListener("popstate", release);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("wheel", markInput);
      window.removeEventListener("touchmove", markInput);
      window.removeEventListener("keydown", markInput);
      window.removeEventListener("pointerdown", markInput);
    };
  }, [enabled]);
}
