# Password Reset Setup Guide

## Overview
This guide will help you configure password reset functionality for your Staff Scheduling System deployed on Netlify.

## Problem
By default, Supabase sends password reset emails with links pointing to `localhost:3000`, which doesn't work for production deployments on Netlify.

## Solution
Configure Supabase to use your actual Netlify URL for password reset redirects.

---

## Step 1: Your Netlify URL

**Your Production URL:** `https://glowing-cactus-9da45d.netlify.app`

This URL is already configured in the code and will be used for password reset redirects.

---

## Step 2: Configure Supabase Redirect URLs

### Option A: Via Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com
   - Navigate to your project

2. **Go to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "URL Configuration"

3. **Add Redirect URLs**
   - Find the "Redirect URLs" section
   - Add the following URLs **EXACTLY as shown**:
     ```
     https://glowing-cactus-9da45d.netlify.app
     https://glowing-cactus-9da45d.netlify.app/update-password
     http://localhost:5178
     http://localhost:5178/update-password
     ```
   - The localhost URLs are for local development
   - Click "Save"

4. **Update Site URL**
   - In the same "URL Configuration" section
   - Set "Site URL" to: `https://glowing-cactus-9da45d.netlify.app`
   - Click "Save"

### Option B: Via Supabase SQL Editor

If you prefer using SQL or need to verify the settings:

```sql
-- Check current auth configuration
SELECT * FROM auth.config;

-- Note: You cannot directly update auth.config via SQL
-- You must use the Supabase Dashboard for URL configuration
```

---

## Step 3: Test Password Reset Flow

### Local Testing

1. **Start your development server**
   ```powershell
   cd staff-scheduler
   npm run dev
   ```

2. **Test password reset**
   - Go to http://localhost:5178
   - Click "Forgot password?"
   - Enter a test email
   - Check your email inbox
   - Click the reset link (should redirect to localhost:5178/update-password)
   - Enter a new password
   - Verify you can sign in

### Production Testing

1. **Deploy to Netlify**
   ```powershell
   # If using Netlify CLI
   netlify deploy --prod

   # Or push to your git repository if auto-deploy is enabled
   git add .
   git commit -m "Add password reset functionality"
   git push
   ```

2. **Test on Netlify**
   - Go to https://glowing-cactus-9da45d.netlify.app
   - Click "Forgot password?"
   - Enter your email
   - Check your email inbox
   - Click the reset link (should redirect to https://glowing-cactus-9da45d.netlify.app/update-password)
   - Enter a new password
   - Verify you can sign in

---

## Step 4: Configure Email Templates (Optional)

You can customize the password reset email template in Supabase:

1. **Go to Authentication → Email Templates** in Supabase Dashboard

2. **Find "Reset Password" template**

3. **Customize the template** (optional):
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset your password:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   <p>If you didn't request this, you can safely ignore this email.</p>
   ```

4. **The `{{ .ConfirmationURL }}` variable** will automatically use the correct redirect URL you configured in Step 2

---

## Troubleshooting

### Password reset email points to localhost in production

**Solution:**
- Verify you added https://glowing-cactus-9da45d.netlify.app to the "Redirect URLs" in Supabase
- Make sure you set the "Site URL" to https://glowing-cactus-9da45d.netlify.app
- Clear your browser cache and try again

### "Invalid redirect URL" error

**Solution:**
- Double-check that all URLs are added to "Redirect URLs" in Supabase
- Make sure URLs don't have trailing slashes
- Ensure you're using `https://` for production URLs
- Required URLs:
  - https://glowing-cactus-9da45d.netlify.app
  - https://glowing-cactus-9da45d.netlify.app/update-password

### Password reset link expired

**Solution:**
- Password reset links expire after 1 hour by default
- Request a new password reset email
- To change expiration time, go to Authentication → Settings in Supabase

### User receives email but link doesn't work

**Solution:**
- Check browser console for errors
- Verify the URL in the email matches your Netlify URL
- Make sure your Netlify deployment is working correctly

---

## Security Best Practices

1. **Use HTTPS Only in Production**
   - Netlify automatically provides HTTPS
   - Never use HTTP for production

2. **Limit Redirect URLs**
   - Only add URLs you actually use
   - Remove any test URLs when done testing

3. **Password Requirements**
   - Supabase requires minimum 6 characters by default
   - Consider increasing this in Authentication → Settings

4. **Rate Limiting**
   - Supabase has built-in rate limiting for password reset emails
   - Default: 4 emails per hour per user

---

## Files Added

The following files were created for password reset functionality:

1. **`src/PasswordReset.jsx`**
   - Component for requesting a password reset
   - Sends reset email to user

2. **`src/UpdatePassword.jsx`**
   - Component for updating password after clicking email link
   - Validates password and confirms match

3. **`src/Auth.jsx`** (updated)
   - Added "Forgot password?" link
   - Imports and shows PasswordReset component

4. **`src/App.jsx`** (updated)
   - Added route handling for `/update-password`
   - Shows UpdatePassword component when on that route

---

## How It Works

1. **User clicks "Forgot password?"**
   - Shows PasswordReset component
   - User enters email address

2. **System sends reset email**
   - Supabase sends email with reset link
   - Link includes: `https://glowing-cactus-9da45d.netlify.app/update-password#access_token=...`

3. **User clicks link in email**
   - Browser opens app at `/update-password` route
   - UpdatePassword component detects the session token
   - User enters new password

4. **Password is updated**
   - Supabase updates the password
   - User is redirected to login page
   - User can now sign in with new password

---

## Environment Variables

Make sure these are set in Netlify:

1. **Go to Netlify → Site Settings → Environment Variables**

2. **Add these variables:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Redeploy after adding environment variables**

---

## Next Steps

- [ ] Add your Netlify URL to Supabase redirect URLs
- [ ] Test password reset locally
- [ ] Deploy to Netlify
- [ ] Test password reset in production
- [ ] Customize email template (optional)
- [ ] Document the password reset process for your users

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → Auth Logs
2. Check browser console for JavaScript errors
3. Verify all URLs are correctly configured
4. Ensure environment variables are set in Netlify
