import { NextResponse } from 'next/server';

/**
 * Exchange Rate API Route
 * -----------------------
 * Fetches live USD/PHP exchange rate from ExchangeRate-API.
 * Cached for 1 hour using Next.js ISR.
 */

interface ExchangeRateResponse {
  result: string;
  conversion_rates: {
    PHP: number;
    USD: number;
  };
}

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!apiKey) {
      // Fallback to a reasonable default if API key is missing
      return NextResponse.json({
        rate: 56.0,
        updatedAt: new Date().toISOString(),
        source: 'fallback',
      });
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      { next: { revalidate: 3600 } } // ISR: revalidate every hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data: ExchangeRateResponse = await response.json();

    return NextResponse.json({
      rate: data.conversion_rates.PHP, // 1 USD = X PHP
      updatedAt: new Date().toISOString(),
      source: 'exchangerate-api',
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);

    // Return fallback rate on error
    return NextResponse.json({
      rate: 56.0,
      updatedAt: new Date().toISOString(),
      source: 'fallback',
    });
  }
}
