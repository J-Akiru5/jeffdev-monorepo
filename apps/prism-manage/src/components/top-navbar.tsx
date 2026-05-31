"use client";

/**
 * TopNavbar
 * ---------
 * Fixed top navigation bar that wraps the shared AppTopNavbar from @syntaxure/ui.
 * Provides prism-manage-specific wiring: workspace switcher, command palette,
 * notifications, quick-add, and account dropdown.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  AppTopNavbar,
  AccountDropdown,
  useAuth,
  KeyboardShortcutsProvider,
  CommandPalette,
  KeyboardShortcutsHelp,
  type AppNavLink,
  type CommandPaletteSection,
} from "@syntaxure/ui";
import { ManageShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { MANAGE_HELP_SHORTCUTS } from "@/lib/keyboard-shortcuts";
import {
  Plus,
  Bell,
  LayoutDashboard,
  Shield,
  Box,
  Sparkles,
  Building2,
  User,
  CheckSquare,
  Calendar as CalendarIcon,
  LayoutGrid,
  Keyboard,
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { useWorkspaceStore } from "@/stores/workspace-store";

function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

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

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Keyboard Shortcuts (⌘⇧/)"
      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
    >
      <Keyboard className="h-4 w-4" />
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
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  // ── Build command palette sections ──

  const workspaceItems = workspaces.map((ws) => ({
    id: `ws-${ws.id}`,
    label: ws.name,
    description: ws.name === "Personal" ? "Personal tasks & lists" : "Workspace tasks & departments",
    icon: ws.name === "Personal" ? User : Building2,
    action: () => {
      setActiveWorkspace(ws.id);
      router.push("/tasks");
      closePalette();
    },
  }));

  const viewItems = [
    {
      id: "view-dashboard",
      label: "Dashboard",
      description: "Executive overview & KPIs",
      icon: LayoutDashboard,
      action: () => {
        router.push("/dashboard");
        closePalette();
      },
    },
    {
      id: "view-tasks",
      label: "Tasks",
      description: "View all tasks",
      icon: CheckSquare,
      action: () => {
        router.push("/tasks");
        closePalette();
      },
    },
    {
      id: "view-calendar",
      label: "Calendar",
      description: "Calendar view",
      icon: CalendarIcon,
      action: () => {
        router.push("/calendar");
        closePalette();
      },
    },
    {
      id: "view-kanban",
      label: "Kanban",
      description: "Kanban board view",
      icon: LayoutGrid,
      action: () => {
        router.push("/kanban");
        closePalette();
      },
    },
  ];

  const actionItems = [
    {
      id: "action-create-task",
      label: "Create Task",
      description: "Open the task creation page",
      icon: Plus,
      action: () => {
        router.push("/tasks/new");
        closePalette();
      },
    },
  ];

  const paletteSections: CommandPaletteSection[] = [
    { id: "workspaces", label: "Workspaces", items: workspaceItems, iconColor: "text-cyan-400" },
    { id: "views", label: "Views", items: viewItems, iconColor: "text-purple-400" },
    { id: "actions", label: "Quick Actions", items: actionItems, iconColor: "text-emerald-400" },
  ];

  return (
    <KeyboardShortcutsProvider
      onSearch={openPalette}
      onToggleSidebar={() => {
        document.dispatchEvent(new CustomEvent("toggle-sidebar"));
      }}
      onCommandPalette={openPalette}
      onShowHelp={openHelp}
    >
      <ManageShortcutsProvider>
        <AppTopNavbar
          appName="Manage"
          appLinks={appNavLinks}
          theme={(theme === "theme-light" ? "light" : "dark") as "dark" | "light" | undefined}
          onToggleTheme={() => setTheme(theme === "dark" || !theme ? "theme-light" : "dark")}
          searchPlaceholder="Search tasks, projects..."
          onSearchClick={openPalette}
          leftSlot={<WorkspaceSwitcher />}
          rightExtra={
            <div className="flex items-center gap-1">
              <HelpButton onClick={openHelp} />
              <QuickAddButton />
            </div>
          }
          notifications={<NotificationBell />}
          accountDropdown={<AccountMenu />}
        />
        <CommandPalette
          open={paletteOpen}
          onClose={closePalette}
          sections={paletteSections}
          placeholder="Search workspaces, views, actions..."
        />

        <KeyboardShortcutsHelp
          open={helpOpen}
          onClose={closeHelp}
          title="Manage Shortcuts"
          appShortcuts={MANAGE_HELP_SHORTCUTS}
        />
      </ManageShortcutsProvider>
    </KeyboardShortcutsProvider>
  );
}
