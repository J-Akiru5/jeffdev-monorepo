"use client";

/**
 * GSAP ScrollTrigger Provider
 * ---------------------------
 * Registers GSAP plugins and provides scroll animation utilities.
 * Uses React 19 useLayoutEffect for synchronous setup.
 *
 * Performance Optimizations:
 * - fastScrollEnd: 0.2s debounce on fast scroll
 * - limitCallbacks: prevents callback flooding on scroll
 * - ignoreMobileResize: skips resize recalcs on mobile
 * - autoRefreshEvents: debounced refresh on resize
 */

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollProviderProps {
  children: ReactNode;
}

export function ScrollProvider({ children }: ScrollProviderProps) {
  const isInitialized = useRef(false);

  useLayoutEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Detect low-end devices
    const isLowEndDevice =
      (navigator as unknown as { deviceMemory?: number }).deviceMemory !== undefined &&
      (navigator as unknown as { deviceMemory?: number }).deviceMemory < 4;

    if (prefersReducedMotion) {
      // Skip ScrollTrigger initialization entirely
      return;
    }

    // Configure ScrollTrigger defaults for performance
    ScrollTrigger.defaults({
      toggleActions: "play none none reverse",
      fastScrollEnd: true,
      preventOverlaps: true,
    });

    // Performance config
    ScrollTrigger.config({
      limitCallbacks: true,
      ignoreMobileResize: true,
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    });

    // Batch-refresh on resize (debounced) via GSAP's built-in mechanism
    // Reduce the default refresh interval for lower CPU usage
    if (isLowEndDevice) {
      ScrollTrigger.config({ autoRefreshEvents: "visibilitychange" });
    }

    // Refresh ScrollTrigger on visibility change (tab becomes visible)
    const handleVisibility = () => {
      if (!document.hidden) {
        ScrollTrigger.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      // Kill all ScrollTriggers on cleanup
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}

export { gsap, ScrollTrigger };
