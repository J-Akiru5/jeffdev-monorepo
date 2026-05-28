"use client";

/**
 * ThemeWrapper
 * ------------
 * Client component that wraps prism-admin with next-themes ThemeProvider.
 * Must be a client component because next-themes uses React context and hooks.
 * Also syncs the cross-app default theme from user_profiles.preferences.
 */

import { ThemeProvider } from "next-themes";
import { ThemeDefaultSync, AuthProvider } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ReactNode } from "react";

function getDefaultTheme() {
  const supabase = createClient();
  return supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return null;
    return supabase
      .from("user_profiles")
      .select("preferences")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data?.preferences) return null;
        const prefs = data.preferences as Record<string, unknown>;
        return (prefs.default_theme as string) ?? null;
      });
  });
}

export function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      value={{ dark: "dark", light: "theme-light" }}
    >
      <ThemeDefaultSync getDefaultTheme={getDefaultTheme} />
      <AuthProvider createClient={createClient}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
