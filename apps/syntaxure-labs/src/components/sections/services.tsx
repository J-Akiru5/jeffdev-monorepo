import Link from "next/link";
import { Globe, Cloud, Cpu, Sparkles, Code, Smartphone, Lightbulb, ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
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
  const displayServices = dbServices.map((svc) => ({
    id: svc.slug,
    icon: categoryIcons[svc.icon] || Globe,
    title: svc.title,
    description: svc.description,
    features: svc.features?.slice(0, 3) || [],
    href: `/services/${svc.slug}`,
  }));

  return (
    <section className="relative py-16 md:py-24 lg:py-32 lazy-section overflow-hidden" id="services">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* ── Section Header ── */}
        <Reveal className="mx-auto max-w-2xl text-center" threshold={0.2}>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            What We Offer
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            Our Services
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Fixed-scope, premium digital products delivered without the typical agency friction. Pick a service, and we'll handle the rest.
          </p>
        </Reveal>

        {/* ── Service Cards Grid ── */}
        <div
          ref={cardsRef}
          className={`mt-16 grid gap-6 md:grid-cols-3 transition-all duration-1000 ease-out md:delay-200 ${
            cardsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="group relative flex flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-all duration-300 hover:border-[var(--text-tertiary)] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="flex flex-col h-full p-6">
                {/* Icon + Title row */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 shadow-sm transition-all duration-300 group-hover:shadow-[0_0_16px_var(--glass-blend-cyan)] group-hover:border-cyan-500/30">
                    <service.icon className="h-5 w-5 text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                      {service.title}
                    </h3>
                  </div>
                </div>

                {/* Full description - sells the service */}
                <p className="text-base leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                  {service.description}
                </p>

                {/* Key feature highlights */}
                {service.features.length > 0 && (
                  <div className="mt-auto pt-5 space-y-2">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <Check className="h-3.5 w-3.5 shrink-0 text-cyan-500 dark:text-cyan-400" strokeWidth={2.5} />
                        <span className="text-xs text-[var(--text-secondary)] leading-snug">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA footer */}
                <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] transition-all duration-300 group-hover:text-cyan-500 dark:group-hover:text-cyan-400">
                    See what&apos;s included
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--text-secondary)]">
                    Custom quote
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default Services;
