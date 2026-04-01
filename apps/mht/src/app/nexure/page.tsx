import type { Metadata } from 'next';
import { PreLaunchBadge, NexureFeatureGrid, CoverageChecker } from '@/components/nexure/nexure-components';
import { GlassCard } from '@/components/ui/glass-card';
import { Wifi, Signal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nexure Networks — Localized High-Speed Internet',
  description: 'Experience uninterrupted, localized WiFi in Dingle, Iloilo. Enterprise-grade routers, uncapped data, and 24/7 local support.',
};

const plans = [
  { name: 'Basic', speed: '25 Mbps', price: '₱999', features: ['Uncapped Data', 'Basic Router', 'Email Support'] },
  { name: 'Home Pro', speed: '50 Mbps', price: '₱1,499', features: ['Uncapped Data', 'Dual-Band Router', '24/7 Support', 'Priority Repair'] },
  { name: 'Business', speed: '100 Mbps', price: '₱2,999', features: ['Uncapped Data', 'Enterprise AP', 'Dedicated Support', 'SLA Guarantee', 'Static IP'] },
];

export default function NexurePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 sm:py-24" id="nexure-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <PreLaunchBadge division="Nexure Networks" />
          </div>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600">
                <Wifi className="h-6 w-6" strokeWidth={2} />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
                Nexure Networks
              </h1>
            </div>
            <p className="text-lg text-slate-500 leading-relaxed">
              Bringing reliable, high-speed internet to every household and business
              in Western Visayas. No data caps. No excuses.
            </p>
          </div>
        </div>
      </section>

      {/* Why Nexure */}
      <section className="py-12 sm:py-16 border-t border-black/[0.04]" id="nexure-why">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Why Choose Nexure?</h2>
          <NexureFeatureGrid />
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-transparent to-blue-50/30" id="nexure-plans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Internet Plans</h2>
          <p className="text-slate-500 mb-8">Simple, transparent pricing. No hidden fees.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <GlassCard
                key={plan.name}
                accent={i === 1 ? 'blue' : 'none'}
                className={`p-6 sm:p-8 ${i === 1 ? 'ring-2 ring-blue-200' : ''}`}
              >
                <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-4">{plan.speed}</p>
                <p className="text-3xl font-bold text-slate-900 mb-1">{plan.price}</p>
                <p className="text-xs text-slate-400 mb-6">/month</p>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Signal className="h-3.5 w-3.5 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/quote" className="block mt-6">
                  <button className="w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Subscribe
                  </button>
                </a>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Checker */}
      <section className="py-12 sm:py-16" id="nexure-coverage">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CoverageChecker />
        </div>
      </section>
    </>
  );
}
