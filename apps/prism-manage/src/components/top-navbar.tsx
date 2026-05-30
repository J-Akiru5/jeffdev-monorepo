"use client";

/**
 * TopNavbar
 * ---------
 * Fixed top navigation bar that wraps the shared AppTopNavbar from @syntaxure/ui.
 * Provides prism-manage-specific wiring: workspace switcher, command palette,
 * notifications, quick-add, and account dropdown.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { AppTopNavbar, AccountDropdown, useAuth, type AppNavLink } from "@syntaxure/ui";
import {
  Plus,
  Bell,
  LayoutDashboard,
  Shield,
  Box,
  Sparkles,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

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

function NotificationBell() {
  return (
    <button
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      title="Notifications (coming soon)"
    >
      <Bell className="h-4 w-4" />
    </button>
  );
}

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

export function TopNavbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);

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
        leftSlot={<WorkspaceSwitcher />}
        rightExtra={<QuickAddButton />}
        notifications={<NotificationBell />}
        accountDropdown={<AccountMenu />}
      />
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </>
  );
}
