import Link from 'next/link';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CTA } from '@/components/sections/cta';
import { getServices } from '@/lib/data';
import { getIcon } from '@/lib/icons';
import type { Metadata } from 'next';

/**
 * Services Page
 * -------------
 * Grid of productized B2B service offerings.
 * Fetches data from Firestore.
 */

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Productized web development solutions for startups and enterprises. Web apps, SaaS platforms, cloud architecture, and AI integration — fixed investment, clear deliverables.',
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Page Header */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="mt-8 max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
                {"// Services"}
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Productized Solutions
              </h1>
              <p className="mt-4 text-lg text-white/50">
                Clear scope. Fixed investment. No surprises. We partner with
                ambitious businesses to build web systems that drive growth.
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
                    className="group relative overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]"
                  >
                    {/* Icon */}
                    <div className="mb-6 inline-flex rounded-md border border-white/10 bg-white/5 p-3">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-semibold text-white">
                      {service.title}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-cyan-400/70">
                      {service.tagline}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-white/50">
                      {service.description.slice(0, 150)}...
                    </p>

                    {/* Investment */}
                    <div className="mt-6 flex items-center gap-4 border-t border-white/[0.06] pt-6">
                      <div>
                        <div className="font-mono text-xs text-white/40">
                          Starting at
                        </div>
                        <div className="font-semibold text-white">
                          {service.investment.starting}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-white/40">
                          Timeline
                        </div>
                        <div className="font-semibold text-white">
                          {service.investment.timeline}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="absolute right-6 top-8 text-white/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-400">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>

                    {/* Hover gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
