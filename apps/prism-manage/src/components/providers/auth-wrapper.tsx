"use client";

/**
 * AuthWrapper
 * -----------
 * Client component bridge that connects prism-manage's Supabase client
 * to the shared AuthProvider from @syntaxure/ui.
 *
 * This exists because the root layout is a server component and cannot
 * import createClient from @/lib/supabase/browser directly.
 */

import { AuthProvider } from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ReactNode } from "react";

export function AuthWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider createClient={createClient}>{children}</AuthProvider>;
}
