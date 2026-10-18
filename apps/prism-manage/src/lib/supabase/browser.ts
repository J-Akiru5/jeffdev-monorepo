import { createBrowser } from "@syntaxure/supabase/browser";
import type { Database } from "@/types/database.types";

/**
 * Typed Supabase client for client components.
 * Types come from the live schema (regenerate via `pnpm db:types`).
 */
export function createClient() {
  return createBrowser<Database>();
}
