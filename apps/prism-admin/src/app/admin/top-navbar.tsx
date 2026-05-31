"use client";

/**
 * AdminTopNavbar
 * --------------
 * Client component that wraps AppTopNavbar with prism-admin-specific wiring.
 * Includes command palette, notification bell, and quick-add button.
 */

import { useState, useCallback, useRef, useEffect } from "react";
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
  cn,
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
  ChevronDown,
} from "lucide-react";
import { NotificationPopover } from "@/components/agency/notification-popover";
import { useAdminSidebarStore, type AdminSidebarMode } from "@/stores/admin-sidebar-store";

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

/** Mode selector dropdown in the top navbar */
function ModeDropdown() {  const mode = useAdminSidebarStore((s) => s.mode);
  const setMode = useAdminSidebarStore((s) => s.setMode);


  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const modes: { value: AdminSidebarMode; label: string; description: string }[] = [
    { value: "manage", label: "Manage", description: "Engine, products, settings" },
    { value: "agency", label: "Agency", description: "Projects, invoices, team" },
  ];

  const current = modes.find((m) => m.value === mode)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]"
        aria-label="Switch sidebar mode"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${mode === "manage" ? "bg-cyan-400" : "bg-amber-400"}`} />
          <span className="font-medium">{current.label}</span>
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-44 origin-top-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl py-1 shadow-2xl shadow-black/50">
            <p className="px-3 pb-1 pt-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              Sidebar Mode
            </p>
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setMode(m.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  m.value === mode
                    ? "bg-[var(--border-subtle)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${m.value === "manage" ? "bg-cyan-400" : "bg-amber-400"}`}
                />
                <div className="flex flex-col items-start">
                  <span>{m.label}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{m.description}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AdminTopNavbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const mode = useAdminSidebarStore((s) => s.mode);
  const toggleMode = useAdminSidebarStore((s) => s.toggleMode);

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

  // ── Admin command palette sections (filtered by mode) ──

  const sharedCommands = [
    { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
    { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings, keywords: ["settings", "preferences", "config"] },
  ];

  const manageCommands = [
    { id: "users", label: "Engine Users", href: "/admin/users", icon: Users, keywords: ["users", "accounts", "members"] },
    { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, keywords: ["billing", "plans", "payments"] },
    { id: "pricing", label: "Pricing Plans", href: "/admin/pricing", icon: DollarSign, keywords: ["plans", "tiers", "pricing"] },
    { id: "products", label: "Product Templates", href: "/admin/products", icon: Package, keywords: ["products", "templates"] },
    { id: "customization", label: "Customization Services", href: "/admin/customization-services", icon: Wrench, keywords: ["customization", "services"] },
    { id: "workspaces", label: "Workspaces", href: "/admin/workspaces", icon: Building2, keywords: ["workspaces", "organizations", "teams"] },
    { id: "manage-projects", label: "Manage Projects", href: "/admin/manage-projects", icon: FolderKanban, keywords: ["projects", "all projects"] },
  ];

  const agencyCommands = [
    { id: "agency-dashboard", label: "Agency Dashboard", href: "/admin/agency/dashboard", icon: LayoutDashboard, keywords: ["agency", "overview", "stats"] },
    { id: "agency-projects", label: "Agency Projects", href: "/admin/agency/projects", icon: FolderKanban, keywords: ["agency projects", "client projects"] },
    { id: "agency-quotes", label: "Quotes", href: "/admin/agency/quotes", icon: Mail, keywords: ["quotes", "estimates", "proposals"] },
    { id: "agency-invoices", label: "Invoices", href: "/admin/agency/invoices", icon: Receipt, keywords: ["invoices", "bills"] },
    { id: "agency-community", label: "Community", href: "/admin/agency/community", icon: Users, keywords: ["community", "members"] },
    { id: "agency-services", label: "Services Catalog", href: "/admin/agency/services", icon: Wrench, keywords: ["services", "catalog"] },
    { id: "agency-releases", label: "Releases", href: "/admin/agency/releases", icon: FileText, keywords: ["releases", "changelog"] },
    { id: "agency-content", label: "Content", href: "/admin/agency/content", icon: FileText, keywords: ["content", "pages"] },
    { id: "agency-calendar", label: "Agency Calendar", href: "/admin/agency/calendar", icon: FolderKanban, keywords: ["calendar", "schedule"] },
    { id: "agency-users", label: "Team Members", href: "/admin/agency/users", icon: Users, keywords: ["team", "members", "staff"] },
    { id: "agency-case-studies", label: "Case Studies", href: "/admin/agency/case-studies", icon: FileText, keywords: ["case studies", "portfolio"] },
    { id: "agency-feedback", label: "Feedback", href: "/admin/agency/feedback", icon: Mail, keywords: ["feedback", "reviews"] },
    { id: "agency-messages", label: "Messages", href: "/admin/agency/messages", icon: FolderKanban, keywords: ["messages", "inbox"] },
  ];

  const modeCmds = mode === "manage" ? manageCommands : agencyCommands;
  const modeLabel = mode === "manage" ? "Manage" : "Agency";

  const SectionDot = ({ className }: { className?: string }) => (
    <span className={cn("h-3 w-3 rounded-full", className)} />
  );

  const paletteSections: CommandPaletteSection[] = [
    {
      id: "general",
      label: "General",
      keywords: ["shared", "common"],
      icon: () => <SectionDot className="bg-[var(--text-tertiary)]" />,
      items: sharedCommands.map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        icon: cmd.icon,
        keywords: cmd.keywords,
        action: () => { router.push(cmd.href); closePalette(); },
      })),
    },
    {
      id: "nav",
      label: modeLabel,
      keywords: mode === "manage" ? ["engine"] : ["agency"],
      icon: () => (
        <SectionDot className={mode === "manage" ? "bg-cyan-400" : "bg-amber-400"} />
      ),
      items: modeCmds.map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        icon: cmd.icon,
        keywords: cmd.keywords,
        action: () => { router.push(cmd.href); closePalette(); },
      })),
    },
  ];

  return (
    <KeyboardShortcutsProvider
      onSearch={openPalette}
      onCommandPalette={openPalette}
      onShowHelp={openHelp}
      onToggleMode={toggleMode}
    >
      <AppTopNavbar
        appName="Admin"
        appLinks={appLinks}
        appIcon={
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20">
            <Shield className="h-3 w-3 text-amber-400" />
          </div>
        }
        searchPlaceholder={mode === "manage" ? "Search manage pages..." : "Search agency pages..."}
        onSearchClick={openPalette}
        leftSlot={<ModeDropdown />}
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
