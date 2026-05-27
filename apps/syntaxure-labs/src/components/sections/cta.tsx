"use client";

import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import { useInView } from "@/lib/use-in-view";

/**
 * CTA Section
 * -----------
 * High-conversion call-to-action banner with:
 * - Gradient background accents
 * - Compelling copy
 * - Primary action button
 * - Urgency/availability indicator
 */

export function CTA({
  availabilityText,
}: {
  availabilityText?: string | null;
}) {
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative section-padding lazy-section">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          ref={contentRef}
          className={`relative overflow-hidden rounded-md glass-neon p-12 md:p-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Background Accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-500/15 blur-[80px]" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Availability Badge */}
            {availabilityText && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-xs text-emerald-400">
                  {availabilityText}
                </span>
              </div>
            )}

            {/* Headline */}
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              Ready to Build Something{" "}
              <span className="text-gradient-holographic">Exceptional?</span>
            </h2>

            {/* Subtext */}
            <p className="mt-4 max-w-xl text-white/50 md:text-lg">
              Let&apos;s discuss your project. We&apos;ll scope it properly,
              define milestones, and give you a fixed investment quote — no
              surprises.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {/* Primary CTA */}
              <Link
                href="/quote"
                className="group relative overflow-hidden rounded-md border border-cyan-500/50 bg-cyan-500/10 px-8 py-4 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-wider text-white">
                  Start_Project
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/contact"
                className="group flex items-center justify-center gap-2 rounded-md border border-white/10 bg-black/50 px-8 py-4 backdrop-blur-md transition-all hover:border-white/20"
              >
                <span className="font-mono text-sm uppercase tracking-wider text-white/70 transition-colors group-hover:text-white">
                  Book_Call
                </span>
              </Link>
            </div>

            {/* Trust Line */}
            <p className="mt-8 font-mono text-xs text-white/30">
              No commitment required. Free 30-minute discovery call.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
