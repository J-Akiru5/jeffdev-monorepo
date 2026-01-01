
# 🔧 JEFFDEV AGENCY - ADMIN SYSTEM NAVIGATION RULES

## 1. NEXT.JS 14+ SERVER/CLIENT BOUNDARIES

### A. The Serialization Rule
**CRITICAL**: Firestore `Timestamp` objects CANNOT be passed from Server Components to Client Components.

```typescript
// ❌ BAD - Will crash with "Classes or null prototypes are not supported"
return snapshot.docs.map((doc) => ({
  ...doc.data(), // createdAt is a Firestore Timestamp!
}));

// ✅ GOOD - Serialize Timestamps to ISO strings
return snapshot.docs.map((doc) => {
  const data = doc.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.() 
      ? data.createdAt.toDate().toISOString() 
      : data.createdAt || new Date().toISOString(),
  };
});
```

**Files to watch:**
- `src/app/actions/*.ts` - All server actions returning Firestore data
- Any Server Component passing props to `*-client.tsx` components

### B. Dynamic vs Static Rendering
Server Components that need fresh data must opt-out of static rendering:
```typescript
import { cookies } from 'next/headers';

export default async function Page() {
  await cookies(); // Forces dynamic rendering
  // ...
}
```

---

## 2. FIRESTORE DATA ARCHITECTURE

### A. Required Collections
| Collection | Purpose | Document ID |
|------------|---------|-------------|
| `users` | User profiles & RBAC | Firebase Auth UID |
| `invites` | Magic link invites | Auto-generated |
| `projects` | Client projects | Auto-generated |
| `quotes` | Lead quotes | Auto-generated |
| `invoices` | Billing | Auto-generated |
| `messages` | Internal messaging | Auto-generated |
| `notifications` | In-app notifications | Auto-generated |
| `subscriptions` | Recurring services | Auto-generated |
| `audit_logs` | System audit trail | Auto-generated |
| `calendar_events` | Team calendar | Auto-generated |
| `services` | Service catalog | Slug-based |
| `feedback` | Client feedback | Auto-generated |

### B. User Document Schema (Critical)
If `users` collection is missing or document doesn't exist:
- `/api/users/[uid]` returns 404
- `user-context.tsx` falls back to `role: 'employee'`
- Profile updates will fail

**Bootstrap Action**: `src/app/actions/seed.ts` → `bootstrapCurrentUserAsFounder()`

### C. Timestamp Handling
When READING from Firestore in Server Actions:
```typescript
// Always check if it's a Timestamp before calling toDate()
data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt
```

When WRITING to Firestore:
```typescript
import { Timestamp } from 'firebase-admin/firestore';
// Use Timestamp for server actions
createdAt: Timestamp.now()

// Or use ISO strings if you prefer consistency
createdAt: new Date().toISOString()
```

---

## 3. ROUTING & NAVIGATION

### A. Admin Route Structure
```
/admin
├── /access          → Role-based access control UI
├── /audit           → Audit log viewer
├── /calendar        → Team calendar
├── /feedback        → Client feedback
├── /invoices        → Billing management
│   ├── /[id]        → Invoice detail
│   └── /new         → Create invoice
├── /login           → Auth entry point
├── /messages        → Internal messaging
├── /profile         → User profile settings
├── /projects        → Project management
│   └── /[slug]      → Project detail
├── /quotes          → Lead/quote management
├── /services        → Service catalog
├── /settings        → App configuration
│   ├── /app         → General settings
│   ├── /emails      → Email templates
│   ├── /notifications → Notification settings
│   ├── /security    → Security settings
│   └── /theme       → Theme customization
├── /subscriptions   → Subscription management
└── /users           → Team member management
```

### B. Public Routes with Auth Sessions
- `/auth/invite/[token]` → Invite acceptance page
- `/api/auth/invite` → Redirects to login with invite token
- `/card/[username]` → Public digital namecard

### C. Missing Route Detection
If sidebar shows a route that 404s:
1. Check `src/components/admin/sidebar.tsx` for the `href`
2. Verify the page exists at `src/app/admin/[route]/page.tsx`
3. Create the page if missing

---

## 4. AUTHENTICATION & RBAC

### A. Role Hierarchy
```
founder > admin > partner > employee
```

