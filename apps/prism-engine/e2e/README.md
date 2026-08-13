# prism-engine E2E tests

These run against a **real environment** — real Supabase Auth, real
`prism_*` Postgres tables. There's no mock/stub backend here; the point of
`prism-migration-smoke.spec.ts` is proving the Cosmos DB → Postgres
migration (see [`PRISM_MIGRATION.md`](../../../PRISM_MIGRATION.md)) actually
works against a live database, not a fixture.

## Setup

1. Install Playwright's browser binary once (not committed, ~300MB):

   ```bash
   pnpm --filter prism-engine exec playwright install chromium
   ```

2. Create a **disposable test account** in whatever Supabase project you're
   pointing at — don't use your personal/founder account, these tests create
   and delete real rows under it. Easiest way: sign up normally through
   `/sign-up` in the environment you're testing, or use
   `supabase.auth.admin.createUser()` the same way `scripts/seed-founder.ts`
   does.

3. Set environment variables for the run:

   ```bash
   # Required for the migration smoke test
   export E2E_BASE_URL=https://prism.syntaxure.dev   # or http://localhost:3001
   export E2E_TEST_EMAIL="your-disposable-test-account@example.com"
   export E2E_TEST_PASSWORD="..."

   # Optional — only needed for the PayPal signed-event idempotency check;
   # everything else runs without these. See "PayPal fixture" below.
   export PAYPAL_TEST_EVENT_JSON='{...}'
   export PAYPAL_TEST_SIGNATURE_HEADERS_JSON='{...}'
   ```

   If `E2E_BASE_URL` points at `localhost`, the config will start
   `pnpm --filter prism-engine dev` for you (needs your usual `.env.local` /
   Doppler setup to actually boot with real Supabase credentials). Against
   any other URL (a deployed/staging environment) it skips that and just
   points the browser there directly.

## Run

```bash
pnpm --filter prism-engine run test:e2e
```

Or a single file:

```bash
pnpm --filter prism-engine exec playwright test e2e/prism-migration-smoke.spec.ts
```

Without `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` set, the migration smoke suite
skips itself with an explanation instead of failing — same for the PayPal
signed-event test without the two `PAYPAL_TEST_*` vars.

## What each spec covers

- **`prism-migration-smoke.spec.ts`** — sign in → create a project → create
  a rule → read it back after a fresh page load (proves it's actually
  persisted in Postgres, not just optimistic UI state) → read it via the
  `/api/v1/rules` REST endpoint → read it via the MCP `get_architectural_rules`
  tool call (`/api/mcp/stdio`) → deletes the test project it created.
- **`paypal-webhook-idempotency.spec.ts`** — always verifies a forged/unsigned
  webhook request is rejected (fail-closed, no setup needed). The second
  test, which proves a real signed event is only processed once, needs a
  genuine PayPal-signed payload — see below.

## PayPal fixture (optional)

PayPal's webhook signature is verified against PayPal's own API using their
private signing key — there's no way to fabricate a valid one in a test, and
it shouldn't be possible to. To get a real one:

1. PayPal Developer Dashboard → your sandbox app → Webhooks → your webhook →
   **Simulate event** → pick `BILLING.SUBSCRIPTION.ACTIVATED`.
2. Capture the request PayPal sends to your webhook URL — both the JSON body
   and these headers: `paypal-transmission-id`, `paypal-transmission-sig`,
   `paypal-cert-url`, `paypal-auth-algo`. (Easiest way: point the simulator
   at a temporary request-bin URL, or read them off your own server logs if
   `PAYPAL_WEBHOOK_ID` is already configured in the target environment.)
3. Set `PAYPAL_TEST_EVENT_JSON` to the body and
   `PAYPAL_TEST_SIGNATURE_HEADERS_JSON` to a JSON object of those four
   headers, then re-run.

Note PayPal-signed events are typically single-use/time-boxed on PayPal's
side, so a captured fixture may only be replayable for a limited window —
if the "first" call in the test starts failing signature verification, the
fixture has likely expired and needs recapturing.
