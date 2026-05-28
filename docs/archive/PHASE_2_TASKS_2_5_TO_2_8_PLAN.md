# Phase 2 Tasks 2.5-2.8: Final Migrations & Cleanup

## Status: READY FOR EXECUTION

**Scope:** 4 remaining tasks to complete Phase 2
**Complexity:** 🔴 HIGH (especially Task 2.6)
**Estimated Duration:** 8-12 hours of focused work

---

## Overview of Tasks

| Task                                 | Complexity | Files                           | Time |
| ------------------------------------ | ---------- | ------------------------------- | ---- |
| **2.5** - Clerk User Export/Import   | 🟢 Low     | 1 script                        | 1-2h |
| **2.6** - Firestore → Supabase (BIG) | 🔴 High    | 20 actions + types + components | 6-8h |
| **2.7** - prism-admin Cleanup        | 🟡 Medium  | 3 files                         | 1h   |
| **2.8** - tracker Firebase Removal   | 🟢 Low     | 4 files                         | 1h   |

---

## Task 2.5: Clerk User Export → Supabase Import

### What It Does

Automates migration of all Clerk users to Supabase Auth with:

- Email + password hash import
- user_profiles creation with roles
- Password reset email generation

### Files to Create

- `scripts/import-clerk-users.ts` (200 lines)

### Execution Steps

1. ✅ Create import script
2. ✅ Test on staging data (small subset)
3. ✅ Generate migration report
4. ✅ Verify all users created in Supabase

### Success Criteria

- All Clerk users appear in Supabase auth.users
- Each has corresponding user_profiles entry
- Password reset links sent to all
- Migration log shows 0 errors

---

## Task 2.6: Firestore → Supabase (THE BIG ONE)

### What It Does

Migrates all agency data from Firestore to Supabase:

- 20 server action files converted
- Types: firestore.ts → database.ts
- ~30 consuming components updated
- 1 migration script validates data integrity

### Why It's Complex

- Firebase Timestamps must become ISO strings
- Foreign key relationships must be respected
- server_id → user_id renamed throughout
- Slug generation logic preserved
- External integrations (PayPal, Zoho) need updates

### Execution Strategy: 5 Sequential Phases

#### Phase A: Preparation (30 min)

1. Verify Supabase schema exists (36 tables)
2. Check all RLS policies are defined
3. Confirm dev Supabase project is ready
4. Backup Firestore (via console)

#### Phase B: Type System (1 hour)

1. Delete: `apps/agency/src/types/firestore.ts`
2. Create: `apps/agency/src/types/database.ts` (via `supabase gen types`)
3. Update: `subscription.ts` (remove Timestamp imports)
4. Update: `notification.ts` (remove Timestamp imports)
5. Verify: Run `pnpm --filter agency run check-types`

#### Phase C: Server Actions (6 hours) - 20 FILES

**Order of migration** (respects dependencies):

**Group 1: Simple CRUD (1.5 hours)**

- ✅ `users.ts` (154 lines) - user_profiles CRUD
- ✅ `notifications.ts` (136 lines) - simple insert/update
- ✅ `services.ts` (188 lines) - service list ops
- ✅ `feedback.ts` (135 lines) - feedback CRUD
- ✅ `calendar.ts` (131 lines) - calendar events
- ✅ `contact.ts` (113 lines) - message insert
- ✅ `waitlist.ts` (108 lines) - waitlist insert

**Group 2: Complex with IDs (2 hours)**

- ✅ `projects.ts` (176 lines) - projects CRUD (uses slug gen)
- ✅ `quote.ts` (133 lines) - quote form state
- ✅ `support.ts` (165 lines) - support tickets
- ✅ `subscriptions.ts` (231 lines) - billing cycles + MRR

**Group 3: High Complexity (2.5 hours)**

- ✅ `project-management.ts` (323 lines) - nested updates, status transitions
- ✅ `invoice.ts` (484 lines) - line items, payments, PDF generation
- ✅ `case-studies.ts` (434 lines) - slug gen, feedback linking
- ✅ `invites.ts` (444 lines) - tokens, role assignment

**Group 4: Auth & Migrations (1 hour)**

- ✅ `accept-invite.ts` (96 lines) - auth claim updates
- ✅ `seed.ts` (125 lines) - bootstrap data
- ✅ `auth.ts` (DONE - Task 2.4) - already migrated
- ✅ `upload.ts` (DONE - Task 2.1) - already migrated

**Group 5: External Integrations (1 hour)**

- ✅ `paypal.ts` (231 lines) - webhooks (external but needs Supabase queries)

#### Phase D: Components & Consuming Code (1.5 hours)

Update all imports of `@/types/firestore` to use `@/types/database`:

- ~15+ component files
- Page files that use server actions
- Utility functions that type-check

#### Phase E: Migration Script + Testing (1.5 hours)

1. Create: `scripts/migrate-firestore-to-supabase.ts`
   - Read all Firestore collections in dependency order
   - Transform Timestamps to ISO strings
   - Insert into Supabase
   - Validate row counts match
2. Test on staging database
3. Generate migration report

### Files Affected

**Server Actions (20):**

```
src/app/actions/
  ├── projects.ts (176 lines)
  ├── project-management.ts (323 lines)
  ├── users.ts (154 lines)
  ├── subscriptions.ts (231 lines)
  ├── notifications.ts (136 lines)
  ├── calendar.ts (131 lines)
  ├── feedback.ts (135 lines)
  ├── case-studies.ts (434 lines)
  ├── quote.ts (133 lines)
  ├── invoice.ts (484 lines)
  ├── invites.ts (444 lines)
  ├── accept-invite.ts (96 lines)
  ├── services.ts (188 lines)
  ├── contact.ts (113 lines)
  ├── paypal.ts (231 lines)
  ├── seed.ts (125 lines)
  ├── waitlist.ts (108 lines)
  ├── support.ts (165 lines)
  ├── auth.ts (done)
  └── upload.ts (done)
```

