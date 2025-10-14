-- Debug query to check time-off requests
-- Run this in Supabase SQL Editor

-- 1. Check total time-off requests
SELECT COUNT(*) as total_requests FROM time_off_requests;

-- 2. Check recent time-off requests with employee info
SELECT 
  t.id,
  t.employee_id,
  e.full_name,
  t.start_date,
  t.end_date,
  t.request_type,
  t.reason,
  t.is_recurring,
  t.parent_request_id,
  t.created_at
FROM time_off_requests t
LEFT JOIN employees e ON t.employee_id = e.id
ORDER BY t.created_at DESC
LIMIT 20;

-- 3. Check if there are any requests for the current/upcoming week
SELECT 
  t.id,
  e.full_name,
  t.start_date,
  t.end_date,
  t.request_type,
  t.reason
FROM time_off_requests t
LEFT JOIN employees e ON t.employee_id = e.id
WHERE t.start_date >= CURRENT_DATE - INTERVAL '7 days'
  AND t.start_date <= CURRENT_DATE + INTERVAL '14 days'
ORDER BY t.start_date;

-- 4. Check RLS policies on time_off_requests table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'time_off_requests';

-- 5. Test if current user can see time-off requests
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'role' as current_role,
  COUNT(*) as visible_requests
FROM time_off_requests;
