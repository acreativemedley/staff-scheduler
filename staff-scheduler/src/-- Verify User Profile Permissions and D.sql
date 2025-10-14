-- Verify User Profile Permissions and Database Functions
-- Run these queries in your Supabase SQL Editor to test the permission system

-- 1. Check your current user profile and role
SELECT 
  id,
  user_role,
  full_name,
  email,
  is_active,
  created_at
FROM user_profiles 
WHERE id = auth.uid();

-- 2. Test the get_current_user_role() function
SELECT get_current_user_role() as my_current_role;

-- 3. Test the has_permission() function for different permission levels
SELECT 
  has_permission('staff') as can_do_staff_actions,
  has_permission('manager') as can_do_manager_actions,
  has_permission('admin') as can_do_admin_actions;

-- 4. Check what auth.uid() returns (should match your user ID)
SELECT auth.uid() as current_auth_uid;

-- 5. Verify RLS policies are working - try to see all user profiles
-- (As admin, you should see all profiles; as staff/manager, you should see limited profiles)
SELECT 
  id,
  user_role,
  full_name,
  email,
  is_active
FROM user_profiles
ORDER BY created_at;

-- 6. Test employee table permissions
-- Check if you can read employees (should work for all roles)
SELECT COUNT(*) as employee_count FROM employees;

-- 7. Test if the permission functions work in WHERE clauses
SELECT 
  'Can insert employees' as test,
  CASE 
    WHEN has_permission('manager') THEN 'YES - You have manager+ permissions'
    ELSE 'NO - You only have staff permissions'
  END as result;

-- 8. Test if you can see the employee table structure (should work for all authenticated users)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Check if there are any other users in the system
SELECT 
  user_role,
  COUNT(*) as user_count
FROM user_profiles
GROUP BY user_role
ORDER BY user_role;

-- 10. Verify your specific user permissions with detailed output
SELECT 
  up.id,
  up.user_role,
  up.full_name,
  up.email,
  up.is_active,
  get_current_user_role() as function_role,
  has_permission('staff') as staff_perm,
  has_permission('manager') as manager_perm,
  has_permission('admin') as admin_perm,
  CASE 
    WHEN up.user_role = 'admin' THEN 'Should have ALL permissions'
    WHEN up.user_role = 'manager' THEN 'Should have MANAGER + STAFF permissions'
    WHEN up.user_role = 'staff' THEN 'Should have STAFF permissions only'
    ELSE 'Unknown role'
  END as expected_permissions
FROM user_profiles up
WHERE up.id = auth.uid();