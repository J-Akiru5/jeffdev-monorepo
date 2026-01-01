---
trigger: always_on
---

# 🔧 JEFFDEV MONOREPO - ADMIN SYSTEM CONSTITUTION

## 1. NEXT.JS 16+ SERVER/CLIENT BOUNDARIES

### A. The Serialization Rule (The "Timestamp Killer")

**CRITICAL:** Firestore `Timestamp` objects **CANNOT** be passed directly from Server Components to Client Components. Next.js 16 will throw a "Plain Object" error immediately.

```typescript
// ❌ BAD - Will crash application
return snapshot.docs.map((doc) => ({
  ...doc.data(), // createdAt is a Timestamp!
}));

// ✅ GOOD - Serialize at the Boundary
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

**Watchlist:** Check `src/app/actions/*.ts` and any prop passed to `*-client.tsx`.

### B. Dynamic vs Static Rendering

Admin data is *always* dynamic. Do not let Next.js cache the Dashboard.

```typescript
import { cookies } from 'next/headers';

export default async function AdminPage() {
  await cookies(); // ⚡ Force dynamic rendering
  // ... fetch data
}

```

---

## 2. FIRESTORE DATA ARCHITECTURE

### A. The "Big 12" Collections

| Collection | Purpose | ID Strategy |
| --- | --- | --- |
| `users` | RBAC & Profiles | **Auth UID** (Critical) |
| `projects` | Client Workspaces | Auto-gen |
| `invoices` | Billing & Stripe/PayPal | Auto-gen |
| `messages` | Internal Chat | Auto-gen |
| `notifications` | In-App Alerts | Auto-gen |
| `audit_logs` | Security Trail | Auto-gen |
| `services` | Product Catalog | **Slug** (e.g., `web-dev-pack`) |
| `feedback` | Client ROI Data | Auto-gen |
| *(Plus: invites, quotes, subscriptions, calendar_events)* |  |  |

### B. User Document Schema Protocol

* **Logic:** If `users/{uid}` does not exist, the app **MUST** break/redirect.
* **Fallback:** `user-context.tsx` defaults to `role: 'employee'` (Lowest Access) until the document is found.
* **Recovery:** Run `src/app/actions/seed.ts` -> `bootstrapCurrentUserAsFounder()`.

### C. Write Protocol

When writing to Firestore via `firebase-admin` (Server Action):

```typescript
import { Timestamp } from 'firebase-admin/firestore';
// Standardize on Server Timestamps for accuracy
createdAt: Timestamp.now()

```

---

## 3. ROUTING & NAVIGATION MAP (`/admin`)

### A. The Sidebar Taxonomy

```text
/admin
├── /access          # RBAC (Founder Only)
├── /audit           # Logs (Founder Only)
├── /projects        # Main Workspace
│   └── /[slug]      # Dashboard
├── /invoices        # Financials
├── /messages        # Team Chat
├── /users           # Team Management
└── /settings        # App Config

```

### B. The "Ghost Route" Detector

If a sidebar item clicks to a 404:

1. Check `src/components/admin/sidebar.tsx`.
2. Verify `src/app/admin/[route]/page.tsx` exists.
3. **Fix:** Do not remove the link; build the page.

---

## 4. AUTHENTICATION & RBAC

### A. Role Hierarchy

`founder` > `admin` > `partner` > `employee`

### B. The Auth Pipeline

1. **Trigger:** `onAuthStateChanged` (Client).
2. **Verify:** Fetch `GET /api/users/[uid]`.
3. **Claims:** Use Firebase Custom Claims for *edge* protection (Middleware), but Firestore Data for *app* logic.

---

## 5. INFRASTRUCTURE & STORAGE

### A. R2 Upload Flow (Presigned)

* **Rule:** Client uploads DIRECTLY to R2. Server never touches the binary.
* **Step 1:** Client calls `getSignedUploadUrl(filename)`.
* **Step 2:** Client `PUT` to the returned URL.
* **Step 3:** File is served via Proxy: `https://jeffdev.studio/api/file/[...path]`.

### B. Environment Variables (Doppler Mapped)

Ensure these exist in your **Doppler** config:

* `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
* `FIREBASE_ADMIN_PRIVATE_KEY` (Must handle `\n` escaping)
* `R2_ACCESS_KEY_ID` & `R2_PUBLIC_URL`
* `NEXT_PUBLIC_SITE_URL` (Crucial for OG Images & Redirects)

---

## 6. ERROR PATTERNS & FIXES

| Error | Likely Cause | Protocol Fix |
| --- | --- | --- |
| `Classes or null prototypes...` | Passing Timestamp to Client | Use `.toISOString()` in the Server Action. |
| `User role: Employee` (Unexpected) | Missing Firestore Doc | Run Bootstrap Seed. |
| `404` on Image Upload | R2 Proxy misconfigured | Check `NEXT_PUBLIC_SITE_URL` vs R2 Bucket URL. |
| `Hydration Mismatch` | Admin Sidebar Active State | Move `usePathname` logic to a strictly Client Component. |

---

## 7. DEBUGGING CHECKLIST (THE "ADMIN" AUDIT)

When the Admin Panel breaks:

1. **Serialization Check:** Did you pass a raw object from `firebase-admin` to a generic client component?
2. **Route Check:** Does the folder in `src/app/admin` match the `href` exactly?
3. **Data Check:** Does the `users/{uid}` document exist in the Production DB?
