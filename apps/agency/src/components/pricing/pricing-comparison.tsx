'use client';

/**
 * PricingComparison Component
 * ----------------------------
 * Feature comparison table across all pricing tiers.
 */

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComparisonRow } from '@/data/pricing';

interface PricingComparisonProps {
  rows: ComparisonRow[];
}

export function PricingComparison({ rows }: PricingComparisonProps) {
  const tiers = ['starter', 'business', 'custom', 'enterprise'] as const;
  const tierLabels = {
    starter: 'Starter',
    business: 'Business',
    custom: 'Custom',
    enterprise: 'Enterprise',
  };

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="mx-auto h-5 w-5 text-emerald-400" />
      ) : (
        <X className="mx-auto h-5 w-5 text-white/20" />
      );
    }
    return <span className="text-sm text-white/70">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-4 text-left text-sm font-medium text-white/50">
              Features
            </th>
            {tiers.map((tier) => (
              <th
                key={tier}
                className={cn(
                  'py-4 text-center text-sm font-semibold',
                  tier === 'business' ? 'text-cyan-400' : 'text-white'
                )}
              >
                {tierLabels[tier]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={cn(
                'border-b border-white/5 transition-colors hover:bg-white/[0.02]',
                idx % 2 === 0 && 'bg-white/[0.01]'
              )}
            >
              <td className="py-4 text-sm text-white/70">{row.feature}</td>
              {tiers.map((tier) => (
                <td key={tier} className="py-4 text-center">
                  {renderCell(row[tier])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PricingComparison;
