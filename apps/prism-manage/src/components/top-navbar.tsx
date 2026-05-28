"use client";

/**
 * TopNavbar
 * ---------
 * Fixed top navigation bar with three distinct zones:
 *   Zone 1 (Left)  — Brand & context switcher
 *   Zone 2 (Center) — Global search with ⌘K
 *   Zone 3 (Right)  — Quick add, notifications, user profile dropdown
 *
 * Also handles the ⌘K / Ctrl+K command palette keyboard shortcut.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { SyntaxureLogo, AccountDropdown } from "@syntaxure/ui";
import {
  Search,
  Plus,
  Bell,
  Building2,
  User,
  Check,
  ChevronDown,
  LayoutDashboard,
  Shield,
  Box,
  Sparkles,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";

// ──────────────────────────────────────────────
// Zone 1 Helpers — Workspace Switcher (Nav variant)
// ──────────────────────────────────────────────

function NavWorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (workspaces.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-glass-05 hover:text-text-primary"
      >
        <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
        <span className="max-w-[120px] truncate font-medium">
          {active?.name || "Workspace"}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-text-quiet transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-elevated py-1 shadow-2xl">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "text-text-primary"
                    : "text-text-tertiary hover:bg-glass-05 hover:text-text-primary"
                }`}
              >
                {ws.name === "Personal" ? (
                  <User className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Building2 className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                )}
                <span className="flex-1 truncate text-left">{ws.name}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Zone 3 Helpers — Unified Account Dropdown
// ──────────────────────────────────────────────

function AccountMenu() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();
  const [name, setName] = useState("User");
  const [role, setRole] = useState("");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email || undefined);
        setName(
          (data.user.user_metadata as Record<string, unknown> | undefined)
            ?.full_name as string | undefined ||
            data.user.email?.split("@")[0] ||
            "User"
        );
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (userId) {
      supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setRole((data as { role?: string }).role || "");
        });
    }
  }, [userId, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  const initials = name.charAt(0).toUpperCase();

  const appLinks = [
    {
      label: "Manage",
      href: process.env.NEXT_PUBLIC_MANAGE_URL || "http://localhost:3007",
      shortLabel: "Mgmt",
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
    },
    {
      label: "Admin",
      href: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004",
      shortLabel: "Admin",
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    {
      label: "Engine",
      href: process.env.NEXT_PUBLIC_PRISM_URL || "http://localhost:3001",
      shortLabel: "Engine",
      icon: <Box className="h-3.5 w-3.5" />,
    },
    {
      label: "Syntaxure Labs",
      href: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      shortLabel: "Labs",
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <AccountDropdown
      initials={initials}
      email={email}
      displayName={name}
      role={role || undefined}
      settingsHref="/settings"
      appLinks={appLinks}
      theme={theme as "dark" | "light" | undefined}
      onToggleTheme={() => setTheme(theme === "dark" ? "theme-light" : "dark")}
      onSignOut={handleSignOut}
    />
  );
}

// ──────────────────────────────────────────────
// Main TopNavbar
// ──────────────────────────────────────────────

export function TopNavbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full items-center justify-between px-4">
          {/* ── Zone 1: Brand & Context (Left) ── */}
          <div className="flex items-center gap-3">
            {/* App Branding */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <SyntaxureLogo className="h-7 w-7 flex-shrink-0" />
              <span className="hidden text-sm font-semibold text-text-primary sm:inline">
                Prism Manage
              </span>
            </Link>

            {/* Context Switcher */}
            <div className="hidden sm:block">
              <NavWorkspaceSwitcher />
            </div>
          </div>

          {/* ── Zone 2: Command Center (Center) ── */}
          <div className="hidden flex-1 justify-center md:flex lg:max-w-md xl:max-w-lg">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <button
                onClick={openPalette}
                className="w-full cursor-pointer rounded-lg border border-border bg-glass-05 py-2 pl-9 pr-16 text-left text-sm text-text-muted transition-all hover:border-border-active"
                title="Command palette (⌘K)"
              >
                <span>Search tasks, projects...</span>
              </button>
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-glass-08 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* ── Zone 3: Utility & Identity (Right) ── */}
          <div className="flex items-center gap-1">
            {/* Quick Add Button */}
            <Link
              href="/tasks/new"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-white shadow-sm shadow-cyan-500/20 transition-all hover:bg-cyan-400 active:scale-95"
              title="Create task"
            >
              <Plus className="h-4 w-4" />
            </Link>

            {/* Notifications Bell */}
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-glass-05 hover:text-text-primary"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
            </button>

            {/* User Profile */}
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </>
  );
}
