"use client";

/**
 * Admin Header
 * -------------
 * Top header bar with user info and quick actions.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NotificationPopover } from "./notification-popover";
import { AccountDropdown, type AppLink } from "@syntaxure/ui";
import { useUser } from "@/contexts/user-context";
import { LayoutDashboard, Box, Sparkles, User } from "lucide-react";

export function AdminHeader() {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  // Cross-app quick links
  const appLinks: AppLink[] = [
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
    await logout();
    router.push("/sign-in");
    router.refresh();
  }

  const displayName = user?.displayName || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/6 bg-void/80 px-4 backdrop-blur-md lg:px-6">
      {/* Search - Hidden on mobile */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/20 focus:bg-white/10"
          />
        </div>

        {/* Mobile Logo/Title */}
        <div className="md:hidden font-semibold text-white">Dashboard</div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        {user?.uid && <NotificationPopover userId={user.uid} />}

        {/* Unified Account Dropdown */}
        {loading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        ) : (
          <AccountDropdown
            initials={initials}
            email={user?.email}
            displayName={displayName}
            role={user?.role}
            avatarUrl={user?.photoURL}
            settingsHref="/admin/profile"
            appLinks={appLinks}
            onSignOut={handleSignOut}
          />
        )}
      </div>
    </header>
  );
}
