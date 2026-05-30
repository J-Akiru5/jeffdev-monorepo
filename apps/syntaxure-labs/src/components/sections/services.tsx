"use client";

import Link from "next/link";
import { Globe, Cloud, Cpu, Sparkles, Code, Smartphone, Lightbulb, ArrowUpRight } from "lucide-react";
import { cn } from "@syntaxure/ui";
import { useInView } from "@/lib/use-in-view";
import type { DataService } from "@/lib/data";

/**
 * Services Section
 * ----------------
 * Productized B2B service offerings with:
 * - Icon-based cards
 * - Glass morphism styling
 * - Scroll-triggered animations (CSS-based)
 * - Investment-focused language
 */

const categoryIcons: Record<string, typeof Globe> = {
  web: Globe,
  saas: Cloud,
  ai: Sparkles,
  cloud: Cpu,
  mobile: Smartphone,
  design: Lightbulb,
  consulting: Code,
};

interface ServicesProps {
  services: DataService[];
}

export function Services({ services: dbServices }: ServicesProps) {
  const { ref: headerRef, isInView: headerInView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const { ref: cardsRef, isInView: cardsInView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  // Map DB services to display format, fallback to empty array
  const displayServices = dbServices.map((svc) => ({
    id: svc.slug,
    icon: categoryIcons[svc.icon] || Globe,
    title: svc.title,
    description: svc.description || svc.tagline,
    features: svc.features?.slice(0, 3) || [],
    href: `/services/${svc.slug}`,
  }));

  return (
    <section className="relative section-padding lazy-section" id="services">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            {"// Services"}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Productized Solutions for
            <br />
            <span className="text-gradient-holographic">Modern Businesses</span>
          </h2>
          <p className="mt-4 text-white/50">
            We partner with ambitious startups and enterprises to build web
            systems that drive growth. Clear scope. Fixed investment.
          </p>
        </div>

        {/* Services Grid */}
        <div
          ref={cardsRef}
          className={`mt-16 grid gap-6 md:grid-cols-2 transition-all duration-700 ${
            cardsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className={cn(
                "group relative overflow-hidden glass-neon p-8 transition-all duration-300",
                "hover:border-cyan-500/30 hover:bg-white/[0.04]",
              )}
            >
              {/* Icon */}
              <div className="mb-6 inline-flex rounded-md border border-white/10 bg-white/5 p-3">
                <service.icon className="h-6 w-6 text-cyan-400" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {service.description}
              </p>

              {/* Feature Tags */}
              <div className="mt-6 flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Arrow indicator */}
              <div className="absolute right-6 top-8 text-white/20 transition-all duration-300 group-hover:text-cyan-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight className="h-5 w-5" />
              </div>

              {/* Hover gradient accent */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
