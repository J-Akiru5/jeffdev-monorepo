# Phase 2 Deployment Checklist

## Pre-Deployment (DevOps/Database)

### Supabase Configuration

- [ ] **Create user_profiles table**

  ```sql
  CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('founder', 'admin', 'manager', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_user_profiles_role ON user_profiles(role);
  ```

- [ ] **Set up Row Level Security (RLS)**

  ```sql
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Service role can manage all profiles" ON user_profiles
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');
  ```

- [ ] **Create migration script** to import users from old auth systems
  - Export Clerk users (email, id)
  - Export Firebase users (email, uid)
  - Map roles from old metadata/custom claims to user_profiles.role
  - Bulk insert to Supabase auth.users

### Environment Configuration

- [ ] **Update Doppler (prism-admin)**
  - `NEXT_PUBLIC_SUPABASE_URL` → from Supabase project settings
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → from Supabase project settings
  - `SUPABASE_SERVICE_ROLE_KEY` → from Supabase project settings

- [ ] **Update Doppler (agency)**
  - `NEXT_PUBLIC_SUPABASE_URL` → from Supabase project settings
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → from Supabase project settings
  - `SUPABASE_SERVICE_ROLE_KEY` → from Supabase project settings

- [ ] **Verify environment variables are NOT in git**
  ```bash
  git grep -i "supabase_key" -- ':!PHASE_2*' | wc -l
  # Should return 0
  ```

### User Migration

- [ ] **Audit existing users**
  - Count Clerk users: `___`
  - Count Firebase users: `___`
  - Map role distribution: founder **_, admin _**, partner **_, default _**

- [ ] **Test migration script** on Supabase dev project
  - Verify user count matches
  - Verify role mapping correct
  - Verify no duplicate emails
  - Verify all users have user_profiles records

- [ ] **Run migration on staging Supabase**
  - Full user import
  - Test sign-in with migrated users
  - Verify roles work (test as each role level)

---

## Staging Testing (QA)

### Functional Testing

- [ ] **Authentication Flow**
  - [ ] Invalid credentials show error message
  - [ ] Valid credentials redirect to dashboard
  - [ ] Session persists after page refresh
  - [ ] Session persists after browser restart (if cookies set to remember)

- [ ] **prism-admin Specific**
  - [ ] Sign in as founder → See admin sidebar
  - [ ] Access /admin/dashboard → Works
  - [ ] Access /admin/users → Works
  - [ ] Access /admin/settings → Works (founder only)
  - [ ] User button shows correct role
  - [ ] Bootstrap endpoint works (POST /api/bootstrap)

- [ ] **agency Specific**
  - [ ] Sign in → UserContext loads correctly
  - [ ] useUser() hook returns correct user
  - [ ] Component tree renders without errors
  - [ ] Header displays user role

- [ ] **Role-Based Access Control**
  - [ ] Founder: Access all routes ✅
  - [ ] Admin: Access all routes ✅
  - [ ] Manager: Redirected from /admin → /unauthorized ✅
  - [ ] Employee: Redirected from /admin → /unauthorized ✅

- [ ] **Sign-Out**
  - [ ] Click "Sign Out" → Redirect to login
  - [ ] Verify auth tokens cleared from cookies
  - [ ] Navigate to /admin → Redirect to login
  - [ ] No auth token in browser storage

### Browser & Device Testing

- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)

### Performance Testing

- [ ] Sign-in latency < 2 seconds (with network throttling: slow 4G)
- [ ] Role check latency < 100ms
- [ ] Middleware updateSession < 50ms
- [ ] No memory leaks (test auth subscribe/unsubscribe cycle 10 times)

### Error Scenario Testing

- [ ] Missing Supabase credentials → Shows helpful error in logs
- [ ] Corrupted auth token → Redirect to login
- [ ] user_profiles table doesn't exist → Error logged (clear guidance)
- [ ] Network timeout during sign-in → Show retry message
- [ ] User deleted from auth → Redirect to login on next request

---

## Code Review Checklist

### Security

- [ ] No hardcoded secrets in any file
- [ ] No sensitive data logged to console in production builds
- [ ] Service role key only used on server (never exposed to client)
- [ ] Session cookies marked as secure + httpOnly + sameSite
- [ ] All routes requiring auth have proper checks

### Code Quality

- [ ] No console.log statements left in production code
- [ ] No TypeScript errors (prism-admin passes tsc)
- [ ] No ESLint violations (both apps pass lint)
- [ ] No unused imports
- [ ] Proper error handling (no silent failures)

### Pattern Compliance

- [ ] Middleware uses `updateSession` pattern (not direct auth calls)
- [ ] All server components that need user use `supabase.auth.getUser()`
- [ ] All role checks query user_profiles table
- [ ] UserContext cleanup uses `useEffect` return statement
- [ ] Admin client uses singleton pattern (getAdminClient)

### Documentation

