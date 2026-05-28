"use client";

/**
 * AccountDropdownWrapper
 * ----------------------
 * Client component wrapper that wires prism-admin's auth data into
 * the shared AccountDropdown from @syntaxure/ui.
 */

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { AccountDropdown, type AppLink } from "@syntaxure/ui";
import { LayoutDashboard, Box, Sparkles, User } from "lucide-react";

interface UserProfile {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export function AccountDropdownWrapper() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();
  const [name, setName] = useState("User");
  const [role, setRole] = useState("");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email || undefined);
        setName(
          (data.user.user_metadata as Record<string, unknown> | undefined)
            ?.full_name as string | undefined ||
            data.user.email?.split("@")[0] ||
            "User",
        );
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (userId) {
      supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setRole((data as { role?: string }).role || "");
        });
    }
  }, [userId, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  const initials = name.charAt(0).toUpperCase();

  const appLinks: AppLink[] = [
    {
      label: "Admin",
      href: process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3004",
      shortLabel: "Admin",
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
    },
    {
      label: "Manage",
      href: process.env.NEXT_PUBLIC_MANAGE_URL || "http://localhost:3007",
      shortLabel: "Mgmt",
      icon: <User className="h-3.5 w-3.5" />,
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
    <AccountDropdown
      initials={initials}
      email={email}
      displayName={name}
      role={role || undefined}
      settingsHref="/admin/settings"
      appLinks={appLinks}
      showSettings={role === "founder"}
      onSignOut={handleSignOut}
    />
  );
}
