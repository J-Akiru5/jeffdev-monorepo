# 🔐 Admin User Configuration Guide

This app uses **Supabase Auth** for authentication and role-based access control.

---

## Quick Setup: Bootstrap Your Admin Account

The fastest way to set yourself as **founder** is via the bootstrap endpoint:

1. **Sign in** to the admin app at `http://localhost:3004/sign-in`
2. **Visit** `http://localhost:3004/api/bootstrap`

This automatically grants your account the `founder` role. Refresh the admin page and you'll see the full sidebar (including the "System" section).

> The bootstrap endpoint is only available in development mode.

---

## Manual Setup Via Supabase Dashboard

If the bootstrap endpoint doesn't work (e.g. in production), set your role manually:

### Step 1: Sign in to Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project

### Step 2: Update Your User Profile

1. In the left sidebar, go to **"Table Editor"**
2. Select the `user_profiles` table
3. Find your user record (by your email)
4. Set the `role` column to `founder`
5. Click **"Save"**

**Role Hierarchy:**

| Role       | Description                                  |
| ---------- | -------------------------------------------- |
| `founder`  | Full access (highest)                        |
| `admin`    | Admin access                                 |
| `manager`  | Manager access                               |
| `employee` | Basic access (redirected to `/unauthorized`) |

---

## Access Levels

### Founder

✅ Access to all routes including System settings  
✅ Can view/manage Prism Engine users & subscriptions  
✅ Can view/manage Agency projects, clients, content  
✅ Can access Settings (System section in sidebar)

### Admin

✅ Access to most routes  
✅ Can view/manage Prism Engine users & subscriptions  
❌ Cannot access System settings (founder only)

### Manager

✅ Limited access  
✅ Can view Agency projects, quotes, inquiries  
❌ Cannot manage users  
❌ Cannot access System settings

### Employee (Default)

❌ Redirected to `/unauthorized`  
❌ No admin access

---

## Current Setup

**Your Apps:**

- **Prism Engine** (port 3001) — Users manage their rules/projects
- **Prism Admin** (port 3004) — You manage the platform

**Same Supabase Instance:** Both apps use the same Supabase project, so user roles apply across both.

---

## Quick Test

After setting your role to `founder`:

1. Navigate to `http://localhost:3004`
2. Sign in with your business email (email/password or Google/GitHub OAuth)
3. You should see all admin sections in the sidebar
4. Check the top-right badge — should show **"founder"** role

**If you still see "Unauthorized":**

- Sign out and sign in again
- Hard refresh (`Ctrl+Shift+R`)
- Check the `user_profiles` table to confirm the role was saved

---

## Security Notes

- **Never commit** Supabase service role keys to git
- **Production:** Use Doppler to manage secrets
- **Development:** Use `.env.local` (already in `.gitignore`)
- **Role changes** require sign-out/sign-in to take effect
- The `/api/bootstrap` endpoint is disabled in production
