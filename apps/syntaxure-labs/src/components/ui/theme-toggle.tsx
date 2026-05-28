"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@syntaxure/ui";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark" || resolvedTheme === undefined;
  const isReady = resolvedTheme !== undefined;
  const nextThemeLabel = isDark ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "theme-light" : "dark")}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs uppercase tracking-wider transition-all duration-200",
        "border-white/10 bg-white/5 text-white/70",
        "hover:border-white/20 hover:text-white hover:bg-white/[0.08]",
        !isReady && "opacity-0 pointer-events-none",
        className,
      )}
      aria-label={isReady ? `Switch to ${nextThemeLabel} mode` : "Theme toggle"}
      title={isReady ? `Switch to ${nextThemeLabel} mode` : ""}
    >
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-300",
            !isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
      <span className="hidden text-[10px] font-mono sm:inline">
        {nextThemeLabel}
      </span>
    </button>
  );
}

export default ThemeToggle;
