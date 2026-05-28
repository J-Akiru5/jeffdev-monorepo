"use client";

/**
 * ThemeWrapper
 * ------------
 * Client component that wraps syntaxure-labs with next-themes ThemeProvider.
 * Must be a client component because next-themes uses React context and hooks.
 *
 * Configuration matches prism-admin:
 * - attribute="data-theme" — sets data-theme on <html>
 * - defaultTheme="dark" — dark is the default (no class/attribute needed)
 * - enableSystem={true} — follow OS preference
 * - value map — "light" → "theme-light" class value, "dark" → "dark"
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
