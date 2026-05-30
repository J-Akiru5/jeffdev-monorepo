"use client";

/**
 * DashboardShell — "Apex" Layout
 * --------------------------------
 * Full-height sidebar + inner top bar (desktop only).
 * The top bar sits INSIDE the main content column, to the right of the sidebar.
 * This matches Apex/Linear/Vercel-style 2026 SaaS dashboards.
 *
 * Desktop (≥ 768px / md):
 *   ┌──────────┬──────────────────────────────────────────┐
 *   │          │  [Search...]   [+ New Project] [🌙] [AS] │  ← inner top bar
 *   │ Sidebar  ├──────────────────────────────────────────┤
 *   │          │  Page content                            │
 *   │          │                                          │
 *   └──────────┴──────────────────────────────────────────┘
 *
 * Mobile (< 768px / md):
 *   ┌───────────────────────────────────────────────────┐
 *   │ [✦ Prism Engine BETA]               [🌙] [avatar] │  ← full-width header
 *   ├───────────────────────────────────────────────────┤
 *   │  Page content                                     │
 *   ├───────────────────────────────────────────────────┤
 *   │ [Home] [Projects] [✦ FAB] [Connect] [Settings]   │  ← bottom nav
 *   └───────────────────────────────────────────────────┘
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Palette,
  Sparkles,
  CreditCard,
  Settings,
  Library,
  Plug,
  BarChart2,
  Crown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Sun,
  Moon,
  Bell,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { BetaBadge } from "@/components/beta-badge";
import SignOutButton from "@/components/auth/sign-out-button";
import { AccountDropdownWrapper } from "@/components/auth/account-dropdown-wrapper";
import { GridBackground } from "@syntaxure/ui";

/* ── Types ────────────────────────────────────────────────────────── */

export interface UserInfo {
  displayName: string;
  email: string;
  userInitial: string;
  isPaidTier: boolean;
  planLabel: string;
}

type NavDef = {
  href?: string;
  icon?: React.ElementType;
  label: string;
  highlight?: boolean;
  isSection?: boolean;
  subItems?: { href: string; label: string; icon?: React.ElementType }[];
};

/* ── Nav config ───────────────────────────────────────────────────── */

