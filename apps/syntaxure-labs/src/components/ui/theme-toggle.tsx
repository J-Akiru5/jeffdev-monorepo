'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';

const storageKey = 'syntaxure-theme';
const lightClass = 'theme-light';

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
};

const resolveStoredTheme = (): ThemeMode => {
  const stored = localStorage.getItem(storageKey);
  if (stored === 'light' || stored === 'dark') return stored;
  return getPreferredTheme();
};

const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.classList.toggle(lightClass, theme === 'light');
  root.dataset.theme = theme;
};

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode | null>(null);

  // Synchronise with localStorage — the inline bootstrap script in layout.tsx
  // already applied the correct class before React hydrates, so there is no flash.
  useEffect(() => {
    const initialTheme = resolveStoredTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark') return;
      const osTheme: ThemeMode = mql.matches ? 'light' : 'dark';
      setTheme(osTheme);
      applyTheme(osTheme);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (!prev) return prev;
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(storageKey, next);
      applyTheme(next);
      return next;
    });
  }, []);

  const isReady = theme !== null;
  const nextThemeLabel = theme === 'light' ? 'Dark' : 'Light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'group inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs uppercase tracking-wider transition-all duration-200',
        'border-white/10 bg-white/5 text-white/70',
        'hover:border-white/20 hover:text-white hover:bg-white/[0.08]',
        !isReady && 'opacity-0 pointer-events-none',
        className
      )}
      aria-label={isReady ? `Switch to ${nextThemeLabel} mode` : 'Theme toggle'}
      title={isReady ? `Switch to ${nextThemeLabel} mode` : ''}
    >
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <Sun
          className={cn(
            'absolute h-3.5 w-3.5 transition-all duration-300',
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
          )}
        />
        <Moon
          className={cn(
            'absolute h-3.5 w-3.5 transition-all duration-300',
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
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
