# Quick Reference: Phase 2 Auth Migration

## What Changed?

### prism-admin: Clerk → Supabase

- ✅ Sign-in page: Custom `SignInForm` component
- ✅ Layout: `SupabaseProvider` instead of `ClerkProvider`
- ✅ Auth checks: `supabase.auth.getUser()` instead of `auth()`
- ✅ Role lookups: `user_profiles` table instead of Clerk metadata

### agency: Firebase → Supabase

- ✅ UserContext: `onAuthStateChange` instead of `onAuthStateChanged`
- ✅ Access control: Supabase auth + `user_profiles` table
- ✅ Public API: **UNCHANGED** - `useUser()` still works identically

## Important Files

| File                            | Purpose                       | App         |
| ------------------------------- | ----------------------------- | ----------- |
| `src/lib/supabase/server.ts`    | SSR client (cookies)          | Both        |
| `src/lib/supabase/browser.ts`   | Client-side (public keys)     | Both        |
| `src/lib/supabase/admin.ts`     | Admin client (service role)   | Both        |
| `src/middleware.ts`             | Auth refresh on every request | prism-admin |
| `src/contexts/user-context.tsx` | User state hook               | agency      |
| `src/lib/access.ts`             | RBAC gateway                  | agency      |

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
```

Set via Doppler for each app.

## Database Schema

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Testing

### Start Dev Server

```bash
doppler run -- turbo dev
# Navigate to http://localhost:3000 (agency) or http://localhost:3004 (prism-admin)
```

### Test Sign-In

1. Go to `/sign-in` page
2. Enter valid Supabase credentials
3. Should redirect to dashboard

### Test Role-Based Access

1. Sign in as founder
2. Navigate to `/admin` - should work
3. Sign in as employee
4. Navigate to `/admin` - should redirect to `/unauthorized`

### Test Logout

1. Click user menu (top-right)
2. Click "Sign Out"
3. Should redirect to login
4. Verify `sb-auth-token` cookie is cleared

## Common Issues & Fixes

| Issue                          | Cause                        | Fix                                       |
| ------------------------------ | ---------------------------- | ----------------------------------------- |
| "Supabase credentials missing" | No env vars                  | Set NEXT_PUBLIC_SUPABASE_URL + ANON_KEY   |
| "Cannot read user_profiles"    | Table doesn't exist          | Create table in Supabase                  |
| "User has no role"             | Missing user_profiles record | Bootstrap endpoint or manual insert       |
| Auth state keeps changing      | Subscription not cleaned up  | Check `useEffect` cleanup in useUser hook |
| Sign-in page blank             | SupabaseProvider missing     | Check layout.tsx has provider             |

## Monitoring

### Key Metrics

- Sign-in success rate (target: >99%)
- Role lookup latency (target: <100ms)
- Session refresh latency (target: <50ms)

### Error Logs to Watch

- "Missing Supabase credentials"
- "user_profiles not found"
- "Auth state subscription error"

## Rollback

If critical issues found:

1. Revert deployment to previous version
2. Keep Supabase credentials active
3. No user data will be lost

## Contact

For issues with auth migrations:

- Check logs in Vercel dashboard
- Review Supabase auth logs
- Consult PHASE_2_AUTH_MIGRATION_COMPLETE.md

---

## User Stories - Now Supported

### User: Sign In

1. Navigate to `/sign-in`
2. Enter email + password
3. Redirect to dashboard
4. Session persists across page refresh

### User: View Profile

1. Click user menu (top-right)
2. See current role displayed
3. Can click "Settings" or "Sign Out"

### User: Access Restricted Pages

1. Founder/Admin: Can access all `/admin` routes
2. Manager: Redirected to `/unauthorized`
3. Employee: Redirected to `/unauthorized`

### User: Sign Out

1. Click "Sign Out" in menu
2. Redirect to login page
3. Cannot access protected routes without re-authenticating

---

## Tech Stack

**Auth:** Supabase Auth (OAuth + Email/Password)  
**Session:** JWT tokens in secure cookies (Supabase SSR)  
**RBAC:** user_profiles table (role = founder|admin|manager|employee)  
**Middleware:** Next.js 16 + Supabase updateSession  
**State:** React Context (useUser hook)

---

_Last updated: Phase 2.3 & 2.4 Complete_
