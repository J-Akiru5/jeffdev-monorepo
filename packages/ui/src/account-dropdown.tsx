"use client";

/**
 * AccountDropdown
 * ---------------
 * Unified account dropdown accessible from any app's top navbar.
 * Shares the same structure, styling, and cross-app links everywhere.
 *
 * Each app passes its own data (user info, sign-out handler, theme toggle)
 * via props — the dropdown UI stays consistent.
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "./utils";
import {
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AccountDropdownProps {
  /** Avatar initials (1-2 characters, required) */
  initials: string;
  /** User email */
  email?: string;
  /** User display name */
  displayName?: string;
  /** Role badge (e.g. "Founder", "Admin") */
  role?: string;
  /** Avatar image URL (overrides initials circle) */
  avatarUrl?: string | null;
  /** Profile page path */
  profileHref?: string;
  /** Settings page path */
  settingsHref: string;
  /** Whether to show the Settings link */
  showSettings?: boolean;
  /** Current theme */
  theme?: "dark" | "light";
  /** Theme toggle */
  onToggleTheme?: () => void;
  /** Sign out */
  onSignOut: () => void;
  /** Extra dropdown items rendered before Sign Out */
  extraActions?: ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AccountDropdown({
  initials,
  email,
  displayName,
  role,
  avatarUrl,
  profileHref,
  settingsHref,
  showSettings = true,
  theme,
  onToggleTheme,
  onSignOut,
  extraActions,
}: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDark = theme !== "light";

  return (
    <div className="relative z-50" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg transition-colors px-1.5 py-1",
          "hover:bg-[var(--border-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
          open && "bg-[var(--border-subtle)]",
        )}
        title={displayName || email || "Account"}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || "User"}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-cyan-500/20"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 text-[11px] font-semibold text-cyan-400">
            {initials}
          </div>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-ink)] opacity-60" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            className={cn(
              "absolute right-0 top-full z-[200] mt-1.5 w-64 origin-top-right",
              "rounded-xl glass-heavy",
              "shadow-2xl shadow-black/50 py-1",
            )}
          >
            {/* ── Header: User info ── */}
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="block border-b border-[var(--border-subtle)] px-4 py-3 hover:bg-[var(--border-subtle)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "User"}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-500/20"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 text-sm font-semibold text-cyan-400 ring-2 ring-cyan-500/10">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {displayName && (
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {displayName}
                      </p>
                    )}
                    <p className="truncate text-xs text-[var(--color-ink)] opacity-50">
                      {email || "Signed in"}
                    </p>
                  </div>
                </div>
                {role && (
                  <div className="mt-2">
                    <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                      {role}
                    </span>
                  </div>
                )}
              </Link>
            ) : (
              <div className="border-b border-[var(--border-subtle)] px-4 py-3">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "User"}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-500/20"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 text-sm font-semibold text-cyan-400 ring-2 ring-cyan-500/10">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {displayName && (
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {displayName}
                      </p>
                    )}
                    <p className="truncate text-xs text-[var(--color-ink)] opacity-50">
                      {email || "Signed in"}
                    </p>
                  </div>
                </div>
                {role && (
                  <div className="mt-2">
                    <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                      {role}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Actions ── */}
            <div className="px-2 py-1">
              {/* Theme toggle */}
              {onToggleTheme && (
                <button
                  onClick={() => {
                    onToggleTheme();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--color-ink)] opacity-75 transition-all hover:bg-[var(--border-subtle)] hover:opacity-100"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>
              )}

              {/* Settings */}
              {showSettings && (
                <Link
                  href={settingsHref}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--color-ink)] opacity-75 transition-all hover:bg-[var(--border-subtle)] hover:opacity-100"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              )}

              {/* Extra actions from the app */}
              {extraActions}
            </div>

            {/* ── Sign out ── */}
            <div className="border-t border-[var(--border-subtle)] px-2 py-1">
              <button
                onClick={() => {
                  onSignOut();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--color-ink)] opacity-75 transition-all hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
