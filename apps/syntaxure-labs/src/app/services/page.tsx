import Link from "next/link";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CTASection } from "@/components/sections/cta-section";
import { getServices } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { services as staticServices } from "@/data/services";
import type { Metadata } from "next";

/**
 * Services Page
 * -------------
 * Grid of productized B2B service offerings.
 * Fetches data from Firestore.
 */

export const metadata: Metadata = {
  title: "Services",
  description:
    "Custom software development, SaaS architecture, cloud infrastructure, and AI integration for businesses. Every project starts with a conversation about your goals and budget.",
};

export default async function ServicesPage() {
  let services = await getServices();

  // Fallback to static data when Supabase returns empty
  if (services.length === 0) {
    services = staticServices.map((s) => ({
      slug: s.slug,
      icon: s.icon.name,
      title: s.title,
      tagline: s.tagline,
      description: s.description,
      features: s.features,
      deliverables: s.deliverables,
      investment: {
        starting: `PHP ${s.investment.startingPrice.toLocaleString()}`,
        timeline: s.investment.timeline,
      },
      order: 0,
    }));
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16">
        {/* Desktop Absolute Back Button (Sits on the left side, professional style) */}
        <div className="hidden xl:flex absolute left-[max(2rem,calc(50%-54rem))] top-24 z-50">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <section className="px-6 pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl relative">
            {/* Mobile/Tablet: Back button */}
            <div className="mb-8 xl:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>
            
            {/* Center: Content */}
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {"// Services"}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                What We Build
              </h1>
              <p className="mt-3 text-base text-[var(--text-secondary)]">
                Custom websites, SaaS platforms, cloud infrastructure, and AI automation. Every project starts with a conversation about your goals and budget.
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2">
              {services.map((service) => {
                const Icon = getIcon(service.icon);
                return (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="group relative overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 transition-all duration-300 hover:border-[var(--text-tertiary)] hover:shadow-md hover:-translate-y-0.5"
                  >
                    {/* Icon */}
                    <div className="mb-5 inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 shadow-sm">
                      <Icon className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                    </div>

                    {/* Content */}
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      {service.title}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-cyan-500/80 dark:text-cyan-400/80">
                      {service.tagline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                      {service.description}
                    </p>

                    {/* Investment */}
                    <div className="mt-5 flex items-center gap-6 border-t border-[var(--border-subtle)] pt-5">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          Investment
                        </div>
                        <div className="mt-0.5 font-semibold text-[var(--text-primary)]">
                          Custom quote
                        </div>
                        <div className="font-mono text-[9px] text-[var(--text-tertiary)] mt-0.5">
                          Tell us your budget
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          Timeline
                        </div>
                        <div className="mt-0.5 font-semibold text-[var(--text-primary)]">
                          {service.investment.timeline}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="absolute right-5 top-6 text-[var(--text-tertiary)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-500 dark:group-hover:text-cyan-400">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>

                    {/* Hover glow */}
                    <div className="pointer-events-none absolute -inset-px rounded-md bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
