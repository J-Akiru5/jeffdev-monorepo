"use client";

import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useEffect } from "react";

export function SupabaseProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    createClient();
  }, []);

  return <>{children}</>;
}
