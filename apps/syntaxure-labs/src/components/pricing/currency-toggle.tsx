'use client';

/**
 * CurrencyToggle Component
 * -------------------------
 * Toggle between PHP and USD currency display.
 */

import { cn } from '@/lib/utils';

interface CurrencyToggleProps {
  currency: 'php' | 'usd';
  onChange: (currency: 'php' | 'usd') => void;
}

export function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-white/10 bg-white/5 p-1">
      <button
        onClick={() => onChange('php')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-all',
          currency === 'php'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-white/50 hover:text-white'
        )}
      >
        PHP ₱
      </button>
      <button
        onClick={() => onChange('usd')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-all',
          currency === 'usd'
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-white/50 hover:text-white'
        )}
      >
        USD $
      </button>
    </div>
  );
}

export default CurrencyToggle;
