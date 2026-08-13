"use client";

import { useEffect } from "react";

/**
 * Currency Override
 * -----------------
 * Reads `?currency=USD` or `?currency=PHP` from the URL query string
 * and sets a `currency` cookie so the server-side layout picks it up.
 *
 * Usage: Visit http://localhost:3000/services?currency=USD to see dollar prices.
 *        Or http://localhost:3000/services?currency=PHP to see peso prices.
 *
 * The page reloads once to let the server-side detectCurrency() read the cookie.
 */
export function CurrencyOverride() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currency = params.get("currency");
    if (currency !== "PHP" && currency !== "USD") return;

    // Check if cookie already matches — prevents infinite reload loop
    const currentCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("currency="))
      ?.split("=")[1];

    if (currentCookie === currency) return;

    // Set cookie and reload for SSR to pick it up
    document.cookie = `currency=${currency}; path=/; max-age=3600; SameSite=Lax`;
    window.location.reload();
  }, []);

  return null;
}
