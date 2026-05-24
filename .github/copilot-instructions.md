# JeffDev Monorepo - Comprehensive AI Agent Guidelines

## ⚡ Quick Start

**Prerequisites:** Node.js >=18, Doppler CLI  
**Environment:** All secrets via Doppler (never commit `.env`)

```bash
doppler run -- turbo dev        # Start all apps
turbo run build                 # Build all workspaces
turbo run lint                  # Lint all apps
```

See [.agent/skills/](./skills/) for detailed guides on:

- **[Prism Development](../.agent/skills/prism-development.md)** - Building Prism SaaS apps
- **[Firestore Server Boundaries](../.agent/skills/firestore-server-boundaries.md)** - Next.js 16 serialization
- **[Design System](../.agent/skills/design-system-implementation.md)** - Ghost Glow UI patterns
- **[Monorepo Structure](../.agent/skills/monorepo-structure.md)** - Turborepo patterns

---

## 🏗️ Monorepo Architecture

**Turborepo** with **7 apps** and **5 packages**:

### Apps

| App                                | Port | Purpose                       | Tech                           |
| ---------------------------------- | ---- | ----------------------------- | ------------------------------ |
| **agency**                         | 3000 | Marketing site + Admin CRM    | Next.js 16 + Firebase          |
| **prism-dashboard**                | 3001 | SaaS platform for rules       | Next.js 16 + Cosmos DB + Clerk |
| **prism-mcp-server**               | —    | Model Context Protocol server | Node.js 20 + MCP SDK           |
| **prism-docs**                     | 3002 | Documentation site            | Nextra 4                       |
| **prism-exercise**                 | 3003 | Practice platform             | Next.js 16 + Supabase          |
| **prism-admin**                    | 3004 | System admin dashboard        | Next.js 16 + Firebase          |
| **joularix, mht, nexure, tracker** | —    | Additional specialized apps   | Next.js 16                     |

### Shared Packages

| Package                       | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| **`@jdstudio/ui`**            | Ghost Glow components (Button, Card, Badge, Input, etc.) |
| **`@syntaxure-labs/db`**      | Firebase/Cosmos DB clients with Zod schemas              |
| **`@repo/eslint-config`**     | Shared ESLint rules                                      |
| **`@repo/typescript-config`** | Shared TypeScript configs                                |
| **`prism-cli`**               | CLI for Prism context operations                         |

---

## 🎯 Core Development Patterns

### 1️⃣ Next.js 16 Server/Client Boundaries

**CRITICAL: Firestore `Timestamp` objects CANNOT pass Server → Client:**

```typescript
// ❌ CRASHES: "Only plain objects can be passed to Client Components"
return snapshot.docs.map((doc) => ({ ...doc.data() }));

// ✅ CORRECT: Serialize at the boundary
return snapshot.docs.map((doc) => {
  const data = doc.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString(),
  };
});
```

**Watch files:** `apps/agency/src/app/actions/*.ts` (all server actions)

### 2️⃣ Force Dynamic Rendering for Admin Pages

```typescript
import { cookies } from "next/headers";

export default async function AdminPage() {
  await cookies(); // ⚡ Forces dynamic (no cache)
  // ... fetch fresh data
}
```

### 3️⃣ Component Architecture

**Server Components (Pages):**

- Call server actions to fetch data
- Serialize Timestamps before passing to client
- Use `revalidatePath()` to invalidate caches

**Client Components (`*-client.tsx`):**

- Always use `'use client';` directive
- Handle state with `useState` / `useTransition` / Zustand
- Use `toast` from `sonner` for feedback
- Wrap expensive updates in `startTransition`

**Server Actions (`'use server'`):**

- Place in dedicated `.ts` files
- Return `{ success: boolean; error?: string }` pattern
- Validate inputs with **Zod**
- Serialize all Timestamps
- Call `revalidatePath()` to refresh UI

---

## 🔐 Security & Performance Essentials

**See:** [.agent/rules/security-guard.md](.agent/rules/security-guard.md) and [.agent/rules/debbuging-armor.md](.agent/rules/debbuging-armor.md)

### Input Validation

