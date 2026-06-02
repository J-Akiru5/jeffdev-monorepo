"use client";

import Link from "next/link";
import { Globe, Cloud, Cpu, Sparkles, Code, Smartphone, Lightbulb, ArrowUpRight } from "lucide-react";
import { cn } from "@syntaxure/ui";
import { useInView } from "@/lib/use-in-view";
import type { DataService } from "@/lib/data";

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

  const displayServices = dbServices.map((svc) => ({
    id: svc.slug,
    icon: categoryIcons[svc.icon] || Globe,
    title: svc.title,
    description: svc.description || svc.tagline,
    features: svc.features?.slice(0, 4) || [],
    href: `/services/${svc.slug}`,
  }));

  return (
    <section className="relative py-24 lg:py-32 lazy-section overflow-hidden" id="services">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* ── Section Header ── */}
        <div
          ref={headerRef}
          className={`mx-auto max-w-2xl text-center transition-all duration-700 ease-out ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Productized Solutions
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Built for Modern Businesses
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            We partner with ambitious startups and enterprises to build high-performance web systems. Clear scope, fixed investment, premium delivery.
          </p>
        </div>

        {/* ── Bento Grid ── */}
        <div
          ref={cardsRef}
          className={`mt-16 grid gap-6 md:grid-cols-3 transition-all duration-1000 ease-out delay-200 ${
            cardsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {displayServices.map((service, idx) => {
            // Asymmetrical grid logic: 1st and 4th items span 2 columns on desktop
            const isLarge = idx % 3 === 0;

            return (
              <Link
                key={service.id}
                href={service.href}
                className={cn(
                  "group relative overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 transition-all duration-300 hover:border-[var(--text-tertiary)] hover:shadow-md",
                  isLarge ? "md:col-span-2" : "md:col-span-1"
                )}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <service.icon className="h-5 w-5 text-[var(--text-primary)]" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-[var(--text-tertiary)] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--text-primary)]" />
                  </div>

                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] flex-grow">
                    {service.description}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-hover:border-[var(--text-tertiary)]"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Services;
