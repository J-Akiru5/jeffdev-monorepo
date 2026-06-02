import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function createAdmin<Database = any>(): SupabaseClient<Database> {
  if (adminClient) return adminClient as SupabaseClient<Database>;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  adminClient = createClient<Database>(url, key) as unknown as SupabaseClient;
  return adminClient as SupabaseClient<Database>;
}
