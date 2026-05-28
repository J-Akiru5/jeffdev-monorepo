"use client";

/**
 * TopNavbar
 * ---------
 * Fixed top navigation bar that wraps the shared AppTopNavbar from @syntaxure/ui.
 *
 * Keeps the same file name and export so layouts don't need changing.
 * Provides prism-manage-specific wiring: workspace switcher, command palette,
 * notifications, quick-add, and account dropdown.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { AppTopNavbar, AccountDropdown, useAuth, type AppNavLink } from "@syntaxure/ui";
import {
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
// Workspace Switcher (left slot)
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
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
        <span className="max-w-[120px] truncate font-medium">
          {active?.name || "Workspace"}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-white/10 bg-[#0a0a0a]/95 py-1 shadow-2xl backdrop-blur-xl">
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
                    ? "text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
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
// Account Dropdown (right slot)
// ──────────────────────────────────────────────

function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />;
  }

  const initials = (user?.full_name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <AccountDropdown
      initials={initials}
      email={user?.email}
      displayName={user?.full_name}
      role={user?.role}
      settingsHref="/settings"
      theme={theme as "dark" | "light" | undefined}
      onToggleTheme={() => setTheme(theme === "dark" ? "theme-light" : "dark")}
      onSignOut={handleSignOut}
    />
  );
}

// ──────────────────────────────────────────────
// Notification Bell
// ──────────────────────────────────────────────

function NotificationBell() {
  return (
    <button
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0a]" />
    </button>
  );
}

// ──────────────────────────────────────────────
// Quick Add Button
// ──────────────────────────────────────────────

function QuickAddButton() {
  return (
    <Link
      href="/tasks/new"
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-white shadow-sm shadow-cyan-500/20 transition-all hover:bg-cyan-400 active:scale-95"
      title="Create task"
    >
      <Plus className="h-4 w-4" />
    </Link>
  );
}

// ──────────────────────────────────────────────
// Cross-app links (for the AppTopNavbar switcher)
// ──────────────────────────────────────────────

const appNavLinks: AppNavLink[] = [
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
      <AppTopNavbar
        appName="Manage"
        appLinks={appNavLinks}
        searchPlaceholder="Search tasks, projects..."
        onSearchClick={openPalette}
        leftSlot={<NavWorkspaceSwitcher />}
        rightExtra={<QuickAddButton />}
        notifications={<NotificationBell />}
        accountDropdown={<AccountMenu />}
      />

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </>
  );
}