- **Zod gates** on all server actions & API routes
- Never use `dangerouslySetInnerHTML` (unless wrapped in `DOMPurify.sanitize()`)
- Validate rich text **before** Zod parsing if needed

### Database Isolation

- **Firebase:** Whitelist collections in `firestore.rules`
- **Cosmos DB:** Use SDK's parameterized queries (no string concat)
- Always use `packages/db` singleton clients

### Rate Limiting & Headers

- Upstash Redis on sensitive API routes (max 10 req/10s)
- Configure CSP, HSTS, and X-Content-Type-Options in `next.config.mjs`

---

## 📊 Data Architecture

### Agency App (Firestore)

**Collections:**

- `users` (UID-keyed) → Profiles + RBAC (founder > admin > partner > employee)
- `projects`, `invoices`, `messages`, `notifications`, `audit_logs`, `services`, `feedback`, etc.

**Bootstrap Founder:**

```bash
npx tsx apps/agency/scripts/seed-founder.ts
# OR go to /admin/settings → "Bootstrap as Founder"
```

### Prism Apps (Cosmos DB)

**Models:** Users, Rules, Projects, Subscriptions, Video Metadata

**SDK:** `@syntaxure-labs/db` exports `getPrismContainer()` singleton

---

## 📁 Storage & Assets

**R2 Cloudflare (Object Storage):**

1. Client calls `getSignedUploadUrl(filename, filetype)` (server action)
2. Client uploads directly to R2 (no server overhead)
3. Served via `/api/file/[...path]` proxy (bypasses Vercel bandwidth limits)

**Common errors:**

- CORS 403 → Use proxy route, NOT direct R2 URLs
- 404 images → Check `NEXT_PUBLIC_SITE_URL` env var
- Upload fails → Verify `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

---

## 🎨 Design System & Components

**See:** [.agent/skills/design-system-implementation.md](./skills/design-system-implementation.md)

### Principles

- **Dark mode only:** `#050505` void + glassmorphic overlays
- **Ghost Glow buttons:** Borders that glow on hover (no solid fills)
- **Precision typography:** Inter (headings), JetBrains Mono (code/data)
- **Mobile-first:** Sidebar → Bottom navigation on mobile

### Component Library (`packages/ui`)

```tsx
import { Button, Card, Badge } from "@jdstudio/ui";

<Card variant="interactive">
  <Button variant="cyan">Execute_</Button>
  <Badge variant="success">Active</Badge>
</Card>;
```

**Check `packages/ui/src/` for all variants and available components.**

---

## 🐛 Debugging Checklist

| Symptom                                                 | Root Cause                           | Fix                                                        |
| ------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| "Only plain objects can be passed to Client Components" | Firestore Timestamp in props         | Serialize to ISO in server action                          |
| 404 on admin route                                      | Route file missing                   | Create `src/app/admin/[route]/page.tsx`                    |
| User defaults to "Employee" role                        | No user doc in Firestore             | Run bootstrap seed script                                  |
| Hydration mismatch                                      | Nesting violation or dynamic content | Check `<div>` inside `<p>`, add `suppressHydrationWarning` |
| "ReferenceError: document is not defined"               | Client code on server                | Add `'use client'` directive or wrap in `useEffect`        |
| Data is stale after mutation                            | Cache not invalidated                | Add `revalidatePath()` to server action                    |
| Invalid Hook Call                                       | React version mismatch               | Run `npx syncpack fix-mismatches && npm install`           |
| Connection refused to Cosmos                            | Doppler not injecting secrets        | Use `doppler run -- turbo dev`                             |

---

## 🔑 Key Files & References

- [.agent/rules/](./rules/) — Tech stack, security, design, debugging, business logic
- [apps/agency/docs/AGENT_RULES.md](../apps/agency/docs/AGENT_RULES.md) — Detailed agency patterns
- [packages/db/src/schema.ts](../packages/db/src/schema.ts) — Zod schemas (single source of truth)
- [packages/ui/src/index.ts](../packages/ui/src/index.ts) — Available components
- [turbo.json](../turbo.json) — Build & dev tasks config
- [PRISM_APPS_COMPREHENSIVE_GUIDE.md](../PRISM_APPS_COMPREHENSIVE_GUIDE.md) — Full Prism ecosystem overview
