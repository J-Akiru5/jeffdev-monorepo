"use client";

/**
 * AuthWrapper
 * -----------
 * Bridges prism-engine's Supabase client factory into the shared AuthProvider
 * from @syntaxure/ui. This replaces the custom SupabaseProvider.
 */

import { AuthProvider } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ReactNode } from "react";

export function AuthWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider createClient={createClient}>
      {children}
    </AuthProvider>
  );
}
