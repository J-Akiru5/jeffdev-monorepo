/**
 * PayPal Webhook: Signature + Idempotency
 * ----------------------------------------
 * The webhook handler (src/app/api/webhooks/paypal/route.ts) now writes its
 * idempotency ledger to the shared Postgres `webhook_events` table instead
 * of the old Cosmos collection. Two things worth proving:
 *
 * 1. Unsigned/forged requests are still rejected (fail-closed) — this
 *    always runs, needs no setup, and doesn't touch real data.
 * 2. A real, PayPal-signed event is only processed once — sending the same
 *    event twice must short-circuit the second time with `duplicate: true`.
 *
 * Part 2 needs an actual PayPal-signed payload, which isn't something that
 * can be fabricated in a test — the signature is verified against PayPal's
 * live API using their private signing key. Capture one from PayPal's
 * sandbox webhook simulator (Developer Dashboard -> Webhooks -> your
 * webhook -> "Simulate event") and set PAYPAL_TEST_EVENT_JSON +
 * PAYPAL_TEST_SIGNATURE_HEADERS_JSON (see e2e/README.md). Without those,
 * part 2 skips itself with an explanation rather than failing.
 */

import { test, expect } from "@playwright/test";

test.describe("PayPal webhook", () => {
  test("rejects a request with no/invalid signature headers", async ({ request }) => {
    const response = await request.post("/api/webhooks/paypal", {
      data: {
        id: `WH-FORGED-${Date.now()}`,
        event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
        resource: { id: "I-FORGED", status: "ACTIVE", custom_id: "not-a-real-user" },
      },
      headers: {
        "paypal-transmission-id": "forged",
        "paypal-transmission-sig": "forged",
        "paypal-cert-url": "https://example.invalid/cert",
        "paypal-auth-algo": "SHA256withRSA",
      },
    });

    // verifyPayPalWebhook() calls PayPal's real verify-webhook-signature API;
    // a forged signature must come back not-SUCCESS, and the route must
    // return 401 without ever touching prism_subscriptions/webhook_events.
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid signature");
  });

  const rawTestEvent = process.env.PAYPAL_TEST_EVENT_JSON;
  const rawTestHeaders = process.env.PAYPAL_TEST_SIGNATURE_HEADERS_JSON;
  const hasSignedFixture = Boolean(rawTestEvent && rawTestHeaders);

  test(
    "processes a real signed event once, then short-circuits as duplicate",
    async ({ request }) => {
      test.skip(
        !hasSignedFixture,
        "Set PAYPAL_TEST_EVENT_JSON + PAYPAL_TEST_SIGNATURE_HEADERS_JSON from PayPal's sandbox webhook simulator to run this. See e2e/README.md.",
      );

      const event = JSON.parse(rawTestEvent!);
      const headers = JSON.parse(rawTestHeaders!);

      const first = await request.post("/api/webhooks/paypal", {
        data: event,
        headers,
      });
      expect(first.ok()).toBeTruthy();
      const firstBody = await first.json();
      expect(firstBody.received).toBe(true);
      expect(firstBody.duplicate).toBeFalsy();

      // Same event id, sent again — must be recognized via the
      // webhook_events(provider, event_id) unique constraint and
      // short-circuited before any subscription/usage row is touched again.
      const second = await request.post("/api/webhooks/paypal", {
        data: event,
        headers,
      });
      expect(second.ok()).toBeTruthy();
      const secondBody = await second.json();
      expect(secondBody.received).toBe(true);
      expect(secondBody.duplicate).toBe(true);
    },
  );
});
