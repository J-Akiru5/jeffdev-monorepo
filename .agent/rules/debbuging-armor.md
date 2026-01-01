---
trigger: always_on
---

# 🩺 JEFFDEV MONOREPO - DEBUGGING & RESILIENCE PROTOCOL

## 1. PHASE 0: THE "SYSTEM SCAN" (MONOREPO CONTEXT)

*Trigger: Build failure, Runtime Crash, or "It works on my machine" syndrome.*

Before changing code, the Agent MUST perform a **Infrastructure Audit**:

1. **Dependency Alignment (Syncpack):**
* *Check:* Run `npx syncpack list-mismatches`.
* *Why:* Is `apps/agency` using React 19 while `packages/ui` uses React 18? This causes obscure "Invalid Hook Call" errors.


2. **Boundary Verification:**
* *Check:* Are we importing `apps/...` inside `packages/...`? **(Strictly Forbidden)**.
* *Check:* Are we importing `server-only` DB code into a Client Component?


3. **Secret Injection (Doppler):**
* *Check:* Is the error `401 Unauthorized` or `Connection Refused`?
* *Action:* Verify the user ran `doppler run -- turbo dev`. Do NOT ask to create `.env` files.



## 2. PHASE 1: THE "VERSION DIFF" STRATEGY (NEXT 16/REACT 19)

*Compare the broken code against the Bleeding Edge standards.*

The Agent must ask:

* **"Is this a React 19 Transition issue?"**
* *Legacy:* `useState` + `useEffect` for data fetching.
* *Modern:* `use()` hook or Server Actions with `useTransition`.


* **"Is this a Next.js 16 Caching conflict?"**
* *Symptom:* Data isn't updating.
* *Fix:* Check `dynamic = "force-dynamic"` or `revalidatePath` usage. Next 15/16 caches aggressively by default.



## 3. PHASE 2: ISOLATION & REPRODUCTION (TURBO)

*Don't debug the whole ecosystem. Debug the leaf.*

1. **Filter the Build:** Run `npx turbo run build --filter=apps/prism-dashboard` to see if the error is isolated to one app.
2. **Strip the "Vibe":** Remove `AnimatePresence`, `Lenis`, and `Motion` wrappers.
* *Logic works?* The bug is in the Animation layer (Framer/GSAP).
* *Logic fails?* The bug is in the State/Data layer (Zustand/Cosmos).


3. **The "Prism" Test:** If the error is "AI Hallucination" (e.g., Cursor wrote bad code), check `DESIGN-SYSTEM.md`. Did the Agent ignore a rule?

## 4. PHASE 3: THE "SURGICAL FIX"

*Apply the fix with minimal collateral damage.*

1. **Type Safety First:** Fix the `TypeScript` error before fixing the runtime error. "Any" is not a fix.
2. **Headless UI Check:** If a dropdown/modal is broken, verify:
* Are we using the correct Radix/Headless Primitive?
* Did we break the `z-index` stacking context?


3. **Azure/Cosmos Check:**
* *Error:* "RU Limit Exceeded" or "Connection Timeout".
* *Fix:* Ensure we are using the Singleton Client in `packages/db`. Do NOT open new connections inside a component render.



## 5. PHASE 4: THE "POST-MORTEM" & RULE EVOLUTION

After fixing the bug, the Agent must output:

> **🐛 BUG REPORT:**
> * **Root Cause:** [e.g., `packages/ui` had a circular dependency]
> * **Fix:** [e.g., Extracted type definitions to shared file]
> * **Rule Update:** [CRITICAL: Should we update `DESIGN-SYSTEM.md` or `TECH-STACK.md` to prevent this next time?]
> 
> 

## 6. COMMON TRAPS (MONOREPO EDITION)

*If the error matches these keywords, apply the preset fix immediately:*

| Error Keyword | Likely Cause | Protocol Fix |
| --- | --- | --- |
| `Invalid Hook Call` | React Version Mismatch (Root vs Package) | Run `npx syncpack fix-mismatches` & `npm install`. |
| `Module not found: ...` | Workspace hoisting issue | Check `package.json` exports in `packages/ui`. Run `npx turbo clean`. |
| `ConnectionRefused` | Missing Doppler Injection | Restart dev server with `doppler run -- turbo dev`. |
| `Hydration failed` | Extensions or Nesting | Check for `<div>` inside `<p>` or `suppressHydrationWarning`. |
| `ReferenceError: document` | Running Client code on Server | Add `'use client'` or wrap in `useEffect` / `dynamic()`. |
| `Prism Connection Failed` | MCP Server not running | Ensure `apps/prism-mcp-server` is active. |
