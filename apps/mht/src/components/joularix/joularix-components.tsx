'use client';

import React, { useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { MHTButton } from '@/components/ui/mht-button';

const solarFeatures = [
  {
    title: 'Tier-1 Panels',
    description: 'Industry-leading solar panels with 25-year performance warranty and peak efficiency.',
    icon: '☀️',
  },
  {
    title: 'Battery Storage',
    description: 'Store excess energy for nighttime use and power outages. Full energy independence.',
    icon: '🔋',
  },
  {
    title: 'Turnkey Installation',
    description: 'From permits to commissioning, we handle everything. Zero headaches for you.',
    icon: '🔧',
  },
];

export function JoularixFeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {solarFeatures.map((feature) => (
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

/**
 * Solar Savings Calculator
 * REAL MATH based on Philippine solar conditions:
 * - Average peak sun hours in Western Visayas: ~4.5 hrs/day
 * - Average electricity cost: ₱11.50/kWh (ILECO rates)
 * - System efficiency factor: 85% (accounts for losses)
 * - Average cost per kW installed: ₱55,000
 */
const AVG_COST_PER_KWH = 11.5;     // Philippine peso
const PEAK_SUN_HOURS = 4.5;         // hrs/day (Western Visayas average)
const EFFICIENCY_FACTOR = 0.85;      // 85%
const COST_PER_KW_INSTALLED = 55000; // ₱55,000 per kW

export function SolarCalculator() {
  const [monthlyBill, setMonthlyBill] = useState(5000);

  const calculate = useCallback(() => {
    const monthlyKWh = monthlyBill / AVG_COST_PER_KWH;
    const dailyKWh = monthlyKWh / 30;
    const systemSizeKW = dailyKWh / PEAK_SUN_HOURS;
    const roundedSystemSize = Math.round(systemSizeKW * 10) / 10;

    const dailyProduction = roundedSystemSize * PEAK_SUN_HOURS * EFFICIENCY_FACTOR;
    const monthlySavings = Math.round(dailyProduction * 30 * AVG_COST_PER_KWH);
    const annualSavings = monthlySavings * 12;

    const systemCost = Math.round(roundedSystemSize * COST_PER_KW_INSTALLED);
    const paybackYears = annualSavings > 0
      ? Math.round((systemCost / annualSavings) * 10) / 10
      : 0;

    return { roundedSystemSize, monthlySavings, annualSavings, systemCost, paybackYears };
  }, [monthlyBill]);

  const results = calculate();

  const formatPeso = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);

  return (
    <GlassCard className="p-6 sm:p-8" accent="green" id="solar-calculator">
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        Quick Solar Savings Estimator
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        Slide to enter your current monthly electric bill.
      </p>

      {/* Slider Input */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-3">
          <label className="text-sm font-medium text-slate-600">
            Monthly Electric Bill
          </label>
          <span className="text-2xl font-bold text-slate-800">
            {formatPeso(monthlyBill)}
          </span>
        </div>
        <input
          type="range"
          min={1000}
          max={50000}
          step={500}
          value={monthlyBill}
          onChange={(e) => setMonthlyBill(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-green-600"
          id="solar-slider"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>₱1,000</span>
          <span>₱50,000</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ResultCard
          label="Monthly Savings"
          value={formatPeso(results.monthlySavings)}
          accent="green"
        />
        <ResultCard
          label="System Size"
          value={`${results.roundedSystemSize} kW`}
          accent="slate"
        />
        <ResultCard
          label="System Cost"
          value={formatPeso(results.systemCost)}
          accent="slate"
        />
        <ResultCard
          label="Payback Period"
          value={`${results.paybackYears} years`}
          accent="green"
        />
      </div>

      <div className="mt-6">
        <a href="/quote">
          <MHTButton variant="green" size="md" className="w-full sm:w-auto">
            Book a Free Site Inspection
          </MHTButton>
        </a>
      </div>
    </GlassCard>
  );
}

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'green' | 'slate';
}) {
  return (
    <div className="rounded-lg bg-white/50 border border-slate-100 p-3">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-bold ${
          accent === 'green' ? 'text-green-600' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
