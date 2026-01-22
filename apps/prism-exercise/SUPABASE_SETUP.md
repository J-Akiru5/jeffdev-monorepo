# Supabase Configuration for Prism Exercise

## Development Setup (Email Confirmation Disabled)

### Step 1: Disable Email Confirmation

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll to **Email Settings**
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

### Step 2: Configure Site URL

1. In the same **Authentication** section, go to **URL Configuration**
2. Set **Site URL** to: `http://localhost:3003` (for development)
3. Set **Redirect URLs** to:
   - `http://localhost:3003/**`
   - `http://localhost:3003/auth/callback`
4. Click **Save**

### Step 3: Verify User (If Already Registered)

If you already created an account that says "Email not confirmed":

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Find your user (`jeffmartinez@jeffdev.studio`)
3. Click on the user row
4. Click **Confirm email** button
5. User can now log in immediately

### Step 4: Test the Flow

1. Start the app: `npm run dev` (in `apps/prism-exercise`)
2. Go to http://localhost:3003/signup
3. Register a new account
4. You should be immediately redirected to the dashboard (no email confirmation needed)

---

## Environment Variables

Make sure these are set in your environment (Doppler):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## Database Schema

The database is already set up with the migration at:
- `apps/prism-exercise/supabase/migrations/001_initial_schema.sql`

This includes:
- ✅ User profiles table
- ✅ Auto-create profile trigger (on auth.users insert)
- ✅ Exercises seed data
- ✅ RLS policies

---

## Production Notes

⚠️ **For production deployment**, you should:
1. **Re-enable email confirmation** for security
2. Implement email verification callback route (`/auth/callback`)
3. Update Site URL to production domain
4. Add production redirect URLs

This current setup is **DEVELOPMENT ONLY** and prioritizes speed over security.
