'use client';

/**
 * Animated Hero Section - Scrub-Based Scroll Reveal
 * --------------------------------------------------
 * Initial view: Large Prism + Version Badge centered in available space
 * As user scrolls: Prism shrinks, margins expand, elements reveal in sequence
 * All animations are scrub-based (sync with scroll position)
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PrismLogo3D } from '@/components/prism';

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function AnimatedHero() {
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state - hidden elements start with 0 height to not affect centering
      gsap.set([headlineRef.current, subheadlineRef.current, taglineRef.current, ctaRef.current], {
        opacity: 0,
        y: 40,
        height: 0,
        marginBottom: 0,
        overflow: 'hidden',
      });
      gsap.set(pillsRef.current, {
        opacity: 0,
        height: 0,
        overflow: 'hidden',
      });
      gsap.set(pillsRef.current?.children || [], {
        opacity: 0,
        y: 20,
        scale: 0.8,
      });
      // Badge starts below prism with top margin for spacing
      gsap.set(badgeRef.current, {
        marginTop: 32,
        marginBottom: 0,
      });

      // Create main scroll timeline
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=150%',
          scrub: 1,
          pin: heroRef.current,
        },
      });

      // Phase 1: Prism shrinks and moves up (0% - 15%)
      scrollTl
        .to(prismContainerRef.current, {
          scale: 0.5,
          marginBottom: 16,
          duration: 0.15,
        }, 0)
        .to(badgeRef.current, {
          scale: 0.8,
          marginTop: 16,
          marginBottom: 32,
          duration: 0.15,
        }, 0);

      // Phase 2: Headline reveals with height animation (15% - 30%)
      scrollTl.to(headlineRef.current, {
        opacity: 1,
        y: 0,
        height: 'auto',
        marginBottom: 24,
        duration: 0.15,
      }, 0.15);

      // Phase 3: Subheadline reveals (30% - 40%)
      scrollTl.to(subheadlineRef.current, {
        opacity: 1,
        y: 0,
        height: 'auto',
        marginBottom: 16,
        duration: 0.1,
      }, 0.30);

      // Phase 4: Tagline reveals (40% - 50%)
      scrollTl.to(taglineRef.current, {
        opacity: 1,
        y: 0,
        height: 'auto',
        marginBottom: 40,
        duration: 0.1,
      }, 0.40);

      // Phase 5: CTA buttons reveal (50% - 65%)
      scrollTl.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        height: 'auto',
        marginBottom: 48,
        duration: 0.15,
      }, 0.50);

      // Phase 6: Pills container reveals (65% - 75%)
      scrollTl.to(pillsRef.current, {
        opacity: 1,
        height: 'auto',
        duration: 0.1,
      }, 0.65);

      // Phase 7: Feature pills stagger reveal (75% - 100%)
      scrollTl.to(pillsRef.current?.children || [], {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.02,
        duration: 0.25,
      }, 0.75);

      // Parallax effect on orb
      gsap.to(orbRef.current, {
        y: 150,
        scale: 1.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=150%',
          scrub: 2,
        },
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Scroll container - height for animation */}
      <div className="h-[250vh]">
        <div 
          ref={heroRef} 
          className="h-screen flex items-center justify-center px-4"
          style={{ paddingTop: '64px' }} // Nav height offset
        >
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          {/* Gradient Orb - Parallax, centered */}
          <div 
            ref={orbRef}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-full blur-3xl -z-10 pointer-events-none" 
          />

          <div ref={contentRef} className="text-center max-w-4xl relative z-10 flex flex-col items-center">
            {/* Animated Prism Logo - Starts Large & Centered */}
            <div ref={prismContainerRef}>
              <PrismLogo3D size="lg" className="mx-auto scale-150" />
            </div>

            {/* Version Badge */}
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm"
            >
              <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
              <span className="font-mono text-lg text-cyan-400 uppercase tracking-widest font-semibold">
                Prism Context Engine v1.0.3
              </span>
            </div>

            {/* Headline - Hidden Initially (height: 0) */}
            <h1 
              ref={headlineRef}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                The Context Operating System
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                for Vibecoders
              </span>
            </h1>

            {/* Subheadline - Hidden Initially */}
            <p 
              ref={subheadlineRef}
              className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              Record your architecture. AI learns your rules. Deploy context directly to Cursor, Windsurf, and Claude via MCP.
            </p>
            
            {/* Tagline - Hidden Initially */}
            <p 
              ref={taglineRef}
              className="text-cyan-400/80 text-base md:text-lg font-mono"
            >
              Eliminate context pollution. Forever.
            </p>

            {/* CTA Buttons - Hidden Initially */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="group relative overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-8 py-4 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-white font-semibold">
                  Start Free →
                </span>
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-white/10 bg-white/5 px-8 py-4 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-white/80">
                  View Pricing
                </span>
              </Link>
              <Link
                href="https://docs.jeffdev.studio"
                target="_blank"
                className="rounded-md border border-white/10 bg-white/5 px-8 py-4 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-white/80">
                  View Docs
                </span>
              </Link>
            </div>

            {/* Feature Pills - Hidden Initially */}
            <div ref={pillsRef} className="flex flex-wrap gap-3 justify-center">
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-xs text-white/60 font-mono">📹 Video → Context</span>
              </div>
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-xs text-white/60 font-mono">🤖 AI Rule Extraction</span>
              </div>
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-xs text-white/60 font-mono">🔌 MCP Protocol</span>
              </div>
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-xs text-white/60 font-mono">⚡ Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
