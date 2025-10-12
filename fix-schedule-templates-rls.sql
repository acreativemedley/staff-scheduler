-- Fix Row Level Security (RLS) policies for schedule_templates table
-- Run this in your Supabase SQL Editor

-- First, let's check what policies exist
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
WHERE tablename = 'schedule_templates';

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view schedule templates" ON schedule_templates;
DROP POLICY IF EXISTS "Users can manage schedule templates" ON schedule_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON schedule_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON schedule_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON schedule_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON schedule_templates;

-- Create new permissive policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" 
ON schedule_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON schedule_templates FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON schedule_templates FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON schedule_templates FOR DELETE 
TO authenticated 
USING (true);

-- Verify the new policies were created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'schedule_templates'
ORDER BY policyname;

-- Test: Try to select templates (should work now)
SELECT * FROM schedule_templates ORDER BY day_of_week;
