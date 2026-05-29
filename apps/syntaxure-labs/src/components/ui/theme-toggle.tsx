"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@syntaxure/ui";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const isLight = theme === "theme-light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "theme-light")}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs uppercase tracking-wider transition-all duration-200",
        "border-white/10 bg-white/5 text-white/70",
        "hover:border-white/20 hover:text-white hover:bg-white/[0.08]",
        className,
      )}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-300",
            isLight
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 transition-all duration-300",
            !isLight
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
      <span className="hidden text-[10px] font-mono sm:inline">
        {isLight ? "Dark" : "Light"}
      </span>
    </button>
  );
}

export default ThemeToggle;
