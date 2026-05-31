"use client";

/**
 * AppTopNavbar
 * ------------
 * Shared top navigation bar for all Syntaxure apps.
 * Styled using CSS custom properties (Engine design tokens) for
 * consistent theming across light/dark mode.
 *
 * Provides:
 *   - Syntaxure Labs branding (logo)
 *   - App switcher dropdown (switch between Labs / Manage / Admin / Engine)
 *   - Left slot for app-specific extras (e.g. workspace switcher)
 *   - Center slot for search / command palette
 *   - Inline theme toggle (sun/moon icon)
 *   - Right slot for notifications, account dropdown, quick actions
 *
 * Each app customises via props; the layout and look stay consistent.
 *
 * Usage:
 *   <AppTopNavbar
 *     appName="Prism Manage"
 *     appLinks={[
 *       { label: "Manage", href: "http://localhost:3007", shortLabel: "Mgmt", icon: <LayoutDashboard /> },
 *       { label: "Admin",  href: "http://localhost:3004", shortLabel: "Admin", icon: <Shield /> },
 *     ]}
 *     theme={theme as "dark" | "light"}
 *     onToggleTheme={() => setTheme(...)}
 *     onSearchClick={openPalette}
 *     notifications={<NotificationBell />}
 *     accountDropdown={<AccountDropdown ... />}
 *   />
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "./utils";
import { SyntaxureLogo } from "./logo";
import { RealtimeClock } from "./realtime-clock";
import { Search, ChevronDown, ExternalLink, Menu, X, Sun, Moon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppNavLink {
  label: string;
  href: string;
  /** Shown on the right edge (e.g. "Mgmt", "Admin") */
  shortLabel?: string;
  /** Icon element */
  icon?: ReactNode;
}

export interface AppTopNavbarProps {
  /** Name of the current app (e.g. "Prism Manage", "Admin") */
  appName: string;
  /** Cross-app quick links (shown in the app switcher dropdown) */
  appLinks?: AppNavLink[];
  /** Optional app icon override (defaults to a small diamond badge) */
  appIcon?: ReactNode;
  /** Current app href for the app switcher current indicator */
  currentAppHref?: string;

  // ── Theme Toggle (inline, Engine-style) ──
  /** Current theme for the inline toggle icon */
  theme?: "dark" | "light";
  /** Called when the inline theme toggle is clicked */
  onToggleTheme?: () => void;

  // ── Search ──
  /** Show the search bar (default: true) */
  showSearch?: boolean;
  /** Placeholder text for search (default: "Search...") */
  searchPlaceholder?: string;
  /** Called when search bar or ⌘K shortcut is clicked */
  onSearchClick?: () => void;
  /** Keyboard shortcut hint (default: "⌘K") */
  searchShortcut?: string;

  // ── Slots ──
  /** Extra content rendered to the right of the app switcher (e.g. workspace switcher) */
  leftSlot?: ReactNode;
  /** Custom center content (replaces search bar if provided) */
  centerSlot?: ReactNode;
  /** Notification bell / popover */
  notifications?: ReactNode;
  /** Account dropdown component */
  accountDropdown?: ReactNode;
  /** Extra buttons rendered before notifications (e.g. quick-add) */
  rightExtra?: ReactNode;

  // ── Mobile ──
  /** Custom mobile menu content */
  mobileMenu?: ReactNode;

  // ── Clock ──
  /** Show a real-time HH:MM clock in the right zone (default: true) */
  showClock?: boolean;

  // ── Theming ──
  /** Additional classnames on the outer <header> */
  className?: string;
  /** Additional classnames on the inner container */
  innerClassName?: string;
}

// ─── App Switcher Dropdown ───────────────────────────────────────────────────

