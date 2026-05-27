"use client";

/**
 * Hero Section — Maximum Neon Aesthetic
 * --------------------------------------
 * Syntaxure Labs landing hero featuring:
 * - Multiple SVG neon angular border lines with GSAP draw-on
 * - "INNOVATE • BUILD • ELEVATE" tagline
 * - Floating "Startup Driven" badge (desktop)
 * - Service shortcut icons in neon-bordered strip
 * - Clip-path diagonal image with neon geometric frame
 */

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDown,
  Code,
  Smartphone,
  Globe,
  PenTool,
  Cloud,
  LineChart,
  Zap,
} from "lucide-react";
import { gsap } from "gsap";

/* ────────────────────────────────────────
   DATA
   ──────────────────────────────────────── */
const serviceShortcuts = [
  { icon: Code, label: "Software Dev" },
  { icon: Smartphone, label: "Mobile Apps" },
  { icon: Globe, label: "Web Dev" },
  { icon: PenTool, label: "UI/UX Design" },
  { icon: Cloud, label: "Cloud Solutions" },
  { icon: LineChart, label: "IT Consulting" },
];

/* ────────────────────────────────────────
   INLINE SVG COMPONENTS
   ──────────────────────────────────────── */

/** Multiple neon angular border lines framing the hero */
function NeonGeometryOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 h-full w-full hidden lg:block"
      preserveAspectRatio="none"
      viewBox="0 0 1440 900"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="neon-grad-primary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3060ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="neon-grad-cyan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="neon-grad-vertical" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="neon-glow-line">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neon-glow-heavy">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Top-Left Corner Bracket ── */}
      <g className="neon-line" filter="url(#neon-glow-line)">
        <line
          x1="30"
          y1="30"
          x2="160"
          y2="30"
          stroke="url(#neon-grad-primary)"
          strokeWidth="1.5"
        />
        <line
          x1="30"
          y1="30"
          x2="30"
          y2="140"
          stroke="url(#neon-grad-primary)"
          strokeWidth="1.5"
        />
      </g>

      {/* ── Top-Right Corner Bracket ── */}
      <g className="neon-line" filter="url(#neon-glow-line)">
        <line
          x1="1280"
          y1="30"
          x2="1410"
          y2="30"
          stroke="url(#neon-grad-primary)"
          strokeWidth="1.5"
        />
        <line
          x1="1410"
          y1="30"
          x2="1410"
          y2="140"
          stroke="url(#neon-grad-primary)"
          strokeWidth="1.5"
        />
      </g>

      {/* ── Bottom-Left Corner Tick ── */}
      <g className="neon-line" filter="url(#neon-glow-line)">
        <line
          x1="30"
          y1="760"
          x2="30"
          y2="870"
          stroke="url(#neon-grad-primary)"
          strokeWidth="1.5"
        />
        <line
          x1="30"
          y1="870"
          x2="120"
          y2="870"
          stroke="url(#neon-grad-primary)"
          strokeWidth="1.5"
        />
      </g>

      {/* ── The Main Diagonal Divider (Image Clip Tracer) ── */}
      <path
        className="neon-line-main"
        d="M 790 0 L 825 450 L 700 900"
        fill="none"
        stroke="url(#neon-grad-vertical)"
        strokeWidth="2"
        filter="url(#neon-glow-heavy)"
        pathLength="1"
      />

      {/* ── Secondary Diagonal (offset, thinner) ── */}
      <path
        className="neon-line-secondary"
        d="M 802 0 L 837 450 L 712 900"
        fill="none"
        stroke="url(#neon-grad-vertical)"
        strokeWidth="0.5"
        strokeOpacity="0.4"
        pathLength="1"
      />

      {/* ── Bottom Horizontal Accent ── */}
      <line
        className="neon-line"
        x1="0"
        y1="830"
        x2="1440"
        y2="830"
        stroke="url(#neon-grad-cyan)"
        strokeWidth="1"
        filter="url(#neon-glow-line)"
      />

      {/* ── Small Accent Tick Marks (decorative) ── */}
      <g className="neon-line" filter="url(#neon-glow-line)" opacity="0.5">
        {/* Left side tick */}
        <line
          x1="200"
          y1="800"
          x2="200"
          y2="830"
          stroke="#06b6d4"
          strokeWidth="1"
        />
        {/* Center-left tick */}
        <line
          x1="500"
          y1="815"
          x2="500"
          y2="830"
          stroke="#06b6d4"
          strokeWidth="1"
        />
        {/* Right side tick */}
        <line
          x1="1200"
          y1="800"
          x2="1200"
          y2="830"
          stroke="#8b5cf6"
          strokeWidth="1"
        />
      </g>

      {/* ── Image Frame Bracket (right side) ── */}
      <g className="neon-line" filter="url(#neon-glow-line)">
        {/* Top of frame */}
        <line
          x1="1050"
          y1="80"
          x2="1400"
          y2="80"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        <line
          x1="1400"
          y1="80"
          x2="1400"
          y2="200"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        {/* Bottom of frame */}
        <line
          x1="700"
          y1="780"
          x2="900"
          y2="780"
          stroke="#8b5cf6"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
        <line
          x1="700"
          y1="680"
          x2="700"
          y2="780"
          stroke="#8b5cf6"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
      </g>
    </svg>
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
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check reduced motion preference — skip animations if enabled
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Just set elements visible immediately, no animation
      gsap.set(
        [
          taglineRef.current,
          headlineRef.current,
          subtextRef.current,
          ctaRef.current,
          servicesRef.current?.children || [],
          badgeRef.current,
        ],
        { opacity: 1, y: 0, x: 0, scale: 1, clearProps: "all" },
      );
      const neonLines = heroRef.current?.querySelectorAll(
        ".neon-line line, .neon-line-main, .neon-line-secondary",
      );
      if (neonLines?.length) {
        gsap.set(neonLines, { opacity: 1, strokeDashoffset: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      /* ── Neon SVG Line Draw-On ── */
      const neonLines = heroRef.current?.querySelectorAll(
        ".neon-line line, .neon-line-main, .neon-line-secondary",
      );
      if (neonLines?.length) {
        gsap.set(neonLines, { strokeDasharray: 1, strokeDashoffset: 1 });
        tl.to(neonLines, {
          strokeDashoffset: 0,
          duration: 1.8,
          stagger: 0.08,
          ease: "power2.inOut",
        });
      }

      /* ── Tagline ── */
      tl.fromTo(
        taglineRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=1.2",
      );

      /* ── Headline ── */
      tl.fromTo(
        headlineRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8 },
        "-=0.8",
      );

      /* ── Subtext ── */
      tl.fromTo(
        subtextRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6 },
        "-=0.4",
      );

      /* ── CTAs ── */
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.3",
      );

      /* ── Service Shortcuts ── */
      tl.fromTo(
        servicesRef.current?.children || [],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
        "-=0.2",
      );

      /* ── Floating Badge ── */
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5 },
          "-=0.6",
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative z-10 drop-shadow-[0_15px_25px_rgba(6,182,212,0.15)] -mb-10">
      <section
        ref={heroRef}
        className="relative flex min-h-[90vh] items-center bg-void hero-section-bg clip-diagonal pb-32"
      >
        {/* ═══════════════════════════════════════
            NEON GEOMETRY OVERLAY (Desktop SVG)
            ═══════════════════════════════════════ */}
        <div className="hero-neon-overlay absolute inset-0 z-20 pointer-events-none hidden lg:block">
          <NeonGeometryOverlay />
        </div>

        {/* ═══════════════════════════════════════
            RIGHT SIDE: Image + Neon Frame (Desktop)
            ═══════════════════════════════════════ */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[50%] hidden lg:block z-0 overflow-hidden">
          {/* Clipped Image */}
          <div
            className="absolute inset-0 z-0 bg-[url('/hero-office.png')] bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%, 25% 55%)",
            }}
          >
            {/* Dark overlay to blend */}
            <div className="absolute inset-0 bg-void/30 mix-blend-multiply" />
            {/* Cyan tint overlay for neon feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
          </div>

          {/* Neon Edge Glow on Clip Path (follows the diagonal) */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none z-10 animate-neon-pulse"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="neon-edge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3060ff" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M15 0 L25 55 L0 100"
              fill="none"
              stroke="url(#neon-edge)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* ═══════════════════════════════════════
            BACKGROUND AMBIENT GLOWS + MOBILE IMAGE
            ═══════════════════════════════════════ */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Mobile Texture */}
          <div className="absolute inset-0 lg:hidden opacity-20 mix-blend-luminosity bg-[url('/hero-office.png')] bg-cover bg-center" />
          <div className="absolute inset-0 lg:hidden bg-void/80" />

          {/* Purple glow bottom-left */}
          <div className="absolute -bottom-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-purple-500/10 blur-[150px]" />
          {/* Cyan glow top-right */}
          <div className="absolute -top-[10%] left-[35%] h-[800px] w-[800px] rounded-full bg-cyan-500/10 blur-[150px]" />
          {/* Extra neon accent glow - center */}
          <div className="absolute top-[40%] left-[45%] h-[400px] w-[400px] rounded-full bg-blue-500/8 blur-[120px] hidden lg:block" />
        </div>

        {/* ═══════════════════════════════════════
            FLOATING BADGE — "Startup Driven" (Desktop)
            ═══════════════════════════════════════ */}
        <div
          ref={badgeRef}
          className="hero-floating-badge absolute top-24 right-12 z-30 hidden lg:flex items-center gap-3 rounded-md border border-cyan-500/30 bg-void/60 px-5 py-3 backdrop-blur-xl shadow-glow-cyan animate-float-subtle opacity-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <Zap className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
              A Startup Driven by
            </p>
            <p className="text-xs font-semibold text-white">
              Technology & Innovation
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            LEFT CONTENT COLUMN
            ═══════════════════════════════════════ */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex items-center mt-12 lg:mt-0">
          <div className="w-full lg:w-[55%] lg:pr-12 py-24 lg:py-32">
            {/* ── Motto Tagline ── */}
            <div ref={taglineRef} className="mb-6 opacity-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-400/80">
                Innovate &bull; Build &bull; Elevate
              </p>
            </div>

            {/* ── Status Badge ── */}
            {availabilityText && (
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-xs text-white/70">
                  {availabilityText}
                </span>
              </div>
            )}

            {/* ── Headline ── */}
            <h1
              ref={headlineRef}
              className="text-4xl font-bold leading-[1.1] tracking-tight text-white opacity-0 sm:text-5xl md:text-6xl lg:text-7xl text-left"
            >
              Innovating Digital Solutions <br className="hidden sm:block" />
              for a{" "}
              <span className="text-gradient-holographic">
                Smarter Tomorrow
              </span>
            </h1>

            {/* ── Subtext ── */}
            <p
              ref={subtextRef}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60 opacity-0 md:text-xl text-left"
            >
              We transform ideas into powerful digital experiences. Building
              modern solutions that help businesses
              <span className="text-cyan-400"> grow</span>,
              <span className="text-purple-400"> scale</span>, and
              <span className="text-emerald-400"> succeed</span>.
            </p>

            {/* ── CTAs ── */}
            <div
              ref={ctaRef}
              className="mt-10 flex flex-col items-start sm:flex-row gap-4 opacity-0"
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

            {/* ═══════════════════════════════════════
                SERVICE SHORTCUTS — Neon-Bordered Strip
                ═══════════════════════════════════════ */}
            <div className="mt-16">
              <p className="mb-4 text-xs font-mono text-cyan-400 tracking-wider uppercase text-center sm:text-left">
                Our Services
              </p>
              <div className="relative rounded-md border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
                {/* Top neon accent line on the services strip */}
                <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

                <div
                  ref={servicesRef}
                  className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:justify-between"
                >
                  {serviceShortcuts.map((service, idx) => {
                    const Icon = service.icon;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2 group cursor-default opacity-0"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-neon-cyan group-hover:bg-cyan-500/10 group-hover:shadow-glow-cyan">
                          <Icon
                            className="h-5 w-5 text-white/70 group-hover:text-cyan-400 transition-colors duration-300"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] uppercase font-mono text-white/50 group-hover:text-white/80 transition-colors duration-300 max-w-[80px] text-center leading-tight">
                          {service.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom neon accent line */}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
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
