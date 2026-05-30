"use client";

/**
 * AdminHeader
 * -------------
 * Top header bar that wraps the shared AppTopNavbar from @syntaxure/ui.
 *
 * Provides syntaxure-labs-specific wiring: search, notifications,
 * and account dropdown with cross-app links.
 */

import { useRouter } from "next/navigation";
import { NotificationPopover } from "./notification-popover";
import { AppTopNavbar, AccountDropdown, useAuth, type AppNavLink } from "@syntaxure/ui";
import { LayoutDashboard, Box, Sparkles, User } from "lucide-react";

export function AdminHeader() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Cross-app links for the AppTopNavbar switcher
  const appLinks: AppNavLink[] = [
    {
      label: "Syntaxure Labs",
      href: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      shortLabel: "Labs",
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
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
      icon: <User className="h-3.5 w-3.5" />,
    },
    {
      label: "Engine",
      href: process.env.NEXT_PUBLIC_PRISM_URL || "http://localhost:3001",
      shortLabel: "Engine",
      icon: <Box className="h-3.5 w-3.5" />,
    },
  ];

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  const displayName = user?.full_name || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <AppTopNavbar
      appName="Labs"
      appLinks={appLinks}
      searchPlaceholder="Search..."
      notifications={
        user?.id ? (
          <NotificationPopover userId={user.id} />
        ) : undefined
      }
      accountDropdown={
        loading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        ) : (
          <AccountDropdown
            initials={initials}
            email={user?.email}
            displayName={displayName}
            role={user?.role}
            avatarUrl={user?.avatar_url}
            settingsHref="/admin/profile"
            onSignOut={handleSignOut}
          />
        )
      }
    />
  );
}
