'use client';

/**
 * Pricing Page (Client Component)
 * ---------------------------------
 * SaaS-style pricing page with:
 * - Currency toggle (PHP/USD)
 * - 4-tier pricing grid
 * - Care Plan section
 * - Feature comparison table
 * - FAQ accordion
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PricingCard } from '@/components/pricing/pricing-card';
import { PricingComparison } from '@/components/pricing/pricing-comparison';
import { PricingFAQ } from '@/components/pricing/pricing-faq';
import { CarePlanSection } from '@/components/pricing/care-plan-section';
import { CurrencyToggle } from '@/components/pricing/currency-toggle';
import { pricingTiers, carePlan, comparisonTable, pricingFAQ } from '@/data/pricing';

export default function PricingPage() {
  const [currency, setCurrency] = useState<'php' | 'usd'>('php');

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mt-8 flex flex-col items-center text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 border border-cyan-500/20">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">
                  New Year, New Prices
                </span>
              </div>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                Transparent Pricing for{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Serious Growth
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg text-white/50">
                No hidden fees. No surprises. Choose the plan that fits your ambition,
                and let&apos;s build something extraordinary together.
              </p>

              {/* Currency Toggle */}
              <div className="mt-8">
                <CurrencyToggle currency={currency} onChange={setCurrency} />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Grid */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {pricingTiers.map((tier) => (
                <PricingCard key={tier.id} tier={tier} currency={currency} />
              ))}
            </div>
          </div>
        </section>

        {/* Care Plan Section */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <CarePlanSection plan={carePlan} currency={currency} />
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Compare Plans
              </h2>
              <p className="mt-2 text-white/50">
                See exactly what&apos;s included in each tier
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <PricingComparison rows={comparisonTable} />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-white/50">
                Everything you need to know about working with us
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <PricingFAQ items={pricingFAQ} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-12 text-center">
              {/* Background decoration */}
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                  Ready to Scale?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-white/60">
                  Not sure which plan is right for you? Let&apos;s discuss your project
                  and find the perfect solution together.
                </p>
                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link
                    href="/quote"
                    className="group relative flex items-center gap-2 overflow-hidden rounded-md bg-white px-8 py-3 font-medium text-black transition-all hover:bg-white/90"
                  >
                    Start Your Project
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2 rounded-md border border-white/20 px-8 py-3 font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
                  >
                    Schedule a Call
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
