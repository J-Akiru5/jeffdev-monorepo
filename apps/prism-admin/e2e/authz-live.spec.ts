import { test, expect } from "@playwright/test";

const EMPLOYEE = {
  email: "test-employee@syntaxure.dev",
  password: "TestEmployee123!@#",
};

const ADMIN = {
  email: "test-admin@syntaxure.dev",
  password: "TestAdmin123!@#",
};

test.describe("Authorization boundary (live)", () => {
  test("employee authenticates but is rejected from privileged routes", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', EMPLOYEE.email);
    await page.fill('input[type="password"]', EMPLOYEE.password);
    await page.click('button[type="submit"]');

    // Employee role → admin layout redirects to /unauthorized
    await page.waitForURL(/unauthorized/, { timeout: 15000 });

    const pricing = await page.request.get("/api/admin/pricing");
    expect(pricing.status()).toBe(403);

    const charts = await page.request.get("/api/agency/dashboard/charts");
    expect(charts.status()).toBe(403);

    const subscription = await page.request.patch("/api/admin/subscription", {
      data: {
        userId: "00000000-0000-0000-0000-000000000000",
        tier: "pro",
      },
    });
    expect(subscription.status()).toBe(403);

    const milestones = await page.request.get(
      "/api/agency/projects/demo/milestones",
    );
    expect(milestones.status()).toBe(403);
  });

  test("unauthenticated callers are rejected from privileged routes", async ({
    request,
  }) => {
    const pricing = await request.get("/api/admin/pricing");
    expect(pricing.status()).toBe(401);

    const charts = await request.get("/api/agency/dashboard/charts");
    expect(charts.status()).toBe(401);

    const assistant = await request.post("/api/assistant", {
      data: { message: "hello" },
    });
    expect(assistant.status()).toBe(401);

    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
  });

  test("admin passes the manager+/admin+ gates (read-only checks)", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', ADMIN.email);
    await page.fill('input[type="password"]', ADMIN.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 15000 });

    const pricing = await page.request.get("/api/admin/pricing");
    expect(pricing.status()).toBe(200);

    const faqs = await page.request.get("/api/admin/pricing/faqs");
    expect(faqs.status()).toBe(200);

    const subscriptions = await page.request.get("/api/admin/subscription");
    expect(subscriptions.status()).toBe(200);
  });
});
