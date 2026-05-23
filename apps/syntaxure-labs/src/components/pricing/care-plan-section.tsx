'use client';

/**
 * CarePlanSection Component
 * --------------------------
 * Highlight section for the mandatory Care Plan retainer.
 */

import { Shield, Cloud, Clock, Headphones, FileCheck, Wrench } from 'lucide-react';
import type { CarePlan } from '@/data/pricing';

interface CarePlanSectionProps {
  plan: CarePlan;
  currency: 'php' | 'usd';
}

const featureIcons = [Shield, Cloud, Clock, FileCheck, Headphones, Wrench];

export function CarePlanSection({ plan, currency }: CarePlanSectionProps) {
  const price = plan.monthlyPrice[currency];
  const currencySymbol = currency === 'php' ? '₱' : '$';

  return (
    <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 p-8">
      {/* Background decoration */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid gap-8 md:grid-cols-2">
        {/* Left: Content */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5">
            <Shield className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              Included with all plans
            </span>
          </div>

          <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
          <p className="mt-1 text-lg text-white/50">{plan.tagline}</p>

          <p className="mt-4 text-white/60 leading-relaxed">{plan.description}</p>

          <div className="mt-6">
            <div className="text-sm text-white/40">Monthly rate after included period</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {currencySymbol}{price.min.toLocaleString()} - {currencySymbol}{price.max.toLocaleString()}
              </span>
              <span className="text-white/50">/month</span>
            </div>
          </div>
        </div>

        {/* Right: Features */}
        <div className="grid grid-cols-2 gap-4">
          {plan.features.map((feature, idx) => {
            const Icon = featureIcons[idx] || Shield;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-md border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="rounded-md bg-white/5 p-2">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-sm text-white/70">{feature}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CarePlanSection;
