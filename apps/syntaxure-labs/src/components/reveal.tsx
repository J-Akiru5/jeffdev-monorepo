"use client";

import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/use-in-view";

interface RevealProps {
  children: ReactNode;
  /** Layout classes for the wrapper (grid, spacing, text-center, ...). */
  className?: string;
  /** IntersectionObserver threshold. */
  threshold?: number;
  /** Transition timing utilities, e.g. "duration-1000 ease-out delay-200". */
  transitionClassName?: string;
  /** Inline styles, e.g. transitionDelay for staggered reveals. */
  style?: CSSProperties;
}

/**
 * Reveal
 * ------
 * Tiny client boundary for scroll-reveal fade-ins. Server Components wrap
 * their static markup in <Reveal> so only this wrapper hydrates — the
 * children ship as RSC payload with zero per-component hydration cost.
 */
export function Reveal({
  children,
  className,
  threshold = 0.1,
  transitionClassName = "duration-700 ease-out",
  style,
}: RevealProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold });

  return (
    <div
      ref={ref}
      style={style}
      className={`${className ?? ""} transition-all ${transitionClassName} ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default Reveal;
