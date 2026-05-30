"use client";

/**
 * AccountDropdownWrapper
 * ----------------------
 * Client component wrapper that wires prism-engine's auth data into
 * the shared AccountDropdown from @syntaxure/ui.
 * Uses the shared useAuth() hook for all auth state.
 */

import { useAuth, AccountDropdown } from "@syntaxure/ui";
import { LayoutDashboard, User, Sparkles, Shield } from "lucide-react";
import Link from "next/link";

/** Cross-app links shown as extra actions in the dropdown */
function AppLinks() {
  const links = [
    {
      label: "Engine",
      href: process.env.NEXT_PUBLIC_PRISM_URL || "http://localhost:3001",
      icon: Shield,
    },
    {
      label: "Manage",
      href: process.env.NEXT_PUBLIC_MANAGE_URL || "http://localhost:3007",
      icon: LayoutDashboard,
    },
    {
      label: "Admin",
      href: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004",
      icon: User,
    },
    {
      label: "Labs",
      href: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      icon: Sparkles,
    },
  ];

  return (
    <>
      <div className="border-t border-white/5 my-1" />
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.label}
            href={l.href}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]"
          >
            <Icon className="h-4 w-4" />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function AccountDropdownWrapper() {
  const { user, loading, signOut } = useAuth();

  const initials = (user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-white/5 animate-pulse" />
    );
  }

  return (
    <AccountDropdown
      initials={initials}
      email={user?.email}
      displayName={user?.full_name || "User"}
      role={user?.role || undefined}
      settingsHref="/settings"
      extraActions={<AppLinks />}
      onSignOut={signOut}
    />
  );
}
