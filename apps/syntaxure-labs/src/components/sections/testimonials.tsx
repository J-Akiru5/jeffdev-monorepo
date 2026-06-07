"use client";

/**
 * Testimonials Section
 * ---------------------
 * Displays client testimonials in a grid layout.
 * Fetches data from Supabase testimonials table.
 */

import { Quote } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import type { Testimonial } from "@/app/actions/testimonials";

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const { ref: headerRef, isInView: headerInView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const { ref: gridRef, isInView: gridInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  if (testimonials.length === 0) return null;

  return (
    <section className="relative py-24 lg:py-32" id="testimonials">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ease-out ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Client Feedback
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Hear from the teams and founders we have partnered with.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div
          ref={gridRef}
          className={`mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-700 ease-out ${
            gridInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6"
            >
              <Quote className="h-8 w-8 text-cyan-500/20" />
              <blockquote className="mt-4 text-[var(--text-secondary)]">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                {testimonial.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={testimonial.avatar_url}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-400">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {testimonial.name}
                  </div>
                  {(testimonial.role || testimonial.company) && (
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {testimonial.role}
                      {testimonial.role && testimonial.company && " at "}
                      {testimonial.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
