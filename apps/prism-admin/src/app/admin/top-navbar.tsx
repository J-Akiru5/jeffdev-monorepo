"use client";

/**
 * AdminTopNavbar
 * --------------
 * Client component that wraps AppTopNavbar with prism-admin-specific wiring.
 */

import { useRouter } from "next/navigation";
import { AppTopNavbar, AccountDropdown, useAuth, type AppNavLink } from "@syntaxure/ui";
import { LayoutDashboard, Box, Sparkles, Shield } from "lucide-react";

export function AdminTopNavbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <AppTopNavbar
      appName="Admin"
      appLinks={appLinks}
      appIcon={
        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20">
          <Shield className="h-3 w-3 text-amber-400" />
        </div>
      }
      searchPlaceholder="Search admin..."
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
  );
}
