"use client";

import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import { useInView } from "@/lib/use-in-view";

export function CTA({
  availabilityText,
  cmsCta,
}: {
  availabilityText?: string | null;
  cmsCta?: {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
}) {
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          ref={contentRef}
          className={`relative overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-12 md:p-16 text-center shadow-sm transition-all duration-1000 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* ── Ambient Technical Glow (Cyan Only) ── */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] z-0 blur-[100px] pointer-events-none select-none opacity-40 dark:opacity-60">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-full" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Availability Badge */}
            {availabilityText && (
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-1.5 shadow-sm">
                <Zap className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                <span className="font-mono text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
                  {availabilityText}
                </span>
              </div>
            )}

            {/* Headline */}
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
              {cmsCta?.heading || "Ready to Build Something Exceptional?"}
            </h2>

            {/* Subtext */}
            <p className="mt-4 max-w-xl text-[var(--text-secondary)] md:text-lg leading-relaxed">
              {cmsCta?.description || "Let's discuss your project. We'll scope it properly, define milestones, and give you a fixed investment quote — no surprises."}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {/* Primary CTA */}
              <Link
                href={cmsCta?.buttonUrl || "/quote"}
                className="group relative flex items-center justify-center gap-2 rounded-md bg-[var(--text-primary)] px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[var(--bg-primary)] transition-transform hover:scale-[0.98] active:scale-95 shadow-md"
              >
                {cmsCta?.buttonText || "Start_Project"}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/contact"
                className="group flex items-center justify-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-all hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] shadow-sm"
              >
                Book_Call
              </Link>
            </div>

            {/* Trust Line */}
            <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
              No commitment required. Free 30-minute discovery call.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
