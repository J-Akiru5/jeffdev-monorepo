import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import { Reveal } from "@/components/reveal";

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
    text?: string;
    url?: string;
  };
}) {
  return (
    <section className="relative py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal
          className="relative overflow-hidden rounded-md glass-neon p-12 md:p-16 text-center"
          threshold={0.2}
          transitionClassName="duration-1000 ease-out"
        >
          {/* Background Accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-500/15 blur-[80px]" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Availability Badge */}
            {availabilityText && (
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 shadow-sm">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-xs text-emerald-400">
                  {availabilityText}
                </span>
              </div>
            )}

            {/* Headline */}
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
              {cmsCta?.heading ? (
                cmsCta.heading.includes("Exceptional?") ? (
                  <>
                    {cmsCta.heading.split("Exceptional?")[0]}
                    <span className="text-gradient-holographic">Exceptional?</span>
                    {cmsCta.heading.split("Exceptional?")[1]}
                  </>
                ) : (
                  cmsCta.heading
                )
              ) : (
                <>
                  Ready to Build Something{" "}
                  <span className="text-gradient-holographic">Exceptional?</span>
                </>
              )}
            </h2>

            {/* Subtext */}
            <p className="mt-4 max-w-xl text-[var(--text-secondary)] md:text-lg leading-relaxed">
              {cmsCta?.description || "Let's discuss your project. We'll scope it properly, define milestones, and give you a clear investment quote. No surprises."}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {/* Primary CTA */}
              <Link
                href={cmsCta?.buttonUrl || cmsCta?.url || "/services"}
                className="group relative overflow-hidden rounded-md border border-[var(--color-cta-primary-border)] bg-[var(--color-cta-primary-bg)] px-8 py-3.5 transition-all hover:bg-[var(--color-cta-primary-hover-bg)] hover:border-[var(--color-cta-primary-hover-border)] hover:scale-[0.98] active:scale-95 shadow-md"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-[var(--color-cta-primary-text)]">
                  {cmsCta?.buttonText || cmsCta?.text || "View_Templates"}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/contact"
                className="group flex items-center justify-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-all hover:border-[var(--border-active)] hover:text-[var(--text-primary)] active:scale-95"
              >
                Book_Call
              </Link>
            </div>

            {/* Trust Line */}
            <p className="mt-8 font-mono text-xs text-[var(--text-tertiary)]">
              No commitment required. Free 30-minute discovery call.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default CTA;
