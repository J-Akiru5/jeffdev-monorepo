"use client";

/**
 * ThemeDefaultSync (Labs)
 * ------------------------
 * Wires the shared ThemeDefaultSync component with syntaxure-labs'
 * Supabase browser client so the cross-app default theme is applied
 * on the admin layout.
 *
 * Uses `respectLocalOverride` — if the user has already toggled their
 * theme manually, the server default won't override their choice.
 */

import { ThemeDefaultSync as SharedThemeDefaultSync } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";

function getDefaultTheme(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return Promise.resolve(null);

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
        const defaultTheme = prefs.default_theme as string | undefined;
        if (
          !defaultTheme ||
          (defaultTheme !== "dark" &&
            defaultTheme !== "light" &&
            defaultTheme !== "system")
        ) {
          return null;
        }
        return defaultTheme;
      });
  });
}

export function ThemeDefaultSync() {
  return <SharedThemeDefaultSync getDefaultTheme={getDefaultTheme} respectLocalOverride />;
}
