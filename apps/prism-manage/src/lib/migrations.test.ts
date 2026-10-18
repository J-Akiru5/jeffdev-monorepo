/**
 * Database-integrity tests for the foundation-hardening migrations.
 *
 * These tests verify that the SQL migrations shipped in this repository
 * contain the fixes for the known blockers:
 *
 *   1. The CPO review triggers no longer reference the dropped tasks.tags
 *      column and write tags through the tags / task_tags junction tables.
 *   2. The workspace_members insert policy no longer allows arbitrary
 *      self-promotion to 'founder'.
 *   3. audit_logs has an authenticated self-insert policy so client-side
 *      audit writes are no longer silently dropped by RLS.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

function findMigrationsDir(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.resolve(dir, "supabase", "migrations");
    if (existsSync(candidate)) return candidate;
    dir = path.resolve(dir, "..");
  }
  throw new Error("Could not locate supabase/migrations from " + process.cwd());
}

function readMigration(filename: string): string {
  const migrationsDir = findMigrationsDir();
  const file = path.join(migrationsDir, filename);
  expect(existsSync(file)).toBe(true);
  return readFileSync(file, "utf8");
}

/** SQL body only — drops comment lines so prose mentions don't count. */
function sqlBody(filename: string): string {
  return readMigration(filename)
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

function migrationFiles(): string[] {
  return readdirSync(findMigrationsDir()).filter((f) => f.endsWith(".sql"));
}

describe("CPO review trigger migration", () => {
  it("ships the trigger fix migration", () => {
    expect(
      migrationFiles().some((f) => f.endsWith("20260915000000_fix_cpo_review_triggers.sql")),
    ).toBe(true);
  });

  it("no longer references the dropped tasks.tags column", () => {
    const sql = sqlBody("20260915000000_fix_cpo_review_triggers.sql");
    expect(sql).not.toMatch(/NEW\.tags/);
    expect(sql).not.toMatch(/OLD\.tags/);
  });

  it("writes the CPO Review tag through the tags / task_tags junction tables", () => {
    const sql = readMigration("20260915000000_fix_cpo_review_triggers.sql");
    expect(sql).toContain("task_tags");
    expect(sql).toContain("INSERT INTO tags (name)");
    expect(sql).toContain("DROP TRIGGER IF EXISTS tasks_auto_tag_cpo_review ON tasks");
    expect(sql).toContain("DROP TRIGGER IF EXISTS tasks_notify_cpo_review ON tasks");
  });
});

describe("workspace_members RLS hardening migration", () => {
  it("ships the RLS hardening migration", () => {
    expect(
      migrationFiles().some((f) => f.endsWith("20260915000001_harden_workspace_members_rls.sql")),
    ).toBe(true);
  });

  it("replaces the vulnerable onboarding insert policy", () => {
    const sql = readMigration("20260915000001_harden_workspace_members_rls.sql");
    expect(sql).toContain(
      'DROP POLICY IF EXISTS "Allow member insert during onboarding" ON workspace_members',
    );
    expect(sql).toContain('CREATE POLICY "Allow member insert during onboarding" ON workspace_members');
  });

  it("blocks founder self-insertion into existing workspaces", () => {
    const sql = readMigration("20260915000001_harden_workspace_members_rls.sql");
    // founder self-insert is only allowed together with the first-member branch
    expect(sql).toContain("NOT EXISTS");
    expect(sql).toContain("AND role = 'founder'");
    // into existing workspaces only 'employee' self-insertion is allowed
    expect(sql).toContain("AND role = 'employee'");
  });
});

describe("audit_logs self-insert policy migration", () => {
  it("ships the audit insert policy migration", () => {
    expect(
      migrationFiles().some((f) => f.endsWith("20260915000002_audit_logs_self_insert_policy.sql")),
    ).toBe(true);
  });

  it("only permits authenticated users to insert rows attributed to themselves", () => {
    const sql = readMigration("20260915000002_audit_logs_self_insert_policy.sql");
    expect(sql).toContain("auth.role() = 'authenticated'");
    expect(sql).toContain("user_id = auth.uid()");
  });
});
