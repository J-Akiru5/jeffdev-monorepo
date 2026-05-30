"use client";

/**
 * ThemeToggle
 * -----------
 * Client component that renders a Sun/Moon icon button to toggle between
 * light and dark themes. Uses next-themes internally.
 * Designed to be placed in sidebars and headers.
 */

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-white/5 hover:text-[var(--text-primary)]"
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? (
        <Moon className="h-4 w-4 transition-colors" />
      ) : (
        <Sun className="h-4 w-4 transition-colors" />
      )}
      <span className="text-xs">{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}
