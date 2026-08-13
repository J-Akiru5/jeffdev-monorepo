"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type CurrencyCode,
  DEFAULT_EXCHANGE_RATE,
  formatPrice as formatPriceUtil,
  formatPriceRange as formatPriceRangeUtil,
} from "@/lib/currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  exchangeRate: number;
  isLoading: boolean;
  formatPrice: (phpAmount: number, options?: { compact?: boolean }) => string;
  formatPriceRange: (minPhp: number, maxPhp: number | null) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

interface CurrencyProviderProps {
  children: ReactNode;
  /** Detected server-side from cookie + Accept-Language header */
  initialCurrency: CurrencyCode;
}

/**
 * Currency Provider
 * -----------------
 * Provides currency context to all child components.
 * Takes the initial currency from the server-side layout (which reads
 * the cookie + Accept-Language header), then fetches the live exchange rate.
 *
 * This avoids relying on middleware/proxy for currency detection —
 * the correct currency is known from the very first SSR render.
 */
export function CurrencyProvider({
  children,
  initialCurrency,
}: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch live exchange rate
    const fetchRate = async () => {
      try {
        const response = await fetch("/api/exchange-rate");
        const data = await response.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
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

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
