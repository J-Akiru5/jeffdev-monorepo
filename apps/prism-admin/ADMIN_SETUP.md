# 🔐 Admin User Configuration Guide

## Setting Up Your Admin Account in Clerk

### Step 1: Sign in to Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your project (the one matching your publishable key: `pk_test_c3RyaWtpbmctcGlnZW9uLTIyLmNsZXJrLmFjY291bnRzLmRldiQ`)

### Step 2: Find Your User Account
1. In the left sidebar, click **"Users"**
2. Find your account by your business email
3. Click on your user to open the profile

### Step 3: Add Admin Role Metadata
1. Scroll down to **"Public metadata"** section
2. Click **"Edit"**
3. Add this JSON:

```json
{
  "role": "founder"
}
```

**Role Hierarchy:**
- `founder` - Full access (highest)
- `admin` - Admin access
- `partner` - Partner access
- `employee` - Basic access

### Step 4: Save Changes
1. Click **"Save"**
2. Sign out and sign in again to refresh your session

---

## Alternative: Use Clerk API (Programmatic)

If you want to set it via API:

```bash
# Get your Clerk Secret Key from .env.local
# CLERK_SECRET_KEY="sk_test_7rZmxEdSD8naGYl4ohygpUUNgCd7kcha6Oe9CivKL3"

# Find your user ID from Clerk dashboard, then:
curl -X PATCH https://api.clerk.com/v1/users/USER_ID/metadata \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "public_metadata": {
      "role": "founder"
    }
  }'
```

---

## Access Levels

### Founder (Your Account)
✅ Access to all routes  
✅ Can view/manage users  
✅ Can view/manage subscriptions  
✅ Can view/manage inquiries  
✅ Can view Agency projects/clients  
✅ Can access Settings (System section visible)

### Admin
✅ Access to most routes  
✅ Can view/manage users  
✅ Can view/manage subscriptions  
❌ Cannot access System settings (founder only)

### Partner
✅ Limited access  
✅ Can view inquiries  
✅ Can view projects  
❌ Cannot manage users  
❌ Cannot access System settings

### Employee (Default)
❌ Redirected to `/unauthorized`  
❌ No admin access

---

## Current Setup

**Your Apps:**
- **Prism Dashboard** (port 3001) - Users manage their rules/projects
- **Prism Admin** (port 3003) - You manage the platform

**Same Clerk Instance:** Both apps use the same authentication, so your role applies to both.

---

## Quick Test

After setting your role to `founder`:

1. Navigate to http://localhost:3003
2. Sign in with your business email
3. You should see all admin sections in the sidebar
4. Check the top-right badge - should show "Founder" role

**If you still see "Unauthorized":**
- Clear cookies and sign out
- Hard refresh (Ctrl+Shift+R)
- Sign in again

---

## Security Notes

- **Never commit** your Clerk Secret Key to git
- **Production:** Use Doppler to manage secrets
- **Development:** Use `.env.local` (already in `.gitignore`)
- **Role changes** require sign-out/sign-in to take effect
