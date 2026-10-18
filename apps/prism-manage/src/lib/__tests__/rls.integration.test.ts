import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * RLS integration tests (live DB — skipped without credentials)
 * -------------------------------------------------------------
 * Verifies the workspace-scoped RLS model end-to-end as a REAL member:
 *  - members see only their own membership rows
 *  - memory_entries capture is workspace-scoped (cross-workspace writes fail)
 *  - cross-workspace reads come back empty (not errored)
 *  - founders can delete entries in their workspace
 * Uses the dedicated E2E account (created by the Playwright global setup).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL || "e2e-test@manage.syntaxure.dev";
const password = process.env.E2E_TEST_PASSWORD || "E2e-Password-2026!";

const hasEnv = Boolean(url && anonKey && serviceKey);

describe.skipIf(!hasEnv)("RLS integration (live DB)", () => {
  let admin: SupabaseClient;
  let user: SupabaseClient;
  let userId: string;
  let ownWorkspaceId: string;
  let foreignWorkspaceId: string;

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    });
    user = createClient(url!, anonKey!, { auth: { persistSession: false } });

    const { data: signIn, error } = await user.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(
        `E2E sign-in failed: ${error.message} — run the Playwright global setup once.`,
      );
    }
    userId = signIn.user!.id;

    const { data: memberships } = await admin
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId);
    const own = memberships?.find((m) => m.role === "founder");
    if (!own) throw new Error("E2E account has no founder membership");
    ownWorkspaceId = String(own.workspace_id);

    // Throwaway workspace the user is NOT a member of (cascade-cleaned)
    const { data: ws, error: wsError } = await admin
      .from("workspaces")
      .insert({ name: `rls-test-${Date.now()}` })
      .select("id")
      .single();
    if (wsError) throw wsError;
    foreignWorkspaceId = String(ws!.id);
  });

  afterAll(async () => {
    if (foreignWorkspaceId) {
      await admin.from("workspaces").delete().eq("id", foreignWorkspaceId);
    }
    await admin
      .from("memory_entries")
      .delete()
      .eq("created_by", userId)
      .like("title", "rls-test-%");
    await user?.auth.signOut();
  });

  it("membership visibility follows the self-or-founder policy", async () => {
    // What the service role knows to be true
    const { data: mine } = await admin
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId);
    const founderWorkspaces = new Set(
      (mine || [])
        .filter((m) => m.role === "founder")
        .map((m) => String(m.workspace_id)),
    );

    const { data, error } = await user
      .from("workspace_members")
      .select("user_id, workspace_id");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);

    // RLS allows: own rows, or any row in a workspace the user founds.
    for (const row of data!) {
      const visible =
        row.user_id === userId ||
        founderWorkspaces.has(String(row.workspace_id));
      expect(visible).toBe(true);
    }
  });

  it("cannot insert memory into a workspace the user is not a member of", async () => {
    const { error } = await user.from("memory_entries").insert({
      workspace_id: foreignWorkspaceId,
      created_by: userId,
      title: "rls-test-foreign",
      summary: "should be blocked by RLS",
    });
    expect(error).not.toBeNull();
  });

  it("captures in own workspace; cross-workspace reads come back empty", async () => {
    const { error: insertError } = await user.from("memory_entries").insert({
      workspace_id: ownWorkspaceId,
      created_by: userId,
      title: "rls-test-own",
      summary: "visible to the member",
    });
    expect(insertError).toBeNull();

    const { data: own } = await user
      .from("memory_entries")
      .select("id")
      .eq("workspace_id", ownWorkspaceId)
      .eq("title", "rls-test-own");
    expect(own!.length).toBe(1);

    const { data: foreign } = await user
      .from("memory_entries")
      .select("id")
      .eq("workspace_id", foreignWorkspaceId);
    expect(foreign!.length).toBe(0);
  });

  it("founders can delete their own memory entries", async () => {
    const { data } = await user
      .from("memory_entries")
      .select("id")
      .eq("workspace_id", ownWorkspaceId)
      .eq("title", "rls-test-own");
    const id = String(data![0]!.id);

    const { data: deleted, error } = await user
      .from("memory_entries")
      .delete()
      .eq("id", id)
      .select("id");
    expect(error).toBeNull();
    expect(deleted!.length).toBe(1);
  });
});