function AppSwitcher({
  appName,
  appLinks = [],
  appIcon,
}: {
  appName: string;
  appLinks?: AppNavLink[];
  appIcon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appLinks.length === 0) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [appLinks]);

  if (appLinks.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-primary)]">
        {appIcon}
        <span className="font-semibold">{appName}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
          "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
        )}
        aria-label="Switch app"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {appIcon}
          <span className="font-medium">{appName}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-full z-50 mt-1.5 w-52 origin-top-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl py-1 shadow-2xl shadow-black/50">
            <p className="px-3 pb-1 pt-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              Switch App
            </p>
            {appLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  link.label === appName
                    ? "bg-[var(--border-subtle)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
                )}
              >
                {link.icon || <ExternalLink className="h-3.5 w-3.5" />}
                <span className="flex-1">{link.label}</span>
                {link.shortLabel && (
                  <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">
                    {link.shortLabel}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Inline Theme Toggle (Engine-style) ──────────────────────────────────────

function InlineThemeToggle({
  theme,
  onToggle,
}: {
  theme?: "dark" | "light";
  onToggle?: () => void;
}) {
  if (!onToggle) return null;

  const isDark = theme !== "light";

  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AppTopNavbar({
  appName,
  appLinks = [],
  appIcon,
  theme,
  onToggleTheme,
  showSearch = true,
  searchPlaceholder = "Search...",
  searchShortcut = "⌘K",
  onSearchClick,
  leftSlot,
  centerSlot,
  showClock = true,
  notifications,
  accountDropdown,
  rightExtra,
  mobileMenu,
  className,
  innerClassName,
}: AppTopNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14 border-b backdrop-blur-xl",
        "border-[var(--border-subtle)] bg-[var(--bg-primary)]/80",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-full items-center justify-between px-4",
          innerClassName,
        )}
      >
        {/* ── Left Zone: Brand + App Switcher + Extra ── */}
        <div className="flex items-center gap-3">
          {/* Syntaxure Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <SyntaxureLogo className="h-7 w-7" />
            <span className="hidden text-sm font-semibold text-[var(--text-primary)] sm:inline">
              Syntaxure
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-[var(--border-subtle)] sm:block" />

          {/* App Switcher */}
          <AppSwitcher
            appName={appName}
            appLinks={appLinks}
            appIcon={appIcon}
          />

          {/* Extra left content (workspace switcher etc.) */}
          {leftSlot && (
            <>
              <div className="hidden h-5 w-px bg-[var(--border-subtle)] sm:block" />
              <div className="hidden sm:block">{leftSlot}</div>
            </>
          )}
        </div>

        {/* ── Center Zone: Search / Custom ── */}
        <div className="hidden flex-1 justify-center md:flex lg:max-w-md xl:max-w-lg">
          {centerSlot ? (
            centerSlot
          ) : showSearch && onSearchClick ? (
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <button
                onClick={onSearchClick}
                className="w-full cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 py-2 pl-9 pr-16 text-left text-sm text-[var(--text-tertiary)] transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)]/60"
              >
                <span>{searchPlaceholder}</span>
              </button>
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
                {searchShortcut}
              </kbd>
            </div>
          ) : null}
        </div>

        {/* ── Right Zone: Actions + Account ── */}
        <div className="flex items-center gap-1">
          {/* Extra right buttons (quick-add etc.) */}
          {rightExtra}

          {/* Realtime Clock */}
          {showClock && (
            <RealtimeClock />
          )}

          {/* Inline Theme Toggle (Engine-style) */}
          <InlineThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Notifications */}
          {notifications}

          {/* Account Dropdown */}
          {accountDropdown}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-3">
            {/* Search on mobile */}
            {showSearch && onSearchClick && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onSearchClick();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/40 px-3 py-2.5 text-sm text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-active)]"
              >
                <Search className="h-4 w-4" />
                <span>{searchPlaceholder}</span>
              </button>
            )}

            {/* Mobile app links */}
            <div className="pt-2">
              <p className="px-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                Apps
              </p>
              {appLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm transition-colors",
                    link.label === appName
                      ? "bg-[var(--border-subtle)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {link.icon || <ExternalLink className="h-4 w-4" />}
                  <span className="flex-1">{link.label}</span>
                  {link.shortLabel && (
                    <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">
                      {link.shortLabel}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Custom mobile content */}
            {mobileMenu}
          </div>
        </div>
      )}
    </header>
  );
}
