"use client";

/**
 * AuthWrapper
 * -----------
 * Client component that bridges syntaxure-labs' Supabase browser client
 * into the shared AuthProvider from @syntaxure/ui.
 *
 * Must be wrapped around any component tree that needs access to `useAuth()`.
 */

import { AuthProvider } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider createClient={createClient}>{children}</AuthProvider>;
}
