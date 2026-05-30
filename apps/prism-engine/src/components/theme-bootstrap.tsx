"use client";

/**
 * ThemeBootstrap
 * --------------
 * Renders an inline <script> that:
 * 1. Reads the user's saved theme from localStorage ("theme" key — same as next-themes default)
 * 2. Applies data-theme attribute to <html> before React hydrates (no flash)
 * 3. Syncs data-theme → .theme-light class so the shared CSS selectors work correctly
 *
 * next-themes automatically reads the same localStorage key for its own state.
 */

export function ThemeBootstrap() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(() => {
  try {
    const root = document.documentElement;
    const key = 'theme';
    const stored = localStorage.getItem(key);
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = (stored === 'light' || stored === 'dark' || stored === 'theme-light')
      ? (stored === 'theme-light' ? 'theme-light' : stored)
      : prefersLight ? 'theme-light' : 'dark';

    // Apply class for next-themes
    if (theme === 'theme-light' || theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('theme-light');
    }
  } catch (e) {
    // Silently fail — next-themes handles fallback
  }
})();`,
      }}
    />
  );
}
