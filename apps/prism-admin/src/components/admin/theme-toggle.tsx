"use client";

/**
 * ThemeToggle
 * -----------
 * Theme toggle button for the prism-admin sidebar.
 * Only appears when the app is wrapped with ThemeProvider (next-themes).
 * Uses the AccountDropdown's existing toggle flow, plus a direct button in sidebar footer.
 */

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
