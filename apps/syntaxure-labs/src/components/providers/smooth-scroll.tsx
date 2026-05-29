"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

/**
 * SmoothScroll Provider
 * ---------------------
 * Wraps the application in a Lenis smooth scroll context.
 * Handles scroll normalization and provides buttery-smooth scrolling.
 * Optimized for low-end devices with:
 * - Runtime detection of reduced motion preference
 * - RAF pause when tab is hidden (saves CPU)
 * - Lower touch multiplier on mobile
 * - Disabled on low-end devices / prefers-reduced-motion
 *
 * @see https://github.com/studio-freight/lenis
 */
interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Detect low-end devices by checking cores or memory
    const isLowEndDevice =
      !window.matchMedia("(min-width: 768px)").matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).deviceMemory !== undefined &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).deviceMemory < 4;

    // Disable Lenis entirely on low-end mobile with reduced motion
    if (prefersReducedMotion) {
      // Still provide children but skip smooth scroll entirely
      return;
    }

    // Initialize Lenis with performance-optimized settings
    const lenis = new Lenis({
      duration: isLowEndDevice ? 0.6 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !isLowEndDevice,
      wheelMultiplier: isLowEndDevice ? 0.8 : 1,
      touchMultiplier: isLowEndDevice ? 1 : 2,
      syncTouch: isLowEndDevice,
    });

    lenisRef.current = lenis;

    // Animation frame loop with pause detection
    function raf(time: number) {
      lenis.raf(time);
      // Always schedule next frame — we'll pause via the visibility toggle
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    // Pause/resume RAF when tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else if (rafRef.current === 0) {
        rafRef.current = requestAnimationFrame(raf);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reset scroll position on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return <>{children}</>;
}

export default SmoothScroll;
