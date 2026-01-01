'use client';

import { Check } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/price-display';

/**
 * Service Investment Card (Client Component)
 * -------------------------------------------
 * Displays the investment info for a service with currency localization.
 * Wrapped in 'use client' to access the CurrencyContext.
 */

interface ServiceInvestmentCardProps {
  investment: {
    starting: string;
    timeline: string;
  };
  deliverables: string[];
}

export function ServiceInvestmentCard({
  investment,
  deliverables,
}: ServiceInvestmentCardProps) {
  return (
    <div className="rounded-md border border-white/8 bg-white/2 p-8">
      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
        Investment
      </h3>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">
          <PriceDisplay amount={investment.starting} />
        </span>
        <span className="text-white/50">starting</span>
      </div>
      <div className="mt-2 text-sm text-white/50">
        Timeline: {investment.timeline}
      </div>

      <div className="mt-8 border-t border-white/6 pt-8">
        <h4 className="font-mono text-xs uppercase tracking-wider text-white/40">
          Deliverables
        </h4>
        <ul className="mt-4 space-y-3">
          {deliverables.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm text-white/70"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