const NAV: NavDef[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/brand", icon: Palette, label: "Branding" },
  { 
    href: "/generate", 
    icon: Sparkles, 
    label: "AI Kitchen",
    subItems: [
      { href: "/generate/library", icon: Library, label: "Component Library" },
    ]
  },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { isSection: true, label: "SYSTEM" },
  {
    href: "/quickstart",
    icon: Plug,
    label: "Quick Connect",
    highlight: true,
  },
  { href: "/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const MOBILE_NAV: NavDef[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/quickstart", icon: Plug, label: "Connect" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;
const TOPBAR_H = 56; // 56px = h-14

/* ── Icon-only theme toggle ───────────────────────────────────────── */

function ThemeToggleIcon({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const isLight = theme === "light";
  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      title={isLight ? "Switch to dark" : "Switch to light"}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors ${className}`}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

/* ── Shell ────────────────────────────────────────────────────────── */

export default function DashboardShell({
  children,
  userInfo,
}: {
  children: React.ReactNode;
  userInfo: UserInfo;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    try {
      const v = localStorage.getItem("prism-sidebar-collapsed");
      if (v !== null) setCollapsed(JSON.parse(v));
    } catch {}

    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("prism-sidebar-collapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isActive = useCallback(
    (href: string) =>
      href === "/dashboard"
        ? pathname === "/dashboard"
        : (pathname?.startsWith(href) ?? false),
    [pathname]
  );

  const sbw = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  /* Shared transition value */
  const sidebarTransition = "width 300ms ease-in-out";
  const contentTransition = "margin-left 300ms ease-in-out, left 300ms ease-in-out";

  return (
    <div className="relative flex min-h-screen bg-[var(--bg-primary)]">
      <GridBackground variant="neon" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DESKTOP SIDEBAR — full height, left edge
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <aside
        style={{ width: sbw, transition: sidebarTransition }}
        className="hidden md:flex fixed left-0 top-0 h-full z-40 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden"
      >
        {/* ── Logo header ── */}
        {collapsed ? (
          /* Collapsed: icon centred, hover reveals ChevronRight */
          <div
            style={{ height: TOPBAR_H }}
            className="group relative flex shrink-0 items-center justify-center border-b border-[var(--border-subtle)]"
          >
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-[var(--border-subtle)] hover:border-cyan-500/30 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </Link>
            {/* Expand button — slides in on hover */}
            <button
              onClick={toggle}
              aria-label="Expand sidebar"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-primary)] border border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)] opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* Expanded: logo + text + collapse chevron */
          <div
            style={{ height: TOPBAR_H }}
            className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-3 gap-2"
          >
            <Link href="/" className="flex items-center gap-2 group min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                Prism Engine
              </span>
              <BetaBadge />
            </Link>
            <button
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Nav items ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {NAV.map((item, i) => (
            <React.Fragment key={item.href || item.label}>
              {item.isSection ? (
                <div
                  className={`px-3 pb-1 text-xs font-mono tracking-wider text-[var(--text-tertiary)] uppercase ${
                    i > 0 ? "mt-6" : ""
                  }`}
                >
                  {!collapsed && item.label}
                  {collapsed && <div className="border-t border-[var(--border-subtle)] w-full my-3" />}
                </div>
              ) : (
                <SidebarItem
                  href={item.href!}
                  icon={item.icon!}
                  label={item.label}
                  active={isActive(item.href!)}
                  collapsed={collapsed}
                  highlight={item.highlight}
                  subItems={item.subItems}
                />
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* ── Sidebar footer — minimal; account/theme live in the top bar ── */}
        <div className="shrink-0 border-t border-[var(--border-subtle)]">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-3 px-2">
              {/* Plan tier icon */}
              <div
                title={`${userInfo.planLabel} Plan`}
                className="flex h-9 w-9 items-center justify-center rounded-md text-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-default"
              >
                <Crown className="h-4 w-4" />
              </div>
              {/* User avatar */}
              <div
                title={`${userInfo.displayName} · ${userInfo.email}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-xs font-semibold text-cyan-300 cursor-default select-none"
              >
                {userInfo.userInitial}
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {/* Plan card */}
              <div className="rounded-md border border-cyan-500/15 bg-cyan-500/[0.04] p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-mono">
                      Current Plan
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {userInfo.planLabel}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${
                      userInfo.isPaidTier
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                    }`}
                  >
                    {userInfo.isPaidTier ? "ACTIVE" : "FREE"}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-tertiary)] mb-2.5">
                  {userInfo.isPaidTier
                    ? "Workspace unlocked with expanded limits and team features."
                    : "Upgrade to unlock more projects and AI generations."}
                </p>
                <Link
                  href="/subscription"
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-transparent bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/15 dark:hover:text-cyan-200 transition-colors"
                >
                  {userInfo.isPaidTier ? "Manage Plan" : "Upgrade Plan"}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {/* User identity row */}
              <div className="flex items-center gap-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-xs font-semibold text-cyan-300 select-none">
                  {userInfo.userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {userInfo.displayName}
                  </p>
                  <p className="truncate text-[10px] font-mono text-[var(--text-tertiary)]">
                    {userInfo.email}
                  </p>
                </div>
                <SignOutButton />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DESKTOP INNER TOP BAR
          Lives inside the content column; left edge tracks sidebar width.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header
        className="hidden md:flex fixed top-0 right-0 z-50 items-center justify-end gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-xl px-4"
        style={{
          left: isDesktop ? sbw : 0,
          height: TOPBAR_H,
          transition: contentTransition,
        }}
      >
        {/* New Project CTA */}
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 h-8 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 active:scale-95 px-4 text-xs font-semibold !text-white transition-all whitespace-nowrap mr-2 shadow-[0_2px_8px_rgba(37,99,235,0.3)] dark:shadow-none dark:!text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Link>

        {/* Bell */}
        <button
          title="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Theme toggle */}
        <ThemeToggleIcon />

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--border-subtle)] mx-2" />

        {/* Account */}
        <AccountDropdownWrapper />
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE FULL-WIDTH TOP HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-xl flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10">
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">
            Prism Engine
          </span>
          <BetaBadge />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggleIcon />
          <AccountDropdownWrapper />
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN CONTENT
          — Mobile:  margin-left 0,  pt-16 (mobile header) + pb-20 (bottom nav)
          — Desktop: margin-left sbw, pt-[56px] (inner top bar)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main
        style={{
          marginLeft: isDesktop ? sbw : 0,
          transition: contentTransition,
        }}
        className="relative z-0 w-full min-h-screen pt-16 pb-20 md:pt-14 md:pb-0"
      >
        <div className="p-4 md:p-6 w-full">{children}</div>
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE BOTTOM NAVIGATION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-lg flex items-center">
        {MOBILE_NAV.slice(0, 2).map((item) => (
          <MobileNavLink
            key={item.href}
            href={item.href!}
            icon={item.icon!}
            label={item.label}
            active={isActive(item.href!)}
          />
        ))}

        {/* Centre FAB */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/generate"
            className="relative -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/25 border border-white/20 text-white active:scale-95 transition-transform"
          >
            <Sparkles className="h-5 w-5" />
          </Link>
        </div>

        {MOBILE_NAV.slice(2).map((item) => (
          <MobileNavLink
            key={item.href}
            href={item.href!}
            icon={item.icon!}
            label={item.label}
            active={isActive(item.href!)}
          />
        ))}
      </nav>
    </div>
  );
}

/* ── Sidebar nav item ─────────────────────────────────────────────── */

function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  highlight,
  subItems,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  collapsed: boolean;
  highlight?: boolean;
  subItems?: { href: string; label: string; icon?: React.ElementType }[];
}) {
  const pathname = usePathname();
  // Auto-expand if a subItem is currently active
  const isSubActive = subItems?.some((sub) => pathname.startsWith(sub.href)) || false;
  const [isOpen, setIsOpen] = useState(isSubActive || active);

  useEffect(() => {
    if (active || isSubActive) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [active, isSubActive]);

  const base =
    "flex items-center text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50";

  const colors = active
    ? "bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 shadow-[inset_2px_0_0_0_#2563eb] dark:shadow-[inset_2px_0_0_0_#06b6d4]"
    : highlight
    ? "text-blue-600/70 dark:text-cyan-400/70 hover:bg-blue-500/10 dark:hover:bg-cyan-500/10 hover:text-blue-700 dark:hover:text-cyan-300"
    : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]";

  const iconColor = active ? "text-blue-600 dark:text-cyan-400" : highlight ? "text-blue-600/70 dark:text-cyan-400/70 group-hover:text-blue-700 dark:group-hover:text-cyan-300" : "";

  if (collapsed) {
    return (
      <Link
        href={href}
        title={label}
        className={`${base} ${colors} rounded-md h-10 w-10 mx-auto justify-center`}
      >
        <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      </Link>
    );
  }

  const MainLink = (
    <Link href={href} className={`${base} ${colors} rounded-md px-3 py-2 flex-1 flex items-center gap-3`}>
      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );

  if (!subItems || subItems.length === 0) {
    return MainLink;
  }

  return (
    <div className="flex flex-col space-y-0.5 w-full">
      <div className="flex items-center w-full">
        {MainLink}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-[var(--border-subtle)] transition-colors ${
            isOpen ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
          }`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      
      {isOpen && (
        <div className="flex flex-col space-y-0.5 pl-9 pt-1">
          {subItems.map((sub) => {
            const subActive = pathname.startsWith(sub.href);
            const subColors = subActive
              ? "text-cyan-400 font-semibold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]";
            const SubIcon = sub.icon;
            
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-md transition-colors ${subColors}`}
              >
                {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                <span className="whitespace-nowrap">{sub.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Mobile nav link ──────────────────────────────────────────────── */

function MobileNavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
            active ? "text-cyan-400" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

