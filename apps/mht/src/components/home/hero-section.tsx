'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wifi, Sun, ArrowRight, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTButton } from '@/components/ui/mht-button';

export function HeroSection() {
  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] flex items-center py-16 sm:py-20 overflow-hidden"
      id="hero"
    >
      {/* Decorative orbs — calibrated to not fight the grid */}
      <div className="absolute top-24 -left-48 w-[500px] h-[500px] bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-48 w-[500px] h-[500px] bg-green-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ─── LEFT: Brand Identity ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/80 mb-8 backdrop-blur-sm shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600 font-mono tracking-wide">
                Serving Western Visayas
              </span>
            </div>

            {/* Company wordmark */}
            <div className="mb-4">
              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">
                Martinez Hybrid Technologies OPC
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05]">
                Next-Gen{' '}
                <span className="text-gradient-blue block sm:inline">
                  Connectivity.
                </span>
                <br />
                <span className="text-gradient-green">Sustainable</span>{' '}
                Power.
              </h1>
            </div>

            <p className="text-lg text-slate-500 leading-relaxed max-w-md mt-6 mb-10">
              Empowering communities in Western Visayas with fiber-fast
              internet and intelligent solar energy systems — built local,
              for locals.
            </p>

            {/* Credential strip — Syntaxure-style mono data bar */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-200/60">
              {[
                { value: 'Est. 2026', label: 'Founded' },
                { value: '24/7', label: 'AI Support' },
                { value: 'Western Visayas', label: 'Coverage' },
              ].map((cred, i) => (
                <React.Fragment key={cred.label}>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-800 font-mono">
                      {cred.value}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {cred.label}
                    </p>
                  </div>
                  {i < 2 && (
                    <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* ─── RIGHT: Professional Division Cards ─── */}
          <div className="flex flex-col gap-5">
            {/* Nexure Networks Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            >
              <GlassCard accent="blue" className="p-7 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                      <Wifi className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">
                        Nexure Networks
                      </h2>
                      <p className="text-[11px] text-blue-500 font-mono uppercase tracking-wider">
                        Internet Services
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-mono font-medium text-amber-600 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Pre-Launch
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Enterprise-grade, uncapped internet for Filipino households
                  and businesses. Local infrastructure, local support — no
                  data caps, no excuses.
                </p>
                <div className="flex items-center justify-between">
                  <Link href="/nexure">
                    <MHTButton variant="blue" size="sm" className="group gap-1.5">
                      Check Coverage
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </MHTButton>
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Zap className="h-3 w-3 text-blue-400" strokeWidth={2} />
                    <span className="font-mono">Up to 100 Mbps</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Joularix Solar Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            >
              <GlassCard accent="green" className="p-7 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600 shrink-0">
                      <Sun className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">
                        Joularix Solar
                      </h2>
                      <p className="text-[11px] text-green-600 font-mono uppercase tracking-wider">
                        Renewable Energy
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-mono font-medium text-amber-600 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Pre-Launch
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Smart grid solar solutions with Tier-1 panels, battery
                  storage, and turnkey installation. Cut electricity bills
                  by up to 85%.
                </p>
                <div className="flex items-center justify-between">
                  <Link href="/joularix">
                    <MHTButton variant="green" size="sm" className="group gap-1.5">
                      Calculate Savings
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </MHTButton>
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Sun className="h-3 w-3 text-green-400" strokeWidth={2} />
                    <span className="font-mono">ILECO Certified</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
