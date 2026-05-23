# Phase 3 Setup Instructions

## 📋 Required Steps

Copy `.env.example` to `.env.local` and fill in your credentials:

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `jeffdev-agency` project
3. **Get Client SDK credentials:**
   - Project Settings → General → Your apps
   - Copy the config values to `.env.local`
   
4. **Get Admin SDK credentials:**
   - Project Settings → Service Accounts
   - Click "Generate new private key"
   - Copy `project_id`, `client_email`, and `private_key` to `.env.local`
   - **IMPORTANT:** The private key should include `\n` characters

5. **Enable Google Sign-In:**
   - Authentication → Sign-in method
   - Enable "Google" provider
   - Add `jeffdev.studio` to authorized domains

6. **Create Firestore collections:**
   - Firestore Database → Create database (production mode)
   - Collections will be auto-created on first form submission

### 2. Resend Setup

1. Go to [Resend Dashboard](https://resend.com/)
2. API Keys → Create API Key
3. Copy to `RESEND_API_KEY` in `.env.local`

4. **Verify domains:**
   - Domains → Add Domain → `jeffdev.studio`
   - Follow DNS verification steps
   - This allows sending from `contact@`, `hire@`, `noreply@` addresses

### 3. Session Secret

Generate a random session secret:
```bash
openssl rand -base64 32
```
Copy the output to `SESSION_SECRET` in `.env.local`

## ✅ Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test Contact Form:**
   - Go to http://localhost:3000/contact
   - Fill out and submit
   - Check Firestore for new document
   - Check `contact@jeffdev.studio` for email

3. **Test Quote Form:**
   - Go to http://localhost:3000/quote
   - Complete all 3 steps
   - Check Firestore for new quote
   - Check `hire@jeffdev.studio` for email

4. **Test Admin Login:**
   - Go to http://localhost:3000/admin
   - Should redirect to `/admin/login`
   - Sign in with Google
   - Should redirect to dashboard

## 🐛 Troubleshooting

**Email not sending?**
- Verify domain in Resend dashboard
- Check API key is correct
- Check server logs for errors

**Firebase error?**
- Double-check all env variables
- Ensure private key has `\n` newlines
- Verify Google OAuth is enabled

**Admin login failing?**
- Clear browser cookies
- Check Firebase console for auth logs
- Ensure `jeffdev.studio` is in authorized domains
