"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@syntaxure/ui";

export default function SignOutButton() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    signOut();
    window.location.href = "/sign-in";
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center justify-center rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
