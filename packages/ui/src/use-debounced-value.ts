"use client";

import { useState, useEffect } from "react";

/**
 * `useDebouncedValue`
 *
 * Returns a debounced version of the input value.
 * The returned value only updates after the specified delay
 * has elapsed since the last change to `value`.
 *
 * Useful for delaying search queries until the user stops typing.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebouncedValue(query, 300);
 * // use debouncedQuery for API calls/URL sync
 * ```
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
