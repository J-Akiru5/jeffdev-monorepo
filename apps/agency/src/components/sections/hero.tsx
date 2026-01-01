'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { gsap } from 'gsap';

/**
 * Hero Section
 * ------------
 * Full viewport hero with:
 * - Animated headline reveal (GSAP)
 * - B2B positioning statement
 * - Dual CTAs (Ghost Glow style)
 * - Trust badges / social proof
 * - Scroll indicator
 */

const trustBadges = [
  { label: 'Next.js', sublabel: 'Specialized' },
  { label: 'Firebase', sublabel: 'Expert' },
  { label: 'Est.', sublabel: '2025' },
  { label: '99.9%', sublabel: 'Uptime SLA' },
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for staggered reveal
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8 }
      )
        .fromTo(
          subtextRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(
          badgesRef.current?.children || [],
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
          '-=0.2'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20"
    >
      {/* Background Accents */}
      <div className="pointer-events-none absolute inset-0">
        {/* Large gradient orb */}
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Status Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-xs text-white/70">
            Available for Q1 2026 Projects
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-4xl font-bold leading-[1.1] tracking-tight text-white opacity-0 sm:text-5xl md:text-6xl lg:text-7xl"
        >
          We Build{' '}
          <span className="text-gradient-holographic">High-Performance</span>
          <br />
          Web Systems That Scale
        </h1>

        {/* Subtext */}
        <p
          ref={subtextRef}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 opacity-0 md:text-xl"
        >
          Enterprise-grade architecture for startups and scaling businesses.
          Next.js, cloud infrastructure, and AI-powered solutions — engineered
          for growth.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="mt-10 flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row"
        >
          {/* Primary CTA */}
          <Link
            href="/quote"
            className="group relative overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-8 py-3.5 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
          >
            <span className="relative z-10 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white">
              Start_Project
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/work"
            className="group flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-8 py-3.5 backdrop-blur-md transition-all hover:border-white/20"
          >
            <span className="font-mono text-sm uppercase tracking-wider text-white/70 transition-colors group-hover:text-white">
              View_Work
            </span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div
          ref={badgesRef}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-white/[0.06] pt-10"
        >
          {trustBadges.map((badge) => (
            <div key={badge.label} className="text-center opacity-0">
              <div className="font-mono text-lg font-semibold text-white/90">
                {badge.label}
              </div>
              <div className="mt-0.5 text-xs text-white/40">{badge.sublabel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 transition-colors hover:text-white/60"
        aria-label="Scroll to content"
      >
        <ArrowDown className="h-6 w-6 animate-bounce" />
      </button>
    </section>
  );
}

export default Hero;
