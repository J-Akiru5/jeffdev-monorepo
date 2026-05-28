"use client";

/**
 * ThemeBootstrap
 * --------------
 * Renders an inline <script> that:
 * 1. Reads the user's saved theme from localStorage (same key as next-themes uses)
 * 2. Applies data-theme attribute to <html> before React hydrates (no flash)
 * 3. Syncs data-theme → .theme-light class so the shared @syntaxure/ui/styles.css
 *    class-based selectors (.theme-light .text-white, etc.) work correctly.
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
    const key = 'syntaxure-theme';
    const stored = localStorage.getItem(key);
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersLight ? 'light' : 'dark';

    // Apply data-theme — next-themes reads this on mount
    root.setAttribute('data-theme', theme === 'light' ? 'theme-light' : 'dark');

    // Sync class for shared CSS selectors (.theme-light .xxx)
    root.classList.toggle('theme-light', theme === 'light');

    // Watch for data-theme changes from next-themes and sync class
    const observer = new MutationObserver(() => {
      const current = root.getAttribute('data-theme');
      root.classList.toggle('theme-light', current === 'theme-light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {
    // Silently fail — next-themes handles fallback
  }
})();`,
      }}
    />
  );
}
