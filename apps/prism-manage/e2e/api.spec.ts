import { test, expect } from "./fixtures";

/**
 * API surface smoke tests — public endpoints that need no session.
 */
test.describe("api", () => {
  test("health endpoint reports service, db check and integration flags", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());

    const body = await res.json();
    expect(body.service).toBe("prism-manage");
    expect(typeof body.checks?.db?.ok).toBe("boolean");
    expect(typeof body.integrations?.cron).toBe("boolean");
    expect(body.timestamp).toBeTruthy();
  });

  test("calendar cron rejects unauthenticated calls", async ({ request }) => {
    const res = await request.get("/api/calendar/sync");
    expect(res.status()).toBe(401);
  });

  test("github sync rejects unauthenticated calls", async ({
    playwright,
    baseURL,
  }) => {
    // Fresh context WITHOUT the stored session — the route must 401.
    // (newContext inherits the project's storageState unless overridden.)
    const ctx = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const res = await ctx.post("/api/github/sync");
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test("brain ingest rejects calls without the shared secret", async ({
    playwright,
    baseURL,
  }) => {
    const ctx = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const res = await ctx.post("/api/brain/ingest", {
      data: { workspaceId: "x", title: "x", summary: "x" },
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });
});
