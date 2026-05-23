'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * Pre-launch status badge — shown on Nexure and Joularix pages
 * while the company is in pre-launch phase.
 */
export function PreLaunchBadge({ division }: { division: string }) {
  return (
    <div
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/70 border border-amber-200/80 backdrop-blur-sm shadow-sm text-sm"
      id="pre-launch-badge"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>
      <span className="font-mono font-medium text-slate-600">
        {division}:{' '}
        <span className="text-amber-600">Pre-Launch Phase</span>
      </span>
    </div>
  );
}

const features = [
  {
    title: 'Localized Support',
    description: 'On-ground technicians available within hours, not days. We speak your language.',
    icon: '🛡️',
  },
  {
    title: 'Uncapped Data',
    description: 'No data caps, no throttling. Stream, work, and connect without limits.',
    icon: '♾️',
  },
  {
    title: 'Enterprise Routers',
    description: 'Commercial-grade access points for reliable coverage across your area.',
    icon: '📡',
  },
];

export function NexureFeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {features.map((feature) => (
        <GlassCard key={feature.title} className="p-6" hover>
          <div className="text-2xl mb-3">{feature.icon}</div>
          <h3 className="text-base font-semibold text-slate-800 mb-2">
            {feature.title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {feature.description}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}

export function CoverageChecker() {
  return (
    <GlassCard className="p-6 sm:p-8" accent="blue" id="coverage-checker">
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        Check Availability
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        Enter your barangay or street to check if Nexure Networks covers your area.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Enter your Barangay or Street..."
          className="flex-1 h-11 px-4 rounded-lg border border-slate-200 bg-white/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          id="coverage-input"
        />
        <button
          className="h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors active:scale-[0.98]"
          id="coverage-check-btn"
        >
          Check Now
        </button>
      </div>
    </GlassCard>
  );
}
