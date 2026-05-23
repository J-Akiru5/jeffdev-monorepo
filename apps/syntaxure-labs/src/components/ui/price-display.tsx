'use client';

import { useCurrency } from '@/contexts/currency-context';

/**
 * Price Display Component
 * -----------------------
 * Client-side component that displays prices in the user's detected currency.
 * Handles both numeric PHP amounts and legacy string formats.
 */

interface PriceDisplayProps {
  /** Amount to display */
  amount: number | string;
  /** Source currency of the amount (default: PHP) */
  sourceCurrency?: 'PHP' | 'USD';
  /** Display style */
  variant?: 'default' | 'compact';
  /** Additional class names */
  className?: string;
}

/**
 * Parse a number string to extract the numeric value
 */
function parseAmount(value: string): number {
  const cleaned = value.replace(/[₱$,\s]/g, '');
  
  if (cleaned.toUpperCase().includes('K')) {
    const num = parseFloat(cleaned.replace(/[Kk]/g, ''));
    return num * 1000;
  }
  
  if (cleaned.toUpperCase().includes('M')) {
    const num = parseFloat(cleaned.replace(/[Mm]/g, ''));
    return num * 1000000;
  }
  
  return parseFloat(cleaned) || 0;
}

export function PriceDisplay({
  amount,
  sourceCurrency = 'PHP',
  variant = 'default',
  className = '',
}: PriceDisplayProps) {
  const { exchangeRate, formatPrice, isLoading } = useCurrency();

  // 1. Get numeric amount
  const numericAmount = typeof amount === 'number' ? amount : parseAmount(amount);

  // 2. Normalize to PHP (our base for formatPrice)
  let phpAmount = numericAmount;
  if (sourceCurrency === 'USD') {
    phpAmount = numericAmount * (exchangeRate || 56);
  }

  // Don't render if invalid
  if (!numericAmount && numericAmount !== 0) return null;

  // 3. Format (formatPrice handles PHP -> Target conversion)
  const formattedPrice = formatPrice(phpAmount, {
    compact: variant === 'compact',
  });

  return (
    <span className={className} data-loading={isLoading}>
      {formattedPrice}
    </span>
  );
}

/**
 * Price Range Display Component
 * -----------------------------
 * For displaying budget ranges like "$890 – $1,780"
 */
interface PriceRangeDisplayProps {
  /** Minimum price in PHP */
  minPhp: number;
  /** Maximum price in PHP (null for open-ended like "500K+") */
  maxPhp: number | null;
  /** Additional class names */
  className?: string;
}

export function PriceRangeDisplay({
  minPhp,
  maxPhp,
  className = '',
}: PriceRangeDisplayProps) {
  const { formatPriceRange, isLoading } = useCurrency();

  const formattedRange = formatPriceRange(minPhp, maxPhp);

  return (
    <span className={className} data-loading={isLoading}>
      {formattedRange}
    </span>
  );
}
