import { createServer } from "@syntaxure/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * Typed Supabase client for server components, server actions, and route
 * handlers. Types come from the live schema (regenerate via `pnpm db:types`).
 */
export function createClient() {
  return createServer<Database>();
}
