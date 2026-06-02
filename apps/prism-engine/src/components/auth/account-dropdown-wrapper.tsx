"use client";

/**
 * AccountDropdownWrapper
 * ----------------------
 * Client component wrapper that wires prism-engine's auth data into
 * the shared AccountDropdown from @syntaxure/ui.
 * Uses the shared useAuth() hook for all auth state.
 *
 * Note: Theme toggle has been moved to the shared AppTopNavbar's
 * inline toggle; no longer passed through AccountDropdown.
 */

import { useAuth, AccountDropdown } from "@syntaxure/ui";
import { LayoutDashboard, User, Sparkles, Shield } from "lucide-react";
import Link from "next/link";

/** Cross-app links shown as extra actions in the dropdown */
function AppLinks({ role }: { role?: string }) {
  const links = [
    {
      label: "Manage",
      href: process.env.NEXT_PUBLIC_MANAGE_URL || "http://localhost:3007",
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      label: "Admin",
      href: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004",
      icon: User,
      adminOnly: true,
    },
  ];

  const isAdmin = role === "admin" || role === "founder";
  const visibleLinks = links.filter((l) => !(l as any).adminOnly || isAdmin);

  if (visibleLinks.length === 0) return null;

  return (
    <>
      <div className="border-t border-[var(--border-subtle)] my-1" />
      {visibleLinks.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.label}
            href={l.href}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[var(--text-primary)] opacity-75 transition-all hover:bg-[var(--border-subtle)] hover:opacity-100"
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

  const handleSignOut = async () => {
    // Clear session in background
    signOut();
    // Force immediate redirect
    window.location.href = "/sign-in";
  };

  const initials = (user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-[var(--border-subtle)] animate-pulse" />
    );
  }

  return (
    <AccountDropdown
      initials={initials}
      email={user?.email}
      displayName={user?.full_name || "User"}
      settingsHref="/settings"
      extraActions={<AppLinks role={user?.role} />}
      onSignOut={handleSignOut}
    />
  );
}
