/**
 * Currency Utilities
 * ------------------
 * Core functions for currency formatting and conversion.
 * All base prices are stored in PHP and converted to USD when needed.
 */

export type CurrencyCode = 'PHP' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PHP: { code: 'PHP', symbol: '₱', locale: 'en-PH' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
};

/**
 * Default exchange rate (1 USD = X PHP)
 * Used as fallback when API is unavailable
 */
export const DEFAULT_EXCHANGE_RATE = 56.0;

/**
 * Round USD prices to clean numbers for professional appearance
 * - < $10,000: round to nearest $10
 * - >= $10,000: round to nearest $100
 */
function roundUSD(amount: number): number {
  if (amount >= 10000) {
    return Math.round(amount / 100) * 100;
  }
  return Math.round(amount / 10) * 10;
}

/**
 * Format a price in the specified currency
 *
 * @param phpAmount - The base price in PHP
 * @param currency - Target currency code ('PHP' | 'USD')
 * @param exchangeRate - 1 USD = X PHP (e.g., 56.0)
 * @param options - Additional formatting options
 * @returns Formatted price string (e.g., "₱75,000" or "$1,340")
 */
export function formatPrice(
  phpAmount: number,
  currency: CurrencyCode = 'PHP',
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
  options: { showSymbol?: boolean; compact?: boolean } = {}
): string {
  const { showSymbol = true, compact = false } = options;
  const config = CURRENCIES[currency];

  let amount: number;
  if (currency === 'PHP') {
    amount = phpAmount;
  } else {
    // Convert PHP to USD and round
    amount = roundUSD(phpAmount / exchangeRate);
  }

  // Format the number
  let formatted: string;
  if (compact && amount >= 1000) {
    // Compact format: 75K, 150K, etc.
    const suffix = amount >= 1000000 ? 'M' : 'K';
    const divisor = amount >= 1000000 ? 1000000 : 1000;
    const value = amount / divisor;
    formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
    formatted += suffix;
  } else {
    // Full format with locale-specific separators
    formatted = amount.toLocaleString(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  return showSymbol ? `${config.symbol}${formatted}` : formatted;
}

/**
 * Format a price range (e.g., "₱50K – ₱100K" or "$890 – $1,780")
 */
export function formatPriceRange(
  minPhp: number,
  maxPhp: number | null,
  currency: CurrencyCode = 'PHP',
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): string {
  const min = formatPrice(minPhp, currency, exchangeRate, { compact: true });

  if (maxPhp === null) {
    return `${min}+`;
  }

  const max = formatPrice(maxPhp, currency, exchangeRate, { compact: true });
  return `${min} – ${max}`;
}

/**
 * Get currency code from cookie value
 */
export function getCurrencyFromCookie(cookieValue: string | undefined): CurrencyCode {
  if (cookieValue === 'PHP' || cookieValue === 'USD') {
    return cookieValue;
  }
  return 'USD'; // Default to USD for international visitors
}