### B. User Context Flow
1. Firebase Auth (`onAuthStateChanged`)
2. Fetch profile: `GET /api/users/[uid]`
3. If 404: Fallback to `role: 'employee'` (BAD STATE)
4. Proper fix: Create user document in Firestore

### C. Custom Claims
Firebase Admin SDK sets custom claims for serverside auth:
```typescript
await adminAuth.setCustomUserClaims(uid, { role: 'founder' });
```

---

## 5. FILE UPLOADS (R2)

### A. Flow
1. Client calls `getSignedUploadUrl(filename, filetype)` server action
2. Server generates presigned PUT URL from R2
3. Client uploads directly to R2
4. File served via `/api/file/[...path]` proxy

### B. Common Errors
- **CORS errors**: Use the proxy route, not direct R2 URLs
- **404 on images**: Check `NEXT_PUBLIC_SITE_URL` in Vercel env
- **Upload fails**: Verify R2 credentials in `.env.local`

---

## 6. ENVIRONMENT VARIABLES

### A. Required for Production
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID  # GA4

# Firebase Admin (Server-side only)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY

# R2 Storage
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ACCOUNT_ID
R2_PUBLIC_URL

# App Config
NEXT_PUBLIC_SITE_URL=https://jeffdev.studio
NEXT_PUBLIC_BASE_URL=https://jeffdev.studio
```

### B. Common Mistakes
- Using `NEXT_PUBLIC_GA_ID` when `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` exists
- Missing `NEXT_PUBLIC_SITE_URL` in production (breaks file URLs)
- Private key escaping: Must have `\\n` in `.env` files

---

## 7. ERROR PATTERNS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| "Only plain objects can be passed to Client Components" | Firestore Timestamp in props | Serialize to ISO string |
| 404 on `/admin/access` | Route doesn't exist | Create `src/app/admin/access/page.tsx` |
| User shows "Employee" | Missing user document in Firestore | Run bootstrap seed or create manually |
| Profile update fails | No user document exists | Bootstrap user first |
| Invite link 404 | Missing `/auth/invite/[token]` route | Create the route |
| GA4 not tracking | Wrong env var name | Use `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` |
| File upload 404 | R2 not configured or wrong URL | Check R2 env vars and proxy route |
| Duplicate key error in sidebar | Two nav items with same `href` | Make hrefs unique |

---

## 8. COMPONENT PATTERNS

### A. Admin Pages (Server Components)
```typescript
import { cookies } from 'next/headers';
import { SomeAction } from '@/app/actions/something';
import { ClientComponent } from '@/components/admin/client-component';

export default async function AdminPage() {
  await cookies(); // Force dynamic
  const data = await SomeAction();
  
  return (
    <div>
      <ClientComponent data={data} /> {/* Data must be serializable! */}
    </div>
  );
}
```

### B. Client Components (*-client.tsx)
- Always mark with `'use client';`
- Handle loading states
- Use `toast` from sonner for feedback
- Use `startTransition` for non-urgent updates

### C. Server Actions
- Always in files with `'use server';`
- Return `{ success: boolean; error?: string }` pattern
- Serialize all Timestamps
- Use `revalidatePath()` to refresh data

---

## 9. DEBUGGING CHECKLIST

When something breaks in the admin panel:

1. **Check the error type**:
   - Serialization error? → Timestamp issue
   - 404? → Missing route or API endpoint
   - Auth error? → User document missing

2. **Check the data flow**:
   - Server Action → returns what?
   - API Route → responds with what?
   - Client receives → can it serialize?

3. **Check Firestore**:
   - Does the collection exist?
   - Does the document exist?
   - Are Timestamps properly formatted?

4. **Check Environment**:
   - All required env vars set?
   - Production vs Development differences?

---

## 10. QUICK FIXES

### Bootstrap Founder Account
Go to `/admin/settings` → System Info → Click "Bootstrap as Founder"

### Seed Script (If Bootstrap Button Doesn't Work)
```bash
npx tsx scripts/seed-founder.ts
```
Note: Requires the email to exist in Firebase Auth first.

### Force Refresh Data
Server Actions use `revalidatePath()`:
```typescript
import { revalidatePath } from 'next/cache';
revalidatePath('/admin/users');
```