- [ ] Components have JSDoc comments for complex logic
- [ ] Server actions document parameter validation
- [ ] Environment variables documented in README
- [ ] Role mapping clearly defined
- [ ] Database schema matches migrations

---

## Production Deployment

### Pre-Deployment (1 hour before)

- [ ] All staging tests passed ✅
- [ ] No open blocking issues
- [ ] Team notified of maintenance window (if needed)
- [ ] Rollback plan reviewed and ready
- [ ] Backups created (Supabase automatic, but verify)

### Deployment Steps

- [ ] **Deploy to production**
  1. Set Doppler secrets in production environment
  2. Deploy prism-admin to Vercel
  3. Deploy agency to Vercel
  4. Monitor error logs for first 15 minutes

- [ ] **Verify deployments**
  - [ ] prism-admin /api/health returns 200
  - [ ] agency /api/health returns 200
  - [ ] prism-admin sign-in page loads
  - [ ] agency login accessible

### Post-Deployment (First 24 hours)

- [ ] **Monitor key metrics**
  - [ ] Sign-in success rate > 99%
  - [ ] Error rate for auth endpoints < 1%
  - [ ] Response time < 2 seconds
  - [ ] No spike in 500 errors

- [ ] **Test with real users**
  - [ ] Founder can sign in and access /admin
  - [ ] Partner cannot access /admin (redirects)
  - [ ] Sign-out works correctly
  - [ ] Session persists across requests

- [ ] **Verify user data integrity**
  - [ ] All users present in Supabase
  - [ ] All user_profiles populated with correct roles
  - [ ] No duplicate user accounts
  - [ ] No orphaned profiles

---

## Rollback Plan

### If Critical Issues Detected

**Within 15 minutes:**

1. Revert Vercel deployments to previous version
2. Keep Supabase credentials active (no data loss)
3. Notify users of brief interruption
4. Document issue for post-mortem

**Investigation:**

1. Check Supabase logs for auth errors
2. Review Vercel logs for runtime errors
3. Check database query performance
4. Verify environment variables are set

**Recovery:**

1. Fix identified issue
2. Re-test in staging thoroughly
3. Deploy fix to production
4. Monitor metrics for 1 hour
5. Post-mortem meeting to prevent recurrence

### Data Safety

- ✅ No user data will be lost during rollback
- ✅ Both Clerk/Firebase and Supabase can coexist temporarily
- ✅ Safe to switch back and forth multiple times

---

## Post-Deployment Tasks

### Day 1

- [ ] Monitor support tickets for auth-related issues
- [ ] Verify all admin users can access their dashboards
- [ ] Check performance metrics are within SLA

### Day 3

- [ ] Run comprehensive E2E tests
- [ ] Test all admin pages with different role levels
- [ ] Verify no lingering Clerk/Firebase references in code

### Week 1

- [ ] Decommission Clerk credentials (after 100% confirmation)
- [ ] Decommission Firebase credentials (after 100% confirmation)
- [ ] Archive backup of old auth data
- [ ] Update runbooks and documentation

### Month 1

- [ ] Analyze auth metrics (sign-in patterns, common errors)
- [ ] Optimize performance based on real-world usage
- [ ] Update team training materials
- [ ] Plan cleanup of old auth infrastructure

---

## Communication

### Stakeholders to Notify

- [ ] Engineering team (code changes complete)
- [ ] QA team (staging ready for testing)
- [ ] DevOps team (infrastructure changes required)
- [ ] Product team (deployment timeline)
- [ ] Support team (new auth system documentation)
- [ ] Users (if maintenance window needed)

### Message Template

```
Subject: Authentication System Migration

We are migrating [App Name] to a new authentication system (Supabase)
for improved performance and security.

Changes:
- New sign-in page
- User profiles stored in database
- Role management improved

Timeline:
- [Date] Staging deployment
- [Date] Production deployment

Impact:
- No changes needed to existing workflows
- Users may need to sign in again after deployment
- Expected maintenance window: < 5 minutes

For issues, contact: [Support Channel]
```

---

## Success Criteria

✅ **All items below must be true:**

- [ ] prism-admin builds successfully
- [ ] agency builds successfully
- [ ] All types pass type checking
- [ ] All lints pass ESLint
- [ ] Founder can sign in to prism-admin /admin
- [ ] Employee is redirected from /admin
- [ ] UserContext works identically in agency
- [ ] User can sign out and is logged out
- [ ] No secrets in repository
- [ ] Error rate < 1% in production
- [ ] Sign-in latency < 2 seconds
- [ ] All 164 file changes reviewed
- [ ] Rollback plan tested
- [ ] Team trained on new system

---

## Related Documentation

- **Comprehensive Guide:** PHASE_2_AUTH_MIGRATION_COMPLETE.md
- **Quick Reference:** PHASE_2_QUICK_REFERENCE.md
- **Deployment Timeline:** (To be created by DevOps)
- **Runbook:** (To be created post-deployment)

---

_Last updated: [Current Date]_  
_Status: Ready for staging deployment_
