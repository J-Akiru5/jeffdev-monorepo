"use client";

/**
 * AdminTopNavbar
 * --------------
 * Client component that wraps AppTopNavbar with prism-admin-specific wiring.
 * Includes command palette, notification bell, and quick-add button.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
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
import {
  LayoutDashboard,
  Box,
  Sparkles,
  Shield,
  Plus,
  Users,
  CreditCard,
  Package,
  FolderKanban,
  Settings,
  Mail,
  Receipt,
  FileText,
  Building2,
  Wrench,
  DollarSign,
  Keyboard,
} from "lucide-react";
import { NotificationPopover } from "@/components/agency/notification-popover";

/**
 * NotificationBell
 * -----------------
 * Wraps the NotificationPopover with user ID from auth context.
 */
function NotificationBell({ userId }: { userId: string }) {
  return <NotificationPopover userId={userId} />;
}

/**
 * QuickAddButton
 * ---------------
 * Quick-add button linking to common admin creation pages.
 */
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
      href="/admin/products/new"
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-95"
      title="New product template"
    >
      <Plus className="h-4 w-4" />
    </Link>
  );
}

export function AdminTopNavbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  const initials = (user?.full_name || user?.email || "U").charAt(0).toUpperCase();

  const appLinks: AppNavLink[] = [
    {
      label: "Admin",
      href: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004",
      shortLabel: "Admin",
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    {
      label: "Manage",
      href: process.env.NEXT_PUBLIC_MANAGE_URL || "http://localhost:3007",
      shortLabel: "Mgmt",
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
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

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  // ── Admin command palette sections ──

  const adminCommands = [
    { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
    { id: "users", label: "Engine Users", href: "/admin/users", icon: Users, keywords: ["users", "accounts", "members"] },
    { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, keywords: ["billing", "plans", "payments"] },
    { id: "pricing", label: "Pricing Plans", href: "/admin/pricing", icon: DollarSign, keywords: ["plans", "tiers", "pricing"] },
    { id: "products", label: "Product Templates", href: "/admin/products", icon: Package, keywords: ["products", "templates"] },
    { id: "workspaces", label: "Workspaces", href: "/admin/workspaces", icon: Building2, keywords: ["workspaces", "organizations", "teams"] },
    { id: "manage-projects", label: "Manage Projects", href: "/admin/manage-projects", icon: FolderKanban, keywords: ["projects", "all projects"] },
    { id: "agency-dashboard", label: "Agency Dashboard", href: "/admin/agency/dashboard", icon: LayoutDashboard, keywords: ["agency", "overview", "stats"] },
    { id: "agency-projects", label: "Agency Projects", href: "/admin/agency/projects", icon: FolderKanban, keywords: ["agency projects", "client projects"] },
    { id: "agency-quotes", label: "Quotes", href: "/admin/agency/quotes", icon: Mail, keywords: ["quotes", "estimates", "proposals"] },
    { id: "agency-invoices", label: "Invoices", href: "/admin/agency/invoices", icon: Receipt, keywords: ["invoices", "bills"] },
    { id: "agency-community", label: "Community", href: "/admin/agency/community", icon: Users, keywords: ["community", "members"] },
    { id: "agency-services", label: "Services Catalog", href: "/admin/agency/services", icon: Wrench, keywords: ["services", "catalog"] },
    { id: "agency-releases", label: "Releases", href: "/admin/agency/releases", icon: FileText, keywords: ["releases", "changelog"] },
    { id: "agency-content", label: "Content", href: "/admin/agency/content", icon: FileText, keywords: ["content", "pages"] },
    { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings, keywords: ["settings", "preferences", "config"] },
  ];

  const paletteSections: CommandPaletteSection[] = [
    {
      id: "nav",
      label: "Navigate",
      items: adminCommands.map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        icon: cmd.icon,
        keywords: cmd.keywords,
        action: () => {
          router.push(cmd.href);
          closePalette();
        },
      })),
    },
  ];

  return (
    <KeyboardShortcutsProvider
      onSearch={openPalette}
      onCommandPalette={openPalette}
      onShowHelp={openHelp}
    >
      <AppTopNavbar
        appName="Admin"
        appLinks={appLinks}
        appIcon={
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20">
            <Shield className="h-3 w-3 text-amber-400" />
          </div>
        }
        searchPlaceholder="Search admin..."
        onSearchClick={openPalette}
        theme={(theme === "theme-light" ? "light" : "dark") as "dark" | "light" | undefined}
        onToggleTheme={() => setTheme(theme === "dark" || !theme ? "theme-light" : "dark")}
        rightExtra={
          <div className="flex items-center gap-1">
            <HelpButton onClick={openHelp} />
            <QuickAddButton />
          </div>
        }
        notifications={user?.id ? <NotificationBell userId={user.id} /> : null}
        accountDropdown={
          loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : (
            <AccountDropdown
              initials={initials}
              email={user?.email}
              displayName={user?.full_name}
              role={user?.role}
              settingsHref="/admin/settings"
              showSettings={user?.role === "founder"}
              onSignOut={handleSignOut}
            />
          )
        }
      />
      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        sections={paletteSections}
        placeholder="Search admin pages..."
      />

      <KeyboardShortcutsHelp
        open={helpOpen}
        onClose={closeHelp}
        title="Admin Shortcuts"
      />
    </KeyboardShortcutsProvider>
  );
}
