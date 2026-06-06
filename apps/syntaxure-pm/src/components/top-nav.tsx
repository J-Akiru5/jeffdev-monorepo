"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";

interface TopNavProps {
  user: User;
}

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-black/20 px-6">
      <div className="text-sm text-zinc-400">
        JeffDev Monorepo — System Documentation & Project Management
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          {user.email}
        </span>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
