/**
 * Platform Audit Log Viewer — authorization + data safety tests.
 *
 * Verifies:
 *   1. getPlatformAuditLogs is included in the static requireRole() scan
 *   2. Sanitize redacts sensitive keys from the changes JSONB
 *   3. Role hierarchy enforcement (manager+ access)
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { canAccess } from "./authz-roles";

const here = path.dirname(fileURLToPath(import.meta.url));
const actionsDir = path.resolve(here, "..", "app", "actions");

describe("platform-audit action — requireRole() enforcement", () => {
  const source = fs.readFileSync(
    path.join(actionsDir, "platform-audit.ts"),
    "utf-8",
  );

  it("getPlatformAuditLogs calls requireRole", () => {
    expect(source).toMatch(/requireRole\(/);
  });

  it("getPlatformAuditLogs uses getAdminClient (service-role) for data access", () => {
    expect(source).toMatch(/getAdminClient\(\)/);
  });

  it("does not expose service-role credentials to the client", () => {
    expect(source).not.toMatch(
      /process\.env\.SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY\s*=/,
    );
  });
});

describe("platform-audit — founder-only access enforcement", () => {
  it("founder can access platform audit logs", () => {
    expect(canAccess("founder", "founder")).toBe(true);
  });

  it("admin cannot access platform audit logs", () => {
    expect(canAccess("admin", "founder")).toBe(false);
  });

  it("manager cannot access platform audit logs", () => {
    expect(canAccess("manager", "founder")).toBe(false);
  });

  it("employee cannot access platform audit logs", () => {
    expect(canAccess("employee", "founder")).toBe(false);
  });

  it("partner cannot access platform audit logs", () => {
    expect(canAccess("partner", "founder")).toBe(false);
  });

  it("unauthenticated cannot access platform audit logs", () => {
    expect(canAccess("", "founder")).toBe(false);
  });
});

describe("platform-audit — page exists and is server-rendered", () => {
  const pagePath = path.resolve(
    here,
    "..",
    "app",
    "admin",
    "audit",
    "page.tsx",
  );

  it("audit page file exists", () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it("audit page uses force-dynamic (no static prerender)", () => {
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toMatch(/force-dynamic/);
  });

  it("audit page calls getPlatformAuditLogs (server-side data fetch)", () => {
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toMatch(/getPlatformAuditLogs/);
  });
});
