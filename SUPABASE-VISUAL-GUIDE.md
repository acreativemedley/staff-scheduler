# Visual Guide: Supabase Password Reset Configuration

## 📋 Overview
This guide shows you exactly where to click in the Supabase Dashboard to configure password reset.

---

## Step-by-Step Instructions

### 1️⃣ Login to Supabase

**URL:** https://supabase.com/dashboard

**Your Project:** `vimvndsrdafqwjklvmbw`

---

### 2️⃣ Navigate to Authentication Settings

**Path:** Left Sidebar → Authentication → URL Configuration

```
Supabase Dashboard
├── 🏠 Home
├── 📊 Table Editor
├── 🔐 Authentication  ← CLICK HERE
│   ├── Users
│   ├── Policies
│   ├── Providers
│   ├── Email Templates
│   └── URL Configuration  ← THEN CLICK HERE
├── 📁 Storage
└── ...
```

---

### 3️⃣ Configure Site URL

**Location:** URL Configuration Page → Site URL field

**What to enter:**
```
https://glowing-cactus-9da45d.netlify.app
```

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│ Site URL                                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://glowing-cactus-9da45d.netlify.app       │ │
│ └─────────────────────────────────────────────────┘ │
│ The base URL of your website. Used as the default  │
│ redirect URL for authentication.                    │
└─────────────────────────────────────────────────────┘
```

---

### 4️⃣ Configure Redirect URLs

**Location:** URL Configuration Page → Redirect URLs field

**What to enter** (one per line):
```
https://glowing-cactus-9da45d.netlify.app
https://glowing-cactus-9da45d.netlify.app/update-password
http://localhost:5178
http://localhost:5178/update-password
```

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ Redirect URLs                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://glowing-cactus-9da45d.netlify.app          │ │
│ │ https://glowing-cactus-9da45d.netlify.app/update-p │ │
│ │ http://localhost:5173                              │ │
│ │ http://localhost:5173/update-password              │ │
│ └─────────────────────────────────────────────────────┘ │
│ A list of allowed URLs for redirects after auth.        │
│ Wildcards are supported (e.g., https://*.example.com)  │
└─────────────────────────────────────────────────────────┘
```

---

### 5️⃣ Save Configuration

**Location:** Bottom of URL Configuration page

**Visual:**
```
┌────────────────────────────────┐
│  [ Cancel ]      [ Save ]      │  ← CLICK SAVE
└────────────────────────────────┘
```

⚠️ **IMPORTANT:** Don't forget to click the Save button!

---

## ✅ Verification

After saving, you should see:

```
✓ Configuration saved successfully
```

### Verify Your Settings:

**Site URL should show:**
```
https://glowing-cactus-9da45d.netlify.app
```

**Redirect URLs should show 4 entries:**
```
1. https://glowing-cactus-9da45d.netlify.app
2. https://glowing-cactus-9da45d.netlify.app/update-password
3. http://localhost:5178
4. http://localhost:5178/update-password
```

---

## 🧪 Test the Configuration

### Test Flow:

```
User Journey:
┌─────────────────────────────────────────────────────┐
│ 1. User goes to login page                          │
│    https://glowing-cactus-9da45d.netlify.app       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. User clicks "Forgot password?"                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. User enters email and submits                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Supabase sends email with reset link             │
│    Link: https://glowing-cactus-9da45d.netlify     │
│          .app/update-password#access_token=...      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. User clicks link in email                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Browser opens update-password page               │
│    https://glowing-cactus-9da45d.netlify.app       │
│           /update-password                           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. User enters new password and confirms            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 8. Password updated successfully!                   │
│    Redirect to login page                           │
└─────────────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### Problem: Email link goes to localhost

**Symptom:** Email shows `http://localhost:3000/...`

**Solution:**
1. Check Site URL is set to: `https://glowing-cactus-9da45d.netlify.app`
2. Click Save
3. Wait 1-2 minutes for changes to propagate
4. Request a new password reset email

---

### Problem: "Invalid redirect URL" error

**Symptom:** After clicking email link, see error message

**Solution:**
1. Verify all 4 URLs are in Redirect URLs list
2. Check for typos or trailing slashes
3. Make sure you clicked Save
4. Try again with a new password reset email

---

### Problem: Link expired

**Symptom:** "Password reset link expired" message

**Solution:**
- Links expire after 1 hour
- Request a new password reset email
- Use the new link within 1 hour

---

## 📝 Copy-Paste Checklist

Use this checklist to ensure you've entered everything correctly:

### Site URL:
- [ ] Copied: `https://glowing-cactus-9da45d.netlify.app`
- [ ] Pasted in Site URL field
- [ ] No trailing slash
- [ ] Uses `https://` (not `http://`)

### Redirect URLs:
- [ ] Copied all 4 URLs (see section 4 above)
- [ ] Pasted in Redirect URLs field (one per line)
- [ ] No trailing slashes
- [ ] Production URLs use `https://`
- [ ] Localhost URLs use `http://`

### Save:
- [ ] Clicked the "Save" button
- [ ] Saw success message
- [ ] Verified settings are displayed correctly

---

## 🎯 Quick Links

- **Supabase Auth Config:** https://supabase.com/dashboard/project/vimvndsrdafqwjklvmbw/auth/url-configuration
- **Your Production App:** https://glowing-cactus-9da45d.netlify.app
- **Password Reset Test:** https://glowing-cactus-9da45d.netlify.app (click "Forgot password?")

---

## 💡 Pro Tips

1. **Keep localhost URLs** - They're needed for local development (port 5178)
2. **No wildcards needed** - Your exact URLs are specified
3. **Changes are immediate** - New password reset emails will use the updated URL
4. **Old links still work** - Previously sent emails won't be affected by URL changes
5. **Test locally first** - Verify everything works on localhost before production testing

---

## ✨ Done!

After completing these steps, your password reset should work perfectly on both:
- 🏠 Local development: http://localhost:5178
- 🌐 Production: https://glowing-cactus-9da45d.netlify.app
