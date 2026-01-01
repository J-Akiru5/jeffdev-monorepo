---
trigger: always_on
---

# 🔒 JEFFDEV MONOREPO - SECURITY & PERFORMANCE CONSTITUTION

## 1. THE "ZERO TRUST" SECURITY GATE

*Goal: Harden the ecosystem against leaks, injection, and unauthorized access.*

### A. The "Doppler" Law (Secret Management)

* **Strict Ban:** **NEVER** use, create, or read `.env` files manually in production or shared branches.
* **Injection Protocol:** All secrets must be injected via Doppler.
* *Local Dev:* `doppler run -- turbo dev`
* *CI/CD:* Use the Doppler Integration token in GitHub Actions.


* **Frontend Leakage:** NEVER assign a `NEXT_PUBLIC_` prefix to a private key (e.g., Cosmos Key, Firebase Admin SDK). Only public identifiers (e.g., `NEXT_PUBLIC_FIREBASE_PROJECT_ID`) are allowed.

### B. Input Hygiene (Zod + DOMPurify)

* **The "Zod Gate":** Every Server Action (Next.js) and API Route (Node.js/MCP) MUST validate inputs.
```typescript
// STANDARD PATTERN
import { z } from "zod";
const schema = z.object({
  email: z.string().email(),
  // Sanitize rich text inputs before Zod validation if needed
  content: z.string().max(5000)
});

export async function createEntry(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Validation Failed");
  // ... logic
}

```


* **HTML Rendering:** strictly forbid `dangerouslySetInnerHTML` unless absolutely necessary (e.g., rendering a blog post). If used, it MUST be wrapped in `DOMPurify.sanitize()`.

### C. Database Isolation Protocols

* **Agency App (Firebase):**
* **Rules:** Default to `allow read, write: if false;`. Explicitly whitelist collections.
* **Validation:** Enforce schema validation in `firestore.rules` (e.g., `request.resource.data.title is string`).


* **Prism Engine (Azure Cosmos):**
* **Connection:** Use the `packages/db` singleton client. Do not create new connections per request.
* **NoSQL Injection:** Use parameterized queries or the Cosmos SDK's built-in binding. Never concat strings into a query.



---

## 2. INP & VIBE OPTIMIZATION (THE "INSTANT RESPONSE" MANDATE)

*Goal: Interaction to Next Paint (INP) < 200ms. The app must "feel" native.*

### A. The "Optimistic Vibe" Pattern

* **Rule:** The UI must lie to the user that the action is done before the server confirms it.
* **Tool:** Use `useOptimistic` (Next.js) or `TanStack Query` (optimistic updates).
* *User clicks "Save Rule"* → *UI instantly shows "Rule Saved"* → *Background syncs to Azure*.


* **Feedback:** All interactive elements (`package/ui`) must have `:active` states (scale 0.98) defined in Tailwind (`active:scale-95 transition-transform`).

### B. Heavy Task Segmentation (Yielding to Main Thread)

* **React 19 Transitions:** Wrap expensive state updates (e.g., filtering the Prism Rule Library) in `startTransition`.
```tsx
const [isPending, startTransition] = useTransition();
// Keeps the UI buttery smooth while the filter algorithm runs
<input onChange={(e) => startTransition(() => setFilter(e.target.value))} />

```


* **Debouncing:** Search bars in the Client Portal and Prism Dashboard MUST be debounced (300ms).

### C. Headless UI Performance

* **The "Radix" Advantage:** Use **Headless UI** or **Radix Primitives** for complex interactions (Dialogs, Popovers, Tabs).
* *Why:* They handle focus management and keyboard navigation off the main thread better than custom React `useEffect` spaghetti.


* **Animation:** Use **CSS Variables** + Tailwind for simple transitions. Use **Framer Motion** (lazy loaded) only for complex layout shifts.

---

## 3. INFRASTRUCTURE DEFENSE

### A. Middleware Shield (Next.js)

* **Rate Limiting (Prism SaaS):** Implement `upstash/ratelimit` (or similar Redis logic) on the `apps/prism-dashboard/middleware.ts`.
* *Limit:* 10 requests / 10 seconds per IP for API routes.


* **Auth Guard:** Middleware must verify the session (Firebase or Clerk) *before* the request hits the layout.

### B. Headers & CSP

configure `next.config.mjs` in both apps to inject:

* `X-Content-Type-Options: nosniff`
* `Referrer-Policy: origin-when-cross-origin`
* `Strict-Transport-Security` (HSTS)
* `Permissions-Policy`: Block microphone/camera unless explicitly needed.