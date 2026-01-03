'use client';

/**
 * GSAP ScrollTrigger Provider
 * ---------------------------
 * Registers GSAP plugins and provides scroll animation utilities.
 * Uses React 19 useLayoutEffect for synchronous setup.
 */

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins once
if (typeof window !== 'undefined') {
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

    // Configure ScrollTrigger defaults
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse',
    });

    // Refresh ScrollTrigger on resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Kill all ScrollTriggers on cleanup
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}

export { gsap, ScrollTrigger };
