'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sun, ArrowRight, TrendingDown, ShieldCheck, Leaf, Wrench, BatteryCharging, Gauge } from 'lucide-react';

const AVG_COST_PER_KWH = 11.5;
const PEAK_SUN_HOURS = 4.5;
const EFFICIENCY_FACTOR = 0.85;
const COST_PER_KW_INSTALLED = 55000;

const features = [
  { icon: TrendingDown, title: 'Cut Bills by 85%', desc: 'Systems pay for themselves in 4–6 years, then generate free electricity for 20+ more.' },
  { icon: ShieldCheck, title: '25-Year Warranty', desc: 'Tier-1 panels backed by manufacturer performance guarantees and our local support.' },
  { icon: Leaf, title: 'Go Green', desc: 'Reduce your carbon footprint. Every kW installed is a step toward a sustainable Philippines.' },
  { icon: BatteryCharging, title: 'Battery Storage', desc: 'Store excess energy for nighttime and brownouts. Full energy independence.' },
  { icon: Wrench, title: 'Turnkey Installation', desc: 'From permits to commissioning — we do everything. Zero hassle for you.' },
  { icon: Gauge, title: 'Real-Time Monitoring', desc: 'Track your solar production and savings from your smartphone.' },
];

const steps = [
  { num: '01', title: 'Free Consultation', desc: 'We assess your energy needs and roof suitability.' },
  { num: '02', title: 'Custom Design', desc: 'System sized precisely for your consumption patterns.' },
  { num: '03', title: 'Installation', desc: 'Certified technicians complete the install in 1–2 days.' },
  { num: '04', title: 'Monitoring', desc: 'Track real-time production via your phone and save.' },
];

export default function JoularixLanding() {
  const [monthlyBill, setMonthlyBill] = useState(5000);

  const results = useCallback(() => {
    const monthlyKWh = monthlyBill / AVG_COST_PER_KWH;
    const dailyKWh = monthlyKWh / 30;
    const systemSizeKW = Math.round((dailyKWh / PEAK_SUN_HOURS) * 10) / 10;
    const dailyProduction = systemSizeKW * PEAK_SUN_HOURS * EFFICIENCY_FACTOR;
    const monthlySavings = Math.round(dailyProduction * 30 * AVG_COST_PER_KWH);
    const systemCost = Math.round(systemSizeKW * COST_PER_KW_INSTALLED);
    const annualSavings = monthlySavings * 12;
    const paybackYears = annualSavings > 0 ? Math.round((systemCost / annualSavings) * 10) / 10 : 0;
    return { systemSizeKW, monthlySavings, systemCost, paybackYears };
  }, [monthlyBill])();

  const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

  return (
    <>
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600 text-white">
              <Sun className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-slate-800">Joularix Solar</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://martinezhybrid.jeffdev.studio" className="text-sm text-slate-500 hover:text-slate-700 hidden sm:block">
              ← Back to MHT
            </a>
            <a
              href="https://martinezhybrid.jeffdev.studio/quote"
              className="h-9 px-5 inline-flex items-center rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Get a Quote
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 sm:pb-28" id="joularix-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Harness the{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
                Philippine Sun
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Smart grid solar solutions with Tier-1 panels, battery storage, and
              turnkey installation. Cut your electricity bills by up to 85%.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#calculator"
                className="h-12 px-8 inline-flex items-center justify-center rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25 active:scale-[0.98]"
              >
                Calculate Savings <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="https://martinezhybrid.jeffdev.studio/quote"
                className="h-12 px-8 inline-flex items-center justify-center rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]"
              >
                Book Free Inspection
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 border-t border-black/[0.04]" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-12">Why Go Solar with Joularix?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
                <f.icon className="h-6 w-6 text-green-600 mb-3" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-transparent to-green-50/40" id="calculator">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-10 rounded-xl bg-white/65 backdrop-blur-xl border border-white/80 border-t-2 border-t-green-500 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Solar Savings Estimator</h2>
            <p className="text-sm text-slate-500 mb-8">See how much you could save by going solar.</p>

            <div className="mb-8">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-medium text-slate-600">Monthly Electric Bill</span>
                <span className="text-2xl font-bold text-slate-800">{fmt(monthlyBill)}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={50000}
                step={500}
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-green-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>₱1,000</span>
                <span>₱50,000</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Monthly Savings', value: fmt(results.monthlySavings), green: true },
                { label: 'System Size', value: `${results.systemSizeKW} kW`, green: false },
                { label: 'System Cost', value: fmt(results.systemCost), green: false },
                { label: 'Payback', value: `${results.paybackYears} yrs`, green: true },
              ].map((r) => (
                <div key={r.label} className="rounded-lg bg-white/50 border border-slate-100 p-3">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">{r.label}</p>
                  <p className={`text-lg font-bold ${r.green ? 'text-green-600' : 'text-slate-800'}`}>{r.value}</p>
                </div>
              ))}
            </div>

            <a
              href="https://martinezhybrid.jeffdev.studio/quote"
              className="block w-full h-12 leading-[48px] text-center rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md shadow-green-600/20"
            >
              Book a Free Site Inspection
            </a>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-20" id="process">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <span className="inline-block text-sm font-mono font-bold text-green-600 bg-green-100 rounded-full px-3 py-1 mb-3">{s.num}</span>
                <h3 className="text-base font-semibold text-slate-800 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            Joularix Solar is a division of{' '}
            <a href="https://martinezhybrid.jeffdev.studio" className="text-green-600 hover:underline font-medium">
              Martinez Hybrid Technologies OPC
            </a>
          </p>
          <p className="mt-2 text-xs text-slate-400">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
