"use client";

/**
 * ThemeDefaultSyncClient
 * -----------------------
 * Wires the shared ThemeDefaultSync component with prism-manage's
 * Supabase browser client so the cross-app default theme is applied
 * consistently across all pages.
 */

import { ThemeDefaultSync } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";

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

export function ThemeDefaultSyncClient() {
  return <ThemeDefaultSync getDefaultTheme={getDefaultTheme} />;
}
