-- Debugging Queries for User Profiles Issue
-- Run these queries in your Supabase SQL Editor to troubleshoot the loading problem

-- 1. Check if user_profiles table exists and what's in it (bypasses RLS)
SELECT * FROM user_profiles;

-- 2. Count total profiles in the table
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- IMMEDIATE FIX: Temporarily disable RLS and grant direct permissions
-- Run these commands in order:

-- 1. Disable RLS completely
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions to bypass any remaining issues
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- 3. Test the query directly
SELECT * FROM user_profiles;

-- 4. If that works, try this specific query
SELECT * FROM user_profiles WHERE id = '55623c28-3858-4669-9d82-41a10a1f1e98';

-- After your app loads successfully, you can re-enable RLS with fixed policies:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Check what auth.uid() returns (should match your user ID)
SELECT auth.uid() as current_user_id;

-- 5. Check if your profile exists and what role it has (respects RLS)
SELECT id, user_role, full_name, email, is_active 
FROM user_profiles 
WHERE id = auth.uid();

-- 6. Check all auth users (to see if the user exists in auth.users)
SELECT id, email, created_at FROM auth.users;

-- FIXES (use one of these if needed):

-- Fix Option 1: Update existing profile to admin
UPDATE user_profiles 
SET 
  user_role = 'admin',
  full_name = 'Admin User',
  email = 'your-email@example.com',  -- replace with your actual email
  is_active = true
WHERE id = '55623c28-3858-4669-9d82-41a10a1f1e98';

-- Fix Option 2: Delete and recreate profile
DELETE FROM user_profiles WHERE id = '55623c28-3858-4669-9d82-41a10a1f1e98';

INSERT INTO user_profiles (id, user_role, full_name, email, is_active) 
VALUES (
  '55623c28-3858-4669-9d82-41a10a1f1e98',
  'admin',
  'Admin User',
  'your-email@example.com',  -- replace with your actual email
  true
);

-- Fix Option 3: Temporarily disable RLS for debugging
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- (Run this, then refresh your app, then run the next line)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Fix Option 4: Grant SELECT permissions to bypass RLS issues
GRANT SELECT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO authenticated;
GRANT UPDATE ON user_profiles TO authenticated;