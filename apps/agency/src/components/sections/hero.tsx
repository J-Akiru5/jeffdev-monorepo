'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDown, Code, Smartphone, Globe, PenTool, Cloud, LineChart } from 'lucide-react';
import { gsap } from 'gsap';
import Image from 'next/image';

const serviceShortcuts = [
  { icon: Code, label: 'Software Dev' },
  { icon: Smartphone, label: 'Mobile Apps' },
  { icon: Globe, label: 'Web Dev' },
  { icon: PenTool, label: 'UI/UX Design' },
  { icon: Cloud, label: 'Cloud Solutions' },
  { icon: LineChart, label: 'IT Consulting' },
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        headlineRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8 }
      )
        .fromTo(
          subtextRef.current,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(
          servicesRef.current?.children || [],
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
    <div className="relative z-10 drop-shadow-[0_15px_25px_rgba(6,182,212,0.15)] -mb-10">
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center bg-void clip-diagonal pb-32"
      >
      {/* Right Side: Image and Neon Bend (Desktop Only) */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[50%] hidden lg:block z-0 overflow-hidden">
        {/* The Clipped Image */}
        <div 
          className="absolute inset-0 z-0 bg-[url('/hero-office.png')] bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%, 25% 55%)' }}
        >
          {/* Subtle overlay to blend with dark mode */}
          <div className="absolute inset-0 bg-void/30 mix-blend-multiply" />
        </div>
        
        {/* The Neon Bend SVG Divider */}
        <svg 
          className="absolute inset-0 h-full w-full pointer-events-none z-10" 
          preserveAspectRatio="none" 
          viewBox="0 0 100 100"
          style={{ filter: 'drop-shadow(0 0 25px rgba(6,182,212,0.8))' }}
        >
          <defs>
            <linearGradient id="neon-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <path 
            d="M15 0 L25 55 L0 100" 
            fill="none" 
            stroke="url(#neon-line)" 
            strokeWidth="0.8" 
            vectorEffect="non-scaling-stroke" 
          />
        </svg>
      </div>

      {/* Background Accents (Mobile/General) */}
      <div className="pointer-events-none absolute inset-0 lg:hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Left Content Column */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex items-center">
        <div className="w-full lg:w-[55%] lg:pr-12 py-32">
          
          {/* Status Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-xs text-white/70">
              Available for Q3 2026 Projects
            </span>
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl font-bold leading-[1.1] tracking-tight text-white opacity-0 sm:text-5xl md:text-6xl lg:text-7xl text-left"
          >
            Innovating Digital Solutions <br className="hidden sm:block" />
            for a <span className="text-gradient-holographic">Smarter Tomorrow</span>
          </h1>

          {/* Subtext */}
          <p
            ref={subtextRef}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60 opacity-0 md:text-xl text-left"
          >
            We transform ideas into powerful digital experiences.
            Building modern solutions that help businesses
            <span className="text-cyan-400"> grow</span>,
            <span className="text-purple-400"> scale</span>, and
            <span className="text-emerald-400"> succeed</span>.
          </p>

          {/* CTAs */}
          <div
            ref={ctaRef}
            className="mt-10 flex flex-col items-start sm:flex-row gap-4 opacity-0"
          >
            {/* Primary CTA */}
            <Link
              href="/quote"
              className="group relative overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-8 py-3.5 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
            >
              <span className="relative z-10 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-white">
                START_PROJECT
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/work"
              className="group flex items-center gap-2 rounded-md border border-white/10 bg-black/50 px-8 py-3.5 backdrop-blur-md transition-all hover:border-white/20"
            >
              <span className="font-mono text-sm uppercase tracking-wider text-white/70 transition-colors group-hover:text-white">
                VIEW_WORK
              </span>
            </Link>
          </div>

          {/* Service Shortcuts */}
          <div className="mt-16 opacity-0" ref={servicesRef}>
            <p className="mb-4 text-xs font-mono text-cyan-400 tracking-wider uppercase">
              Our Services
            </p>
            <div className="flex flex-wrap gap-4">
              {serviceShortcuts.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group cursor-default">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-all group-hover:border-cyan-500/30 group-hover:bg-white/10 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <Icon className="h-5 w-5 text-white/70 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <span className="text-[10px] uppercase font-mono text-white/50 group-hover:text-white/80 transition-colors max-w-[80px] text-center leading-tight">
                      {service.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-12 text-white/30 transition-colors hover:text-white/60 z-20"
        aria-label="Scroll to content"
      >
        <ArrowDown className="h-6 w-6 animate-bounce" />
      </button>
      </section>
    </div>
  );
}

export default Hero;