**Types (3):**

```
src/types/
  ├── firestore.ts (DELETE)
  ├── database.ts (CREATE - generated)
  ├── subscription.ts (UPDATE)
  └── notification.ts (UPDATE)
```

**Components (~15+):**

- All components importing from `@/types/firestore`
- Page files using server actions
- Admin layout files
- Dashboard pages

**Migration Scripts (1):**

```
scripts/
  └── migrate-firestore-to-supabase.ts (NEW)
```

### Key Patterns

**Before (Firebase):**

```typescript
import { db } from "@/lib/firebase/admin";
import type { FirestoreProject } from "@/types/firestore";

export async function createProject(title: string) {
  const ref = await db.collection("projects").add({
    title,
    userId: user.uid,
    createdAt: Timestamp.now(),
    status: "active",
  });
  return ref.id;
}
```

**After (Supabase):**

```typescript
import { createClient } from "@/lib/supabase/admin";

export async function createProject(title: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      user_id: user.id,
      created_at: new Date().toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}
```

### Migration Order Rationale

**Dependency Chain:**

```
user_profiles (no deps)
  ├─→ projects
  │     ├─→ milestones
  │     ├─→ case_studies
  │     └─→ feedback
  ├─→ quotes → invoices
  ├─→ calendar_events
  ├─→ subscriptions
  ├─→ notifications
  ├─→ invites
  ├─→ messages
  ├─→ waitlist_entries
  └─→ support_tickets
```

### Success Criteria

- ✅ All 20 server actions compile without Firebase imports
- ✅ All types resolve to Supabase types
- ✅ No Firestore Timestamp objects reach client components
- ✅ Components compile after import updates
- ✅ Migration script verifies row count parity
- ✅ `pnpm --filter agency run check-types` passes
- ✅ `pnpm --filter agency run build` succeeds

---

## Task 2.7: prism-admin Firestore References Cleanup

### What It Does

Removes Firebase Admin SDK from prism-admin (was used to read agency data)

### Why

- prism-admin now uses Supabase client
- No need for Firebase Admin anymore
- Reduces bundle size + complexity

### Files to Update

1. Delete: `apps/prism-admin/src/lib/firebase.ts`
2. Replace all Firebase queries with Supabase:
   - Firebase: `db.collection('user_profiles').get()`
   - Supabase: `supabase.from('user_profiles').select('*')`
3. Update consuming pages:
   - `src/app/admin/settings/page.tsx`

### Success Criteria

- ✅ No Firebase imports in prism-admin
- ✅ All dashboard data loads from Supabase
- ✅ Admin pages work identically

---

## Task 2.8: tracker Firebase Removal

### What It Does

Removes Firebase completely from tracker app (only used mock data anyway)

### Files to Update

1. Delete: `apps/tracker/src/lib/firebase/config.ts`
2. Delete: `apps/tracker/src/lib/firebase/admin.ts`
3. Update: `package.json` - Remove firebase, firebase-admin deps
4. Update: `src/app/(dashboard)/settings/page.tsx` - Remove Firebase text

### Success Criteria

- ✅ No Firebase imports in tracker
- ✅ No Firebase in package.json dependencies
- ✅ Settings page removes Firebase auth mention
- ✅ App builds without Firebase

---

## Execution Workflow

### Pre-Execution Checklist

- [ ] Backup Firestore database
- [ ] Verify Supabase project is accessible
- [ ] Verify all env vars configured
- [ ] Create branch: `feat/phase-2-data-migrations`
- [ ] Review RLS policies in Supabase

### During Execution

1. Execute tasks in order: 2.5 → 2.6 → 2.7 → 2.8
2. After each task: Run type checks + linting
3. Track: Update SQL progress table after each step
4. Commit: Create granular commits for each milestone

### Post-Execution Validation

```bash
# Type checking
pnpm --filter agency run check-types          # ✅ Must pass
pnpm --filter prism-admin run check-types    # ✅ Must pass
pnpm --filter tracker run check-types        # ✅ Must pass

# Linting
turbo run lint                                 # ✅ Must pass

# Build (requires Doppler)
doppler run -- turbo run build                # ✅ Must pass

# Tests (unit + E2E)
pnpm --filter agency run test:unit           # ✅ Should pass
pnpm --filter agency run test:e2e            # ✅ Should pass
```

---

## Rollback Plan

If critical issues:

1. **Revert commits:** Git history fully available
2. **Restore Firestore:** Backup ensures no data loss
3. **Keep Supabase:** No destructive migration of source
4. **Timeline:** < 30 minutes to full rollback

---

## Key Resources

- Supabase schema: `supabase/migrations/20250523011807_initial_schema.sql`
- Current Firebase code: `apps/agency/src/lib/firebase/`
- Supabase client: `apps/agency/src/lib/supabase/`
- Phase 2 docs: `PHASE_2_AUTH_MIGRATION_COMPLETE.md`

---

## Notes

### Critical Decisions

1. **Preserve public APIs** - Components don't change
2. **Database-driven RBAC** - Roles in user_profiles table
3. **Respect foreign keys** - Migration order matters
4. **Timestamp serialization** - All dates become ISO strings

### Risk Mitigation

- Small test batch first (5-10 records)
- Staging environment validates before production
- Rollback tested and documented
- Migration script has error handling + logging

---

**Status:** Ready to execute  
**Branch:** To be created at start  
**Timeline:** Full execution ~10 hours  
**Success Criteria:** All 4 tasks complete, all tests passing, 0 Firebase imports in codebase
