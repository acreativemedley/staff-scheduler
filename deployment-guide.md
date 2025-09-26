# Deployment Guide for Staff Scheduler

## Prerequisites
1. A Netlify account (free at netlify.com)
2. Your Supabase project with the database schema set up

## Steps to Deploy

### 1. Set up Supabase Database
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from `database-setup.md`

### 2. Deploy to Netlify

#### Option A: Deploy from GitHub (Recommended)
1. Push your code to a GitHub repository
2. Go to netlify.com and sign in
3. Click "New site from Git"
4. Connect your GitHub account and select your repository
5. Build settings should auto-detect:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

#### Option B: Manual Deploy
1. Run `npm run build` locally
2. Go to netlify.com and sign in
3. Drag and drop the `dist` folder to the deploy area

### 3. Set Environment Variables in Netlify
1. In your Netlify site dashboard, go to Site settings → Environment variables
2. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### 4. Test Your Deployment
1. Visit your Netlify site URL
2. Try signing up with a test email
3. Sign in and add some employee data
4. Have a friend/colleague sign up and test adding data

## What This Proves
- Multiple users can access the same application
- Users can authenticate independently
- Both users can add data to the shared database
- Data persists and is visible to all authenticated users
- The app works on any device with internet access

## Next Steps
Once this simple version works, you can expand with:
- User roles and permissions
- More complex data entry forms
- Schedule management features
- Better UI/UX design