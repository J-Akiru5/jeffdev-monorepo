"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

interface User {
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export function SupabaseUserButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user as unknown as User);
      }
    }

    getUser();
  }, [supabase]);

  useEffect(() => {
    async function getUserRole() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setRole(profile.role);
        }
      }
    }

    if (user) {
      getUserRole();
    }
  }, [user, supabase]);

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

  const displayName =
    user.user_metadata?.first_name || user.email?.split("@")[0] || "User";
  const avatar = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-400">
          {avatar}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <p className="text-xs font-medium text-white">{displayName}</p>
          <p className="text-[10px] text-amber-400 font-mono uppercase">
            {role}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-white/10 bg-[#050505] shadow-lg">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs font-medium text-white">{user.email}</p>
            <p className="text-[10px] text-white/40 mt-1">{role}</p>
          </div>

          <button
            onClick={() => {
              router.push("/admin/settings");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-red-400 hover:bg-red-500/5 transition-colors border-t border-white/5"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
