/**
 * Shared E2E fixtures
 * -------------------
 * Every spec imports from here so the suite self-skips when the E2E
 * account isn't provisioned (global-setup sets E2E_READY=1).
 */

import { test as base, expect } from "@playwright/test";

export const E2E_READY = process.env.E2E_READY === "1";

export const test = base;
export { expect };

/** Call at the top of any spec that needs a signed-in account. */
export function requireCreds() {
  test.skip(
    !E2E_READY,
    "E2E account not provisioned (missing Supabase credentials) — suite skipped",
  );
}

/** Unique, cleanup-friendly titles (global-teardown removes `e2e-*` data). */
export function e2eTitle(prefix: string): string {
  return `e2e-${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}
