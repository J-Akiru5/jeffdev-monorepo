'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type CurrencyCode,
  DEFAULT_EXCHANGE_RATE,
  formatPrice as formatPriceUtil,
  formatPriceRange as formatPriceRangeUtil,
  getCurrencyFromCookie,
} from '@/lib/currency';

interface CurrencyContextValue {
  /** Current currency code */
  currency: CurrencyCode;
  /** Exchange rate: 1 USD = X PHP */
  exchangeRate: number;
  /** Whether the exchange rate is still loading */
  isLoading: boolean;
  /** Format a PHP amount in the current currency */
  formatPrice: (phpAmount: number, options?: { compact?: boolean }) => string;
  /** Format a price range in the current currency */
  formatPriceRange: (minPhp: number, maxPhp: number | null) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/**
 * Currency Provider
 * -----------------
 * Provides currency context to all child components.
 * Reads the currency cookie set by middleware and fetches live exchange rate.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read currency from cookie
    const cookies = document.cookie.split(';');
    const currencyCookie = cookies.find((c) => c.trim().startsWith('currency='));
    const cookieValue = currencyCookie?.split('=')[1]?.trim();
    const detectedCurrency = getCurrencyFromCookie(cookieValue);
    setCurrency(detectedCurrency);

    // Fetch live exchange rate
    const fetchRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        // Keep default rate on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRate();
  }, []);

  const formatPrice = (phpAmount: number, options?: { compact?: boolean }) => {
    return formatPriceUtil(phpAmount, currency, exchangeRate, options);
  };

  const formatPriceRange = (minPhp: number, maxPhp: number | null) => {
    return formatPriceRangeUtil(minPhp, maxPhp, currency, exchangeRate);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        exchangeRate,
        isLoading,
        formatPrice,
        formatPriceRange,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to access currency context
 */
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
