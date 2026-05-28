"use client";

/**
 * ThemeDefaultSync
 * -----------------
 * Client component that applies the cross-app default theme from
 * `user_profiles.preferences.default_theme` on mount.
 *
 * Each app passes a `getDefaultTheme` function that encapsulates how to read
 * the value from Supabase — this avoids coupling the shared component
 * to any particular Supabase client setup.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <ThemeDefaultSync
 *     getDefaultTheme={async () => {
 *       const supabase = createClient();
 *       const { data: { user } } = await supabase.auth.getUser();
 *       if (!user) return null;
 *       const { data } = await supabase
 *         .from("user_profiles")
 *         .select("preferences")
 *         .eq("id", user.id)
 *         .single();
 *       const prefs = data?.preferences as Record<string, unknown> | undefined;
 *       return (prefs?.default_theme as string) ?? null;
 *     }}
 *   />
 *   {children}
 * </ThemeProvider>
 * ```
 */

import { useEffect } from "react";
import { useTheme } from "next-themes";

interface ThemeDefaultSyncProps {
  /**
   * Async function that returns the user's default theme preference
   * ("dark", "light", "system") or null/undefined if not set.
   * Called once on mount.
   */
  getDefaultTheme?: () => Promise<string | null | undefined>;
}

export function ThemeDefaultSync({ getDefaultTheme }: ThemeDefaultSyncProps) {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (!getDefaultTheme) return;

    getDefaultTheme().then((defaultTheme) => {
      if (
        defaultTheme &&
        defaultTheme !== theme &&
        (defaultTheme === "dark" ||
          defaultTheme === "light" ||
          defaultTheme === "system")
      ) {
        setTheme(defaultTheme);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

