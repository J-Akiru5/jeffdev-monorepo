import type { Metadata } from 'next';
import { JoularixFeatureGrid, SolarCalculator } from '@/components/joularix/joularix-components';
import { PreLaunchBadge } from '@/components/nexure/nexure-components';
import { GlassCard } from '@/components/ui/glass-card';
import { Sun, Leaf, TrendingDown, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Joularix Solar — Smart Grid Solar Solutions',
  description: 'Tier-1 solar panels, battery storage, and turnkey installation. Cut your electricity bills by up to 85% with Joularix Solar.',
};

const whyData = [
  { icon: TrendingDown, title: 'Cut Bills by 85%', desc: 'Our systems pay for themselves within 4–6 years, then generate free electricity for 20+ more.' },
  { icon: ShieldCheck, title: '25-Year Warranty', desc: 'Tier-1 panels backed by manufacturer performance guarantees. Built to last.' },
  { icon: Leaf, title: 'Go Green', desc: 'Reduce your carbon footprint and contribute to a sustainable Philippines.' },
];

export default function JoularixPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 sm:py-24" id="joularix-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6">
              <PreLaunchBadge division="Joularix Solar" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600">
                <Sun className="h-6 w-6" strokeWidth={2} />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
                Joularix Solar
              </h1>
            </div>
            <p className="text-lg text-slate-500 leading-relaxed">
              Smart grid solar solutions that harness the abundant Philippine sun.
              From residential rooftops to commercial installations.
            </p>
          </div>
        </div>
      </section>

      {/* Why Solar */}
      <section className="py-12 sm:py-16 border-t border-black/[0.04]" id="joularix-why">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Why Go Solar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {whyData.map((item) => (
              <GlassCard key={item.title} className="p-6" hover>
                <item.icon className="h-8 w-8 text-green-600 mb-3" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-transparent to-green-50/30" id="joularix-features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Our Solar Products</h2>
          <JoularixFeatureGrid />
        </div>
      </section>

      {/* Solar Calculator */}
      <section className="py-12 sm:py-16" id="joularix-calculator">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SolarCalculator />
        </div>
      </section>

      {/* Process */}
      <section className="py-12 sm:py-16 border-t border-black/[0.04]" id="joularix-process">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Free Consultation', desc: 'We assess your energy needs and roof suitability.' },
              { step: '02', title: 'Custom Design', desc: 'Engineered system sized precisely for your consumption.' },
              { step: '03', title: 'Installation', desc: 'Professional installation by certified technicians.' },
              { step: '04', title: 'Monitoring', desc: 'Real-time production monitoring via your phone.' },
            ].map((item) => (
              <div key={item.step} className="text-center sm:text-left">
                <span className="inline-block text-sm font-mono font-bold text-green-600 bg-green-100 rounded-full px-3 py-1 mb-3">
                  {item.step}
                </span>
                <h3 className="text-base font-semibold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
