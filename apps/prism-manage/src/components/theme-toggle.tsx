"use client";

/**
 * Theme Toggle
 * ------------
 * Sun/moon icon button that toggles between dark and light mode.
 * Uses next-themes' useTheme() hook.
 */

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "theme-light" : "dark")}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-tertiary transition-all hover:bg-glass-05 hover:text-text-primary"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 flex-shrink-0" />
      ) : (
        <Moon className="h-4 w-4 flex-shrink-0" />
      )}
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
