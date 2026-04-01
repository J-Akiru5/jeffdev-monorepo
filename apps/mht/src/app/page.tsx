import { HeroSection } from '@/components/home/hero-section';
import { NexureFeatureGrid, CoverageChecker } from '@/components/nexure/nexure-components';
import { JoularixFeatureGrid, SolarCalculator } from '@/components/joularix/joularix-components';
import { GlassCard } from '@/components/ui/glass-card';
import { Wifi, Sun, Shield, Clock, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Trust Bar */}
      <section className="py-12 border-y border-black/[0.04]" id="trust-bar">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: 'Active Subscribers', icon: Users },
              { value: '99.8%', label: 'Uptime Guarantee', icon: Shield },
              { value: '24/7', label: 'Local Support', icon: Clock },
              { value: '50kW+', label: 'Solar Deployed', icon: Zap },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <stat.icon className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nexure Preview Section */}
      <section className="py-16 sm:py-20" id="nexure-preview">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600">
              <Wifi className="h-4 w-4" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Nexure Networks</h2>
          </div>
          <p className="text-slate-500 mb-8 max-w-2xl">
            Reliable, high-speed internet built for Filipino communities.
            Local infrastructure, local support.
          </p>
          <div className="space-y-6">
            <NexureFeatureGrid />
            <CoverageChecker />
          </div>
        </div>
      </section>

      {/* Joularix Preview Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-transparent to-green-50/30" id="joularix-preview">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 text-green-600">
              <Sun className="h-4 w-4" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Joularix Solar</h2>
          </div>
          <p className="text-slate-500 mb-8 max-w-2xl">
            Harness the Philippine sun. Smart solar solutions that pay for themselves.
          </p>
          <div className="space-y-6">
            <JoularixFeatureGrid />
            <SolarCalculator />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20" id="cta-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <GlassCard className="p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-slate-500 mb-8 max-w-xl mx-auto">
              Whether you need blazing-fast internet or want to slash your electricity
              bills, we have a solution tailored for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/quote">
                <button className="h-12 px-8 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 active:scale-[0.98]">
                  Get a Free Quote
                </button>
              </a>
              <a href="/support">
                <button className="h-12 px-8 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]">
                  Talk to Our Team
                </button>
              </a>
            </div>
          </GlassCard>
        </div>
      </section>
    </>
  );
}
