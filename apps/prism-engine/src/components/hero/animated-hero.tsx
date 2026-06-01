"use client";

/**
 * Animated Hero Section - Scrub-Based Scroll Reveal
 * --------------------------------------------------
 * Initial view: Large Prism + Version Badge centered in available space
 * As user scrolls: Prism shrinks, margins expand, elements reveal in sequence
 * All animations are scrub-based (sync with scroll position)
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Prism3D } from "./prism-3d";
import { ScanSearch, BrainCircuit, Network, Zap, ChevronDown, ArrowRight } from "lucide-react";
import { useAuth } from "@syntaxure/ui";

// Register GSAP plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AnimatedHero() {
  const { user } = useAuth();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prismContainerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Show all content immediately
      gsap.set(
        [
          headlineRef.current,
          subheadlineRef.current,
          taglineRef.current,
          ctaRef.current,
          pillsRef.current,
          pillsRef.current?.children || [],
        ],
        { opacity: 1, y: 0, height: "auto", scale: 1, clearProps: "all" },
      );
      gsap.set(badgeRef.current, { marginTop: 32, marginBottom: 32 });
      gsap.set(prismContainerRef.current, { scale: 0.5 });
      gsap.set(scrollIndicatorRef.current, { display: "none" });
      return;
    }

    const ctx = gsap.context(() => {
      // Initial state - hidden elements start with 0 height to not affect centering
      gsap.set(
        [
          headlineRef.current,
          subheadlineRef.current,
          taglineRef.current,
          ctaRef.current,
        ],
        {
          opacity: 0,
          y: 40,
          height: 0,
          marginBottom: 0,
          overflow: "hidden",
        },
      );
      gsap.set(pillsRef.current, {
        opacity: 0,
        height: 0,
        overflow: "hidden",
      });
      gsap.set(pillsRef.current?.children || [], {
        opacity: 0,
        y: 20,
        scale: 0.8,
      });
      // Badge starts below prism with top margin for spacing
      gsap.set(badgeRef.current, {
        marginTop: 112,
        marginBottom: 0,
      });

      // Create main scroll timeline
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=200%",
          scrub: 1,
          pin: heroRef.current,
        },
      });

      // Phase 1: Prism shrinks and moves up (0% - 15%)
      scrollTl
        .to(
          scrollIndicatorRef.current,
          {
            opacity: 0,
            duration: 0.05,
          },
          0,
        )
        .to(
          prismContainerRef.current,
          {
            scale: 0.5,
            marginBottom: 16,
            duration: 0.15,
          },
          0,
        )
        .to(
          badgeRef.current,
          {
            scale: 0.8,
            marginTop: 24,
            marginBottom: 16,
            duration: 0.15,
          },
          0,
        );

      // Phase 2: Headline reveals with height animation (15% - 30%)
      scrollTl.to(
        headlineRef.current,
        {
          opacity: 1,
          y: 0,
          height: "auto",
          marginBottom: 16,
          duration: 0.15,
        },
        0.15,
      );

      // Phase 3: Subheadline reveals (30% - 40%)
      scrollTl.to(
        subheadlineRef.current,
        {
          opacity: 1,
          y: 0,
          height: "auto",
          marginBottom: 8,
          duration: 0.1,
        },
        0.3,
      );

      // Phase 4: Tagline reveals (40% - 50%)
      scrollTl.to(
        taglineRef.current,
        {
          opacity: 1,
          y: 0,
          height: "auto",
          marginBottom: 24,
          duration: 0.1,
        },
        0.4,
      );

      // Phase 5: CTA buttons reveal (50% - 65%)
      scrollTl.to(
        ctaRef.current,
        {
          opacity: 1,
          y: 0,
          height: "auto",
          marginBottom: 32,
          duration: 0.15,
        },
        0.5,
      );

      // Phase 6: Pills container reveals (50% - 60%)
      scrollTl.to(
        pillsRef.current,
        {
          opacity: 1,
          height: "auto",
          duration: 0.1,
        },
        0.5,
      );

      // Phase 7: Feature pills stagger reveal (50% - 75%)
      scrollTl.to(
        pillsRef.current?.children || [],
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.05,
          duration: 0.25,
        },
        0.5,
      );

      // Phase 8: Scroll Lock (Hold fully revealed state)
      // This creates a "dead zone" where the user scrolls but nothing animates, locking the view.
      scrollTl.to({}, { duration: 0.5 });

      // Parallax effect on orb
      gsap.to(orbRef.current, {
        y: 150,
        scale: 1.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=200%",
          scrub: 2,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Scroll container - height for animation */}
      <div className="h-[300vh]">
        <div
          ref={heroRef}
          className="h-screen flex items-center justify-center px-4"
          style={{ paddingTop: "64px" }} // Nav height offset
        >
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          {/* Gradient Orb - Parallax, centered */}
          <div
            ref={orbRef}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-full blur-3xl -z-10 pointer-events-none"
          />

          <div
            ref={contentRef}
            className="text-center max-w-4xl relative z-10 flex flex-col items-center"
          >
            {/* Animated Prism Logo - Starts Large & Centered */}
            <div ref={prismContainerRef} className="h-[120px] flex items-center justify-center mt-8">
              <div className="relative pointer-events-none -translate-y-10">
                <Prism3D className="mx-auto scale-110" />
              </div>
            </div>

            {/* Version Badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0 translate-y-[3px]" />
              <span className="font-mono text-sm font-medium tracking-widest text-[var(--text-primary)]">
                PRISM CONTEXT ENGINE V1.0.3
              </span>
            </div>

            {/* Headline - Hidden Initially (height: 0) */}
            <h1
              ref={headlineRef}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                The Context Operating System
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent pb-2 inline-block">
                for Agentic Teams
              </span>
            </h1>

            {/* Subheadline - Hidden Initially */}
            <p
              ref={subheadlineRef}
              className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              Scan your architecture via Playwright. AI learns your rules. Deploy context
              directly to Cursor, Windsurf, and Claude via MCP.
            </p>

            {/* Tagline - Hidden Initially */}
            <p
              ref={taglineRef}
              className="text-cyan-400/80 text-base md:text-lg font-mono"
            >
              Eliminate context pollution. Forever.
            </p>

            {/* CTA Buttons - Hidden Initially */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-8 relative z-20">
              <Link
                href={user ? "/dashboard" : "/sign-up"}
                className="group relative overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-8 py-4 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/20 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-purple-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-primary)] font-semibold flex items-center gap-2">
                  {user ? "Dashboard" : "Start Free"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-8 py-4 transition-all hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-active)] active:scale-95"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-primary)]">
                  View Pricing
                </span>
              </Link>
              <Link
                href="https://docs.syntaxure.dev"
                target="_blank"
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-8 py-4 transition-all hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-active)] active:scale-95"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-[var(--text-primary)]">
                  View Docs
                </span>
              </Link>
            </div>

            {/* Feature Pills - Hidden Initially */}
            <div ref={pillsRef} className="flex flex-wrap gap-3 justify-center">
              <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 border border-cyan-500/15 shadow-sm shadow-cyan-500/5 hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all cursor-default">
                <ScanSearch className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  Playwright Scan
                </span>
              </div>
              <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 border border-cyan-500/15 shadow-sm shadow-cyan-500/5 hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all cursor-default">
                <BrainCircuit className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  AI Rule Extraction
                </span>
              </div>
              <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 border border-cyan-500/15 shadow-sm shadow-cyan-500/5 hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all cursor-default">
                <Network className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  MCP Protocol
                </span>
              </div>
              <div className="glass px-4 py-2 rounded-full inline-flex items-center gap-2 border border-cyan-500/15 shadow-sm shadow-cyan-500/5 hover:border-cyan-500/30 hover:shadow-cyan-500/10 transition-all cursor-default">
                <Zap className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  Real-time Sync
                </span>
              </div>
            </div>
          </div>

          {/* Scroll down indicator */}
          <div 
            ref={scrollIndicatorRef}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">
              Scroll to Discover
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
