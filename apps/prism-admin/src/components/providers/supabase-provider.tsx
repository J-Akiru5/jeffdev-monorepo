"use client";

import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useEffect, useState } from "react";

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize Supabase client on client side
    createClient();
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
