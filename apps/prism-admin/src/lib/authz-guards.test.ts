/**
 * Static authorization-boundary tests.
 *
 * These tests read the source tree and assert the security invariant:
 *
 *   1. Every exported server action MUST call requireRole() — no service-role
 *      operation may execute without an independent authorization check.
 *   2. Every API route MUST call requireRole() — except an explicit allowlist
 *      of intentionally public/alternatively-gated endpoints.
 *   3. Dev-only privilege routes (bootstrap, auth bridge) MUST carry their
 *      explicit env-flag gates in addition to the NODE_ENV check.
 *
 * This is a regression net: if a future action is added without a guard,
 * or an existing guard is removed, this suite fails.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..", "app");

function exportedFunctionSegments(source: string): { name: string; segment: string }[] {
  const declRe = /^export\s+(async\s+)?function\s+(\w+)/gm;
  const decls: { name: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = declRe.exec(source)) !== null) {
    decls.push({ name: match[2]!, index: match.index });
  }
  return decls.map((decl, i) => ({
    name: decl.name,
    segment: source.slice(
      decl.index,
      i + 1 < decls.length ? decls[i + 1]!.index : source.length,
    ),
  }));
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.name === "route.ts") out.push(full);
  }
  return out;
}

describe("server actions — every privileged action verifies authorization", () => {
  const actionsDir = path.resolve(appRoot, "actions");
  const files = fs
    .readdirSync(actionsDir)
    .filter((f) => f.endsWith(".ts"))
    .sort();

  it("finds the action directory", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const source = fs.readFileSync(path.join(actionsDir, file), "utf-8");
    const functions = exportedFunctionSegments(source);

    for (const fn of functions) {
      it(`${file} :: ${fn.name}() requires requireRole()`, () => {
        expect(
          fn.segment,
          `Unprotected server action: ${file} :: ${fn.name}()`,
        ).toMatch(/requireRole\(/);
      });
    }
  }
});

describe("API routes — authorization per route", () => {
  // Intentionally public: strict liveness check, no sensitive data.
  const PUBLIC = new Set(["health"]);
  // Webhook: unauthenticated by design, verified via PayPal signature.
  const WEBHOOKS = new Set(["webhooks/paypal"]);
  // Dev-only privilege routes: must carry their explicit env-flag gates.
  const DEV_FLAG_REQUIREMENTS: Record<string, string> = {
    bootstrap: "ADMIN_BOOTSTRAP_ENABLED",
    "auth/bridge/export": "AUTH_BRIDGE_ENABLED",
    "auth/bridge/import": "AUTH_BRIDGE_ENABLED",
  };
  // The assistant accepts any authenticated user (not manager+), so its
  // boundary is session verification rather than requireRole.
  const AUTHENTICATED_ONLY = new Set(["assistant"]);

  const routeFiles = walkFiles(path.resolve(appRoot, "api")).sort();

  it("finds the API routes", () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  for (const file of routeFiles) {
    const rel = path
      .relative(path.resolve(appRoot, "api"), file)
      .split(path.sep)
      .join("/")
      .replace(/\/route\.ts$/, "");
    const source = fs.readFileSync(file, "utf-8");
    const handlers = exportedFunctionSegments(source);

    if (PUBLIC.has(rel)) {
      it(`${rel} is intentionally public (liveness only)`, () => {
        expect(source).not.toMatch(/getAdminClient|getPrismDb/);
      });
      continue;
    }

    if (WEBHOOKS.has(rel)) {
      it(`${rel} is a signature-verified webhook`, () => {
        expect(source).toMatch(/verifyPayPalWebhook|verification_status/);
      });
      continue;
    }

    if (DEV_FLAG_REQUIREMENTS[rel]) {
      it(`${rel} fails closed behind its env flag`, () => {
        expect(source).toContain(DEV_FLAG_REQUIREMENTS[rel]!);
        expect(source).toMatch(/NODE_ENV !== "development"|NODE_ENV === "development"/);
      });
      continue;
    }

    if (AUTHENTICATED_ONLY.has(rel)) {
      it(`${rel} verifies the caller's session`, () => {
        expect(source).toMatch(/auth\.getUser\(\)/);
      });
      continue;
    }

    expect(handlers.length, `${rel} has HTTP handlers`).toBeGreaterThan(0);
    for (const fn of handlers) {
      it(`${rel} :: ${fn.name}() requires requireRole()`, () => {
        expect(fn.segment, `Unprotected API route: ${rel} :: ${fn.name}()`).toMatch(
          /requireRole\(/,
        );
      });
    }
  }
});
