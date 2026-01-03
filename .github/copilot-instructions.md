# JeffDev Monorepo - AI Agent Guidelines

## Architecture Overview

This is a **Turborepo monorepo** with 4 apps and 3 shared packages:

**Apps:**
- `apps/agency` (port 3000) - JeffDev Studio marketing + admin CRM (Firebase, Next.js 16)
- `apps/prism-dashboard` (port 3001) - SaaS platform for AI context rules (Clerk auth, Cosmos DB)
- `apps/prism-docs` (port 3002) - Documentation site (Nextra 4)
- `apps/prism-mcp-server` - Model Context Protocol server (stdio transport)

**Shared Packages:**
- `@jdstudio/ui` - Ghost Glow component library (Button, Card, Badge, Input, ProgressBar, DataTable)
- `@jeffdev/db` - Firebase/Cosmos DB clients with Zod schemas (`packages/db/src/schema.ts`)
- `@repo/eslint-config`, `@repo/typescript-config` - Shared configs

## Critical Build & Dev Workflows

**Prerequisites:** Node.js >=18, Doppler CLI (for secrets)

```bash
# Root commands (run all apps in parallel)
doppler run -- turbo dev        # Start all apps
doppler run -- turbo build      # Build all apps
turbo run lint                  # Lint all workspaces
turbo run check-types           # TypeScript checks

# App-specific commands
cd apps/agency
npm run dev                     # Start agency on :3000
npm run test                    # Run Vitest + Playwright tests
npm run test:unit:watch         # Watch mode for unit tests
npm run test:e2e:ui             # Playwright UI mode

cd apps/prism-dashboard
npm run dev                     # Start Prism on :3001
```

**Environment:** All secrets managed via **Doppler**. Do NOT commit `.env` files. Required vars listed in `turbo.json` globalEnv.

## Next.js 14+ Server/Client Boundary Rules

**🚨 CRITICAL:** Firestore `Timestamp` objects CANNOT pass from Server → Client Components.

```typescript
// ❌ BAD - Will crash: "Classes or null prototypes are not supported"
return snapshot.docs.map(doc => ({ ...doc.data() })); // createdAt is Timestamp!

// ✅ GOOD - Always serialize Timestamps
return snapshot.docs.map(doc => {
  const data = doc.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.() 
      ? data.createdAt.toDate().toISOString() 
      : data.createdAt || new Date().toISOString(),
  };
});
```

**Files to watch:** `apps/agency/src/app/actions/*.ts` - all server actions returning Firestore data.

**Force dynamic rendering** when Server Components need fresh data:
```typescript
import { cookies } from 'next/headers';
export default async function Page() {
  await cookies(); // Forces dynamic rendering
}
```

## Firestore Data Architecture (Agency App)

**Required collections:**
- `users` (key: Firebase Auth UID) - User profiles with RBAC roles (founder > admin > partner > employee)
- `invites`, `projects`, `quotes`, `invoices`, `messages`, `notifications`, `subscriptions`, `audit_logs`, `calendar_events`, `services`, `feedback`

**Bootstrap Founder:** If `users` collection missing or user doc doesn't exist:
- UI defaults to `role: 'employee'` (bad state)
- **Fix:** Go to `/admin/settings` → Click "Bootstrap as Founder" OR run `npx tsx apps/agency/scripts/seed-founder.ts`

## Component Patterns

**Admin Pages (Server Components):**
```typescript
import { cookies } from 'next/headers';
import { SomeAction } from '@/app/actions/something';
import { ClientComponent } from '@/components/admin/client-component';

export default async function AdminPage() {
  await cookies(); // Force dynamic
  const data = await SomeAction();
  return <ClientComponent data={data} />; // Data must be serializable!
}
```

**Client Components (*-client.tsx):**
- Always use `'use client';` directive
- Use `toast` from `sonner` for user feedback
- Use `startTransition` for non-urgent updates

**Server Actions:**
- Place in files with `'use server';` directive
- Return `{ success: boolean; error?: string }` pattern
- Serialize all Firestore Timestamps before returning
- Call `revalidatePath('/admin/route')` to refresh cached data

## File Uploads (R2 Cloudflare Storage)

**Flow:**
1. Client calls `getSignedUploadUrl(filename, filetype)` server action
2. Server generates presigned PUT URL from R2
3. Client uploads directly to R2
4. Files served via `/api/file/[...path]` proxy route

**Common errors:**
- CORS issues → Use proxy route, NOT direct R2 URLs
- 404 on images → Check `NEXT_PUBLIC_SITE_URL` in env
- Upload fails → Verify R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`)

## Shared Component Library (@jdstudio/ui)

```tsx
import { Button, Card, Badge } from "@jdstudio/ui";

<Card variant="interactive">
  <Button variant="cyan">Deploy</Button>
  <Badge variant="success">Active</Badge>
</Card>
```

**Available variants:** Check `packages/ui/src/` for buttonVariants, cardVariants, badgeVariants.

## Common Error Patterns

| Error | Cause | Fix |
|-------|-------|-----|
| "Only plain objects can be passed to Client Components" | Firestore Timestamp in props | Serialize to ISO string in server action |
| 404 on admin route | Route doesn't exist | Create `apps/agency/src/app/admin/[route]/page.tsx` |
| User shows "Employee" role | Missing user doc in Firestore | Run bootstrap seed script |
| Invite link 404 | Missing route | Create `apps/agency/src/app/auth/invite/[token]/page.tsx` |

## Debugging Checklist

1. **Serialization error?** → Check for Firestore Timestamps in server action returns
2. **404?** → Verify route exists at `src/app/[path]/page.tsx`
3. **Auth error?** → Check if user document exists in Firestore `users` collection
4. **Data stale?** → Add `revalidatePath()` to server action

## Key Files

- `apps/agency/docs/AGENT_RULES.md` - Detailed agency app patterns
- `packages/db/src/schema.ts` - Zod schemas (single source of truth)
- `packages/ui/src/index.ts` - Available UI components
- `turbo.json` - Turborepo task config
- `apps/agency/src/components/admin/sidebar.tsx` - Admin navigation structure
