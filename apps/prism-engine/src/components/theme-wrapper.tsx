"use client";

/**
 * ThemeWrapper
 * ------------
 * Client component that wraps prism-engine with next-themes ThemeProvider.
 * Uses the same config as the other apps:
 * - attribute="data-theme"
 * - defaultTheme="dark" (prism-engine's design is dark-first)
 * - enableSystem={true}
 * - value map — "light" → "theme-light", "dark" → "dark"
 */

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem={true}
      value={{ dark: "dark", light: "theme-light" }}
    >
      {children}
    </ThemeProvider>
  );
}
