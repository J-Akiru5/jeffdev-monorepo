"use client";

import Link from "next/link";
import { ArrowUpRight, Zap, ArrowDown, ShieldCheck } from "lucide-react";
import { useInView } from "@/lib/use-in-view";

export function Hero({
  availabilityText,
  cmsHero,
}: {
  availabilityText?: string | null;
  cmsHero?: {
    tagline?: string;
    heading1?: string;
    heading2?: string;
    description?: string;
  };
}) {
  const { ref: containerRef, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative z-10">
      <section className="relative flex min-h-[90vh] items-center justify-center pb-24 pt-20 overflow-hidden">
        
        {/* ═══════════════════════════════════════
            CONTENT LAYOUT (2-Column)
            ═══════════════════════════════════════ */}
        <div 
          ref={containerRef}
          className={`relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-12 transition-all duration-1000 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* ── Left Column: Text ── */}
          <div className="flex-1 text-center lg:text-left pt-10 lg:pt-0 relative">
            
            {/* ── Ambient Technical Glow (Cyan Only) ── */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 blur-[100px] pointer-events-none select-none opacity-40 dark:opacity-60">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-full" />
            </div>

            {/* Architectural Accent Line (Left anchor on desktop) */}
            {/* ── Top Badges ── */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
              {availabilityText && (
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-1 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)] font-medium tracking-wide">
                    {availabilityText}
                  </span>
                </div>
              )}
              
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-1 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
                <span className="font-mono text-[11px] text-[var(--text-secondary)] font-medium tracking-wide">
                  TRUSTED BY GROWING BUSINESSES
                </span>
              </div>
            </div>

            {/* ── Headline ── */}
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl leading-[1.15]">
              We Build Websites & Apps<br />
              <span className="text-[var(--text-secondary)]">That Grow With Your Business</span><br />
              <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">Engineering with Precision.</span>
            </h1>

            {/* ── Subtext ── */}
            <p className="mx-auto lg:mx-0 mt-6 max-w-[540px] text-base sm:text-lg leading-relaxed text-[var(--text-secondary)] font-medium">
              {cmsHero?.description || "We build fast, reliable websites and apps for growing companies. From idea to launch, we handle the tech so you can focus on your business."}
            </p>

            {/* ── CTAs ── */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {/* High Contrast Primary Button */}
              <Link
                href="/services"
                className="group relative overflow-hidden rounded-md border border-[var(--color-cta-primary-border)] bg-[var(--color-cta-primary-bg)] px-6 py-3 transition-all hover:bg-[var(--color-cta-primary-hover-bg)] hover:border-[var(--color-cta-primary-hover-border)] active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <span className="font-mono text-[13px] font-bold uppercase tracking-wider text-[var(--color-cta-primary-text)]">
                  SEE_OUR_SERVICES
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-cta-primary-text)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/work"
                className="group flex items-center justify-center gap-2 rounded-md border border-transparent px-6 py-3 font-mono text-[13px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] active:scale-95"
              >
                VIEW_OUR_WORK
              </Link>
            </div>
          </div>

          {/* ── Right Column: Text Mosaic Logo ── */}
          <div className="flex-1 flex justify-center lg:justify-end relative z-10 w-full max-w-[340px] lg:max-w-[420px]">
             <div 
                className="relative w-full aspect-square opacity-[0.85] overflow-hidden flex items-center justify-center transition-all duration-700 hover:scale-[1.02] hover:opacity-100"
                style={{
                  maskImage: "url('/Syntaxure%20Labs%20Logo.png')",
                  WebkitMaskImage: "url('/Syntaxure%20Labs%20Logo.png')",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                }}
             >
                <div 
                  className="absolute inset-0 w-full h-full font-mono text-[8px] sm:text-[9px] leading-[1.1] font-bold tracking-tighter text-justify break-all select-none"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", // cyan-500 to violet-500
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    maskImage: "radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)",
                    WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)",
                  }}
                >
                  {"SYNTAXURE LABS WE BUILD WEBSITES AND APPS THAT GROW WITH YOUR BUSINESS ENGINEERING WITH PRECISION FAST RELIABLE SCALABLE ".repeat(150)}
                </div>
             </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SCROLL INDICATOR
            ═══════════════════════════════════════ */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] z-20"
          aria-label="Scroll to content"
        >
          <ArrowDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>
    </div>
  );
}

export default Hero;
