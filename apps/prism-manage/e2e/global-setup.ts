/**
 * Playwright Global Setup
 * ------------------------
 * Provisions a dedicated, disposable E2E test account (idempotent):
 *   - creates the Supabase auth user (or resets its password)
 *   - ensures a user_profiles row
 *   - ensures memberships: Personal (founder) + Syntaxure Labs (employee)
 *   - writes .env.e2e.local (gitignored) and sets E2E_READY=1
 *
 * When Supabase credentials are missing (e.g. forks without secrets), the
 * whole suite self-skips instead of failing.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "fs";
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

export default async function globalSetup() {
  loadEnvFile(resolve(__dirname, "../.env.local"));
  loadEnvFile(resolve(__dirname, "../.env.e2e.local"));

  const email =
    process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";
  const password = process.env.E2E_TEST_PASSWORD || "E2e-Password-2026!";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("placeholder") ||
    serviceRoleKey.includes("placeholder")
  ) {
    console.log(
      "[e2e] Supabase credentials missing — the E2E suite will self-skip.",
    );
    return;
  }

  // Fail-soft: if the configured Supabase project is unreachable (e.g. stale
  // CI secrets pointing at a retired project), skip the suite loudly instead
  // of failing the whole pipeline.
  try {
    // Any HTTP response (even a 401 for a missing apikey) proves the host
    // resolves and responds — only network-level failures mean "unreachable".
    await fetch(`${supabaseUrl}/auth/v1/health`);
  } catch (error) {
    console.error(
      `[e2e] Supabase project unreachable (${
        error instanceof Error ? error.message : String(error)
      }) — the E2E suite will self-skip.`,
    );
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Create or reset the test account ──
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = list?.users.find((u) => u.email === email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
    });
    if (error) throw error;
    console.log(`[e2e] reset password for existing account ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Test Account" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`[e2e] created test account ${email}`);
  }

  // ── Profile + memberships (idempotent) ──
  const { error: profileError } = await admin
    .from("user_profiles")
    .upsert(
      { id: userId, email, full_name: "E2E Test Account" },
      { onConflict: "id" },
    );
  if (profileError) {
    console.error(`[e2e] user_profiles upsert failed: ${profileError.message}`);
  }

  const { data: workspaces } = await admin
    .from("workspaces")
    .select("id, name");

  const personal = workspaces?.find((w) => w.name === "Personal");
  const syntaxure = workspaces?.find((w) =>
    (w.name || "").startsWith("Syntaxure Labs"),
  );

  const membershipRows: Array<{
    workspace_id: string;
    user_id: string;
    role: string;
  }> = [];
  if (personal) {
    membershipRows.push({
      workspace_id: personal.id,
      user_id: userId,
      role: "founder",
    });
  }
  if (syntaxure) {
    membershipRows.push({
      workspace_id: syntaxure.id,
      user_id: userId,
      role: "employee",
    });
  }
  if (membershipRows.length > 0) {
    const { error: membershipError } = await admin
      .from("workspace_members")
      .upsert(membershipRows, { onConflict: "workspace_id,user_id" });
    if (membershipError) {
      console.error(
        `[e2e] workspace membership upsert failed: ${membershipError.message}`,
      );
    }
  } else {
    console.error("[e2e] no workspaces found — memberships not provisioned");
  }

  // ── Seed a "General" list in every workspace so task specs have a target ──
  for (const ws of [personal, syntaxure]) {
    if (!ws) continue;
    const { data: existingList } = await admin
      .from("pm_projects")
      .select("id")
      .eq("workspace_id", ws.id)
      .eq("name", "General")
      .maybeSingle();

    if (!existingList) {
      const { error: listError } = await admin.from("pm_projects").insert({
        workspace_id: ws.id,
        name: "General",
        created_by: userId,
      });
      if (listError) {
        console.error(
          `[e2e] seed list failed for ${ws.name}: ${listError.message}`,
        );
      }
    }
  }

  // ── Publish creds to the test process + env file ──
  process.env.E2E_TEST_EMAIL = email;
  process.env.E2E_TEST_PASSWORD = password;
  process.env.E2E_READY = "1";

  writeFileSync(
    resolve(__dirname, "../.env.e2e.local"),
    [
      "# Generated by e2e/global-setup.ts — DO NOT COMMIT",
      `E2E_TEST_EMAIL=${email}`,
      `E2E_TEST_PASSWORD=${password}`,
      "",
    ].join("\n"),
  );

  console.log(`[e2e] test account ready: ${email} (${userId})`);
}
