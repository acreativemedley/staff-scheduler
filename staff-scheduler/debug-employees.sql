-- Debug Employees Table Access
-- Run these queries in Supabase SQL Editor to check employees table

-- 1. Check if we can access employees table directly
SELECT COUNT(*) as total_employees FROM employees;

-- 2. Check first few employees to see structure
SELECT id, full_name, position, role, status, created_at 
FROM employees 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check RLS status on employees table
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
WHERE tablename = 'employees';

-- 4. If RLS is causing issues, temporarily disable it
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions to authenticated users
GRANT SELECT ON employees TO authenticated;

-- 6. Test the exact query the app is using
SELECT id, full_name, status FROM employees ORDER BY full_name;

-- 7. Check what policies exist on employees table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'employees';