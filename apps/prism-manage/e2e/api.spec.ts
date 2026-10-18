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
});
