'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, ArrowRight, Signal, Shield, Headphones, Router, Globe, Zap } from 'lucide-react';

const features = [
  { icon: Signal, title: 'Uncapped Data', desc: 'No data caps, no throttling. Unlimited browsing for the whole family.' },
  { icon: Shield, title: '99.8% Uptime', desc: 'Enterprise-grade infrastructure with redundant connections.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Local technicians available around the clock in your municipality.' },
  { icon: Router, title: 'Free Router', desc: 'Commercial-grade dual-band router included with every plan.' },
  { icon: Globe, title: 'No Contracts', desc: 'Month-to-month flexibility. Stay because you want to, not because you have to.' },
  { icon: Zap, title: 'Instant Setup', desc: 'Same-day installation available in covered barangays.' },
];

const plans = [
  { name: 'Basic', speed: '25 Mbps', price: '₱999', popular: false },
  { name: 'Home Pro', speed: '50 Mbps', price: '₱1,499', popular: true },
  { name: 'Business', speed: '100 Mbps', price: '₱2,999', popular: false },
];

export default function NexureLanding() {
  return (
    <>
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
              <Wifi className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-slate-800">Nexure Networks</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://martinezhybrid.jeffdev.studio"
              className="text-sm text-slate-500 hover:text-slate-700 hidden sm:block"
            >
              ← Back to MHT
            </a>
            <a
              href="https://martinezhybrid.jeffdev.studio/quote"
              className="h-9 px-5 inline-flex items-center rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Connected
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 sm:pb-28" id="nexure-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-black/[0.06] mb-8 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-slate-600 font-medium">Network Operational — Dingle, Iloilo</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Internet That Keeps Up With{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Your Life
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              Reliable, high-speed WiFi designed for Filipino homes and businesses.
              No data caps. No hidden fees. Local support you can actually reach.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://martinezhybrid.jeffdev.studio/quote"
                className="h-12 px-8 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 active:scale-[0.98]"
              >
                Check Coverage <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="#plans"
                className="h-12 px-8 inline-flex items-center justify-center rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]"
              >
                View Plans
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 border-t border-black/[0.04]" id="nexure-features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-12">Why Nexure?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
                <f.icon className="h-6 w-6 text-blue-600 mb-3" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-transparent to-blue-50/40" id="plans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-3">Simple, Transparent Plans</h2>
          <p className="text-slate-500 text-center mb-12">No lock-in contracts. Cancel anytime.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 sm:p-8 rounded-xl bg-white/65 backdrop-blur-xl border shadow-[0_4px_12px_rgba(0,0,0,0.04)] text-center ${
                  plan.popular ? 'border-blue-300 ring-2 ring-blue-200 border-t-2 border-t-blue-500' : 'border-white/80'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 rounded-full px-3 py-1 mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-4">{plan.speed}</p>
                <p className="text-4xl font-bold text-slate-900 mb-1">{plan.price}</p>
                <p className="text-xs text-slate-400 mb-6">/month</p>
                <a
                  href="https://martinezhybrid.jeffdev.studio/quote"
                  className="block w-full h-10 leading-10 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Subscribe
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            Nexure Networks is a division of{' '}
            <a href="https://martinezhybrid.jeffdev.studio" className="text-blue-600 hover:underline font-medium">
              Martinez Hybrid Technologies OPC
            </a>
          </p>
          <p className="mt-3 text-[11px] text-slate-400 max-w-3xl mx-auto">
            All telecommunications and internet-related services provided by Nexure Networks are subject to the required permits, licenses, and regulations of the National Telecommunications Commission (NTC) and other relevant government agencies.
          </p>
        </div>
      </footer>
    </>
  );
}
