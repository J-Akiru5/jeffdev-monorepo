'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wifi, Sun, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTButton } from '@/components/ui/mht-button';

export function HeroSection() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" id="hero">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Headline */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">
              Serving Western Visayas
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Next-Generation{' '}
            <span className="text-gradient-blue">Connectivity.</span>
            <br />
            <span className="text-gradient-green">Sustainable</span> Power.
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Empowering communities in Western Visayas with fiber-fast internet and
            intelligent solar energy systems.
          </p>
        </motion.div>

        {/* Dual-Track Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Nexure Networks Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard accent="blue" className="p-8 sm:p-10 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-100 text-blue-600">
                  <Wifi className="h-5 w-5" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Nexure Networks
                </h2>
              </div>
              <p className="text-slate-500 leading-relaxed mb-6">
                Experience uninterrupted, localized WiFi with enterprise-grade
                reliability. Uncapped data plans designed for Filipino households
                and businesses.
              </p>
              <Link href="/nexure">
                <MHTButton variant="blue" size="md" className="group">
                  Check Coverage
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </MHTButton>
              </Link>
            </GlassCard>
          </motion.div>

          {/* Joularix Solar Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <GlassCard accent="green" className="p-8 sm:p-10 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-green-100 text-green-600">
                  <Sun className="h-5 w-5" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Joularix Solar
                </h2>
              </div>
              <p className="text-slate-500 leading-relaxed mb-6">
                Smart grid solar solutions with Tier-1 panels, battery storage,
                and turnkey installation. Cut your electricity bills by up to 85%.
              </p>
              <Link href="/joularix">
                <MHTButton variant="green" size="md" className="group">
                  Calculate Savings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </MHTButton>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
