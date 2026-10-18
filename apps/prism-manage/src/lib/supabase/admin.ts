import { createAdmin } from "@syntaxure/supabase/admin";
import type { Database } from "@/types/database.types";

/**
 * Typed service-role client — server-only (actions, routes, cron).
 * Types come from the live schema (regenerate via `pnpm db:types`).
 */
export function getAdminClient() {
  return createAdmin<Database>();
}
