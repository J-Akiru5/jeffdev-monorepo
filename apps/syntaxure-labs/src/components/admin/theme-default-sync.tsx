"use client";

/**
 * ThemeDefaultSync (Labs)
 * ------------------------
 * Client component that reads the user's `preferences.default_theme` from
 * Supabase `user_profiles` on mount and applies it via next-themes.
 *
 * Only applies the default if the user has NOT already set a local theme
 * preference — respects the user's prior manual choice.
 *
 * This allows prism-manage to set a cross-app default theme that Labs will
 * pick up on first visit or when no local preference exists.
 */

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/browser";

const storageKey = "syntaxure-theme";

export function ThemeDefaultSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Only apply the default if the user hasn't set a local preference
    const localPref = localStorage.getItem(storageKey);
    if (localPref === "light" || localPref === "dark") return;

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      supabase
        .from("user_profiles")
        .select("preferences")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (!data?.preferences) return;

          const prefs = data.preferences as Record<string, unknown>;
          const defaultTheme = prefs.default_theme as string | undefined;

          if (
            !defaultTheme ||
            (defaultTheme !== "dark" && defaultTheme !== "light")
          )
            return;

          // Use next-themes to apply the default theme
          setTheme(defaultTheme === "light" ? "theme-light" : "dark");
        });
    });
  }, [setTheme]);

  return null;
}
