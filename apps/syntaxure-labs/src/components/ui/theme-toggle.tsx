"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@syntaxure/ui";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = resolvedTheme === "light";

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "group relative inline-flex items-center gap-2 overflow-hidden rounded-md border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm",
          "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)]",
          className,
        )}
        aria-hidden="true"
      >
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        </span>
        <span className="hidden text-[10px] font-mono sm:inline opacity-0">
          Theme
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={cn(
        "group relative inline-flex items-center gap-2 overflow-hidden rounded-md border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm",
        "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)]",
        "hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
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
