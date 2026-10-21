/**
 * Playwright Global Teardown
 * ---------------------------
 * Removes test data created by the suite (anything titled `e2e-*` owned by
 * the E2E test account) so the shared database stays clean.
 * Best-effort — never fails the run.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  try {
    for (const line of readFileSync(filePath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // best-effort
  }
}

export default async function globalTeardown() {
  loadEnvFile(resolve(__dirname, "../.env.local"));
  loadEnvFile(resolve(__dirname, "../.env.e2e.local"));

  const email = process.env.E2E_TEST_EMAIL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !supabaseUrl || !serviceRoleKey) return;

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: list } = await admin.auth.admin.listUsers();
    const testUser = list?.users.find((u) => u.email === email);
    if (!testUser) return;

    await admin
      .from("tasks")
      .delete()
      .eq("user_id", testUser.id)
      .like("title", "e2e-%");

    await admin
      .from("calendar_events")
      .delete()
      .eq("user_id", testUser.id)
      .like("title", "e2e-%");

    await admin
      .from("pages")
      .delete()
      .eq("created_by", testUser.id)
      .like("title", "e2e-%");

    await admin
      .from("saved_views")
      .delete()
      .eq("user_id", testUser.id)
      .like("name", "e2e-%");

    await admin
      .from("memory_entries")
      .delete()
      .eq("created_by", testUser.id)
      .like("title", "e2e-%");

    await admin
      .from("task_templates")
      .delete()
      .eq("created_by", testUser.id)
      .like("name", "e2e-%");

    // Portfolio (Phase 3): projects cascade to project_partners,
    // project_members and milestones; delete them before their clients.
    await admin.from("projects").delete().like("title", "e2e-%");

    await admin.from("clients").delete().like("name", "e2e-%");

    console.log("[e2e] test data cleaned up");
  } catch {
    // best-effort
  }
}
