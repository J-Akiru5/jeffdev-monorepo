"use client";

/**
 * Hero Section — Enterprise Typographic Layout
 * ---------------------------------------------
 * Syntaxure Labs landing hero featuring:
 * - Centered typographic layout (Linear/Vercel style)
 * - Clip-diagonal bottom edge with neon accents
 * - Floating geometric shapes with drift animations
 * - Dot-grid background with radial fade
 * - Ambient neon glow orbs (cyan/purple)
 * - Availability status badge
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { useInView } from "@/lib/use-in-view";

/* ────────────────────────────────────────
   FLOATING GEOMETRY — Thin neon-outlined shapes
   ──────────────────────────────────────── */
function FloatingGeometry() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {/* ── Triangle (top-left) ── */}
      <svg
        className="absolute top-[12%] left-[8%] h-24 w-24 opacity-20 animate-drift-1 hidden lg:block"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon
          points="50,5 95,90 5,90"
          stroke="url(#geo-grad-1)"
          strokeWidth="1"
          fill="none"
        />
        <defs>
          <linearGradient id="geo-grad-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Hexagon (top-right) ── */}
      <svg
        className="absolute top-[18%] right-[10%] h-20 w-20 opacity-15 animate-drift-2 hidden lg:block"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon
          points="50,3 93,25 93,75 50,97 7,75 7,25"
          stroke="#06b6d4"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>

      {/* ── Diamond (bottom-left) ── */}
      <svg
        className="absolute bottom-[25%] left-[15%] h-16 w-16 opacity-15 animate-drift-3 hidden lg:block"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon
          points="50,5 95,50 50,95 5,50"
          stroke="#8b5cf6"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>

      {/* ── Circle (mid-right) ── */}
      <svg
        className="absolute top-[45%] right-[6%] h-14 w-14 opacity-10 animate-drift-1 hidden xl:block"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#geo-grad-2)"
          strokeWidth="0.8"
          fill="none"
        />
        <defs>
          <linearGradient id="geo-grad-2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Small Triangle (bottom-right) ── */}
      <svg
        className="absolute bottom-[30%] right-[18%] h-12 w-12 opacity-10 animate-drift-2 hidden lg:block"
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon
          points="50,10 90,85 10,85"
          stroke="#06b6d4"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────
   HERO COMPONENT
   ──────────────────────────────────────── */
