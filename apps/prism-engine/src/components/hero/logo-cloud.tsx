"use client";

/**
 * LogoCloud — sticky trust strip just under the nav.
 * Hides on mobile (< 768px) and fades out once user scrolls past 100vh.
 */

import { useEffect, useRef, useState } from "react";

const LOGOS = [
  "Acme",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark",
] as const;

export function LogoCloud() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVisible(window.innerWidth >= 768);
    const onResize = () => setVisible(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mounted || !visible) return;
    const onScroll = () => {
      setVisibleState(window.scrollY < window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted, visible]);

  const [visibleState, setVisibleState] = useState(true);

  if (!mounted || !visible) return null;

  return (
    <div
      ref={ref}
      className="sticky top-16 z-30 w-full border-b border-[var(--border-subtle)] backdrop-blur-md transition-opacity duration-500"
      style={{
        background: "color-mix(in oklab, var(--color-glass) 70%, transparent)",
        opacity: visibleState ? 1 : 0,
        pointerEvents: visibleState ? "auto" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center gap-8">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-mono whitespace-nowrap hidden sm:inline">
          Trusted by developers shipping with
        </span>
        <div className="flex items-center gap-6 sm:gap-8 overflow-hidden">
          {LOGOS.map((name) => (
            <span
              key={name}
              className="font-mono text-sm font-semibold tracking-wider text-[var(--text-tertiary)] opacity-60 hover:opacity-100 transition-opacity"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LogoCloud;
