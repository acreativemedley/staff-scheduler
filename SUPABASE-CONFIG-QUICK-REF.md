# Supabase Configuration - Quick Reference

## 🎯 Your Netlify URL
```
https://glowing-cactus-9da45d.netlify.app
```

---

## ⚙️ Supabase Dashboard Configuration

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project: `vimvndsrdafqwjklvmbw`
3. Go to: **Authentication** → **URL Configuration**

---

### Step 2: Copy & Paste These Exact URLs

#### Site URL
```
https://glowing-cactus-9da45d.netlify.app
```

#### Redirect URLs (add all four)
```
https://glowing-cactus-9da45d.netlify.app
https://glowing-cactus-9da45d.netlify.app/update-password
http://localhost:5178
http://localhost:5178/update-password
```

⚠️ **Important:** 
- No trailing slashes
- Copy exactly as shown
- Don't forget to click "Save"

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Go to: http://localhost:5178
- [ ] Click "Forgot password?"
- [ ] Enter email and submit
- [ ] Check email inbox
- [ ] Click reset link
- [ ] Should redirect to: http://localhost:5178/update-password
- [ ] Enter new password
- [ ] Should redirect to login
- [ ] Sign in with new password

### Production Testing
- [ ] Deploy to Netlify
- [ ] Go to: https://glowing-cactus-9da45d.netlify.app
- [ ] Click "Forgot password?"
- [ ] Enter email and submit
- [ ] Check email inbox
- [ ] Click reset link
- [ ] Should redirect to: https://glowing-cactus-9da45d.netlify.app/update-password
- [ ] Enter new password
- [ ] Should redirect to login
- [ ] Sign in with new password

---

## 🔍 Verification

After configuring Supabase, you can verify the settings:

1. **Check Site URL:**
   - Should show: `https://glowing-cactus-9da45d.netlify.app`

2. **Check Redirect URLs:**
   - Should have 4 URLs listed (2 for production, 2 for localhost)

3. **Test password reset:**
   - Request password reset
   - Check the URL in the email
   - Should contain: `glowing-cactus-9da45d.netlify.app`

---

## ❌ Common Issues

### Email link goes to localhost instead of Netlify
**Fix:** Update Site URL in Supabase to your Netlify URL

### "Invalid redirect URL" error
**Fix:** Add the exact URL to Redirect URLs in Supabase

### Link expired
**Fix:** Links expire after 1 hour - request a new one

---

## 📞 Support URLs

- **Supabase Dashboard:** https://supabase.com/dashboard/project/vimvndsrdafqwjklvmbw
- **Netlify Dashboard:** https://app.netlify.com/sites/glowing-cactus-9da45d
- **Production App:** https://glowing-cactus-9da45d.netlify.app
- **Local Dev:** http://localhost:5178

---

## 🚀 Quick Deploy

```powershell
# Navigate to project
cd C:\Users\felti\OneDrive\Documents\Coding\SchedulingMadison\staff-scheduler

# Commit changes
git add .
git commit -m "Add password reset functionality"

# Push to deploy (if auto-deploy enabled)
git push

# OR use Netlify CLI
netlify deploy --prod
```
