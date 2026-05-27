"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SupabaseUserButton() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user as unknown as { email?: string });
      }
    }
    getUser();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (!user) {
    return null;
  }

  const displayName = user.email?.split("@")[0] || "User";
  const avatar = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-glass-05 transition-colors w-full"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 text-xs font-medium text-cyan-400">
          {avatar}
        </div>
        <span className="text-xs text-text-secondary truncate">{displayName}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-border bg-elevated shadow-lg">
          <div className="px-4 py-3 border-b border-glass-05">
            <p className="text-xs font-medium text-text-primary truncate">
              {user.email || "User"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