export function Hero({
  availabilityText,
}: {
  availabilityText?: string | null;
}) {
  const { ref: badgeRef, isInView: badgeInView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: headlineRef, isInView: headlineInView } = useInView<HTMLHeadingElement>({ threshold: 0.1 });
  const { ref: subtextRef, isInView: subtextInView } = useInView<HTMLParagraphElement>({ threshold: 0.1 });
  const { ref: ctaRef, isInView: ctaInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative z-10 drop-shadow-[0_15px_25px_rgba(6,182,212,0.15)] -mb-10">
      <section
        className="relative flex min-h-[90vh] items-center justify-center bg-void hero-section-bg clip-diagonal pb-32"
      >
        {/* ═══════════════════════════════════════
            BACKGROUND LAYERS
            ═══════════════════════════════════════ */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Dot-grid pattern with radial fade */}
          <div className="absolute inset-0 hero-dot-grid hero-radial-fade" />

          {/* Purple glow — bottom-left */}
          <div className="absolute -bottom-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-purple-500/10 blur-[150px]" />

          {/* Cyan glow — top-right */}
          <div className="absolute -top-[10%] right-[10%] h-[800px] w-[800px] rounded-full bg-cyan-500/10 blur-[150px]" />

          {/* Blue accent — center (desktop only) */}
          <div className="absolute top-[35%] left-[50%] -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] hidden lg:block" />
        </div>

        {/* ═══════════════════════════════════════
            FLOATING GEOMETRY (Desktop)
            ═══════════════════════════════════════ */}
        <FloatingGeometry />

        {/* ═══════════════════════════════════════
            NEON CORNER BRACKETS (Desktop)
            ═══════════════════════════════════════ */}
        <svg
          className="pointer-events-none absolute inset-0 z-20 h-full w-full hidden lg:block"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hero-neon-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3060ff" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="hero-glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Top-Left Corner */}
          <g filter="url(#hero-glow)" opacity="0.6">
            <line x1="30" y1="30" x2="160" y2="30" stroke="url(#hero-neon-grad)" strokeWidth="1.5" />
            <line x1="30" y1="30" x2="30" y2="140" stroke="url(#hero-neon-grad)" strokeWidth="1.5" />
          </g>

          {/* Top-Right Corner */}
          <g filter="url(#hero-glow)" opacity="0.6">
            <line x1="1280" y1="30" x2="1410" y2="30" stroke="url(#hero-neon-grad)" strokeWidth="1.5" />
            <line x1="1410" y1="30" x2="1410" y2="140" stroke="url(#hero-neon-grad)" strokeWidth="1.5" />
          </g>

          {/* Bottom-Left Corner */}
          <g filter="url(#hero-glow)" opacity="0.4">
            <line x1="30" y1="760" x2="30" y2="850" stroke="url(#hero-neon-grad)" strokeWidth="1.5" />
            <line x1="30" y1="850" x2="120" y2="850" stroke="url(#hero-neon-grad)" strokeWidth="1.5" />
          </g>
        </svg>

        {/* ═══════════════════════════════════════
            CONTENT LAYOUT (2 Columns on Desktop)
            ═══════════════════════════════════════ */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* ── Left Column: Copy & CTAs ── */}
          <div className="flex-1 text-center lg:text-left">
            {/* ── Studio Badge ── */}
            <div
              ref={badgeRef}
              className={`mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 backdrop-blur-sm transition-all duration-700 ${
                badgeInView ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              <span className="text-cyan-400 text-xs">✦</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                A Startup Driven by Technology &amp; Innovation
              </span>
            </div>

            {/* ── Availability Badge ── */}
            {availabilityText && (
              <div className="mb-8 flex justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-xs text-white/70">
                    {availabilityText}
                  </span>
                </div>
              </div>
            )}

            {/* ── Headline ── */}
            <h1
              ref={headlineRef}
              className={`text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl transition-all duration-700 delay-100 ${
                headlineInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Innovating Digital Solutions<br />
              for a Smarter Tomorrow,<br />
              <span className="text-gradient-holographic">Engineering with Precision:</span><br />
              Governance over Generation.
            </h1>

            {/* ── Neon Divider ── */}
            <div className="mx-auto lg:mx-0 mt-8 mb-6 w-24 h-px animate-border-beam" />

            {/* ── Subtext ── */}
            <p
              ref={subtextRef}
              className={`mx-auto lg:mx-0 max-w-2xl text-lg leading-relaxed text-white/50 md:text-xl transition-all duration-700 delay-200 ${
                subtextInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              From zero to production. We transform complex ideas into powerful,
              reliable software ecosystems built for scale and absolute control.
            </p>

            {/* ── CTAs ── */}
            <div
              ref={ctaRef}
              className={`mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 transition-all duration-700 delay-300 ${
                ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Primary CTA — Neon Glow */}
              <Link
                href="/quote"
                className="group relative overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-8 py-3.5 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
              >
                {/* Animated gradient sweep on hover */}
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/15 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative z-10 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white">
                  START_PROJECT
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/work"
                className="group flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-8 py-3.5 backdrop-blur-md transition-all hover:border-white/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-white/70 transition-colors group-hover:text-white">
                  VIEW_WORK
                </span>
              </Link>
            </div>
          </div>

          {/* ── Right Column: Logo (Text Mosaic) ── */}
          <div className="flex-1 flex justify-center lg:justify-end mt-12 lg:mt-0 relative z-10 w-full max-w-[400px] lg:max-w-[500px]">
             <div className="relative w-full aspect-square opacity-90 mix-blend-screen drop-shadow-[0_0_40px_rgba(139,92,246,0.2)] overflow-hidden flex items-center justify-center">
                <div 
                  className="absolute inset-0 w-full h-full font-mono text-[8px] sm:text-[10px] leading-[1] font-bold tracking-tighter text-justify break-all select-none"
                  style={{
                    backgroundImage: "url('/favicon/favicon.svg')",
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  {"SYNTAXURE LABS ENGINEERING WITH PRECISION GOVERNANCE OVER GENERATION INNOVATING DIGITAL SOLUTIONS FOR A SMARTER TOMORROW ".repeat(150)}
                </div>
             </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            BOTTOM NEON ACCENT STRIP
            ═══════════════════════════════════════ */}
        <div className="absolute bottom-[12%] left-0 right-0 h-px z-20 hidden lg:block">
          <div className="h-full w-full animate-border-beam" />
        </div>

        {/* ═══════════════════════════════════════
            SCROLL INDICATOR
            ═══════════════════════════════════════ */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 lg:bottom-8 lg:left-12 lg:-translate-x-0 text-white/30 transition-colors hover:text-white/60 z-20"
          aria-label="Scroll to content"
        >
          <ArrowDown className="h-6 w-6 animate-bounce" />
        </button>
      </section>
    </div>
  );
}

export default Hero;
