"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@syntaxure/ui";

export default function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center justify-center rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
