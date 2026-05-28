"use client";

/**
 * AccountDropdownWrapper
 * ----------------------
 * Client component wrapper that wires prism-admin's auth data into
 * the shared AccountDropdown from @syntaxure/ui.
 */

import { useRouter } from "next/navigation";
import { useAuth, AccountDropdown } from "@syntaxure/ui";

export function AccountDropdownWrapper() {
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
      settingsHref="/admin/settings"
      showSettings={user?.role === "founder"}
      onSignOut={handleSignOut}
    />
  );
}
