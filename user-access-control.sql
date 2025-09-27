-- User Access Control System for Staff Scheduler
-- This script creates a role-based access control system with Admin, Manager, and Staff user types

-- Create user_profiles table to extend Supabase auth.users with role information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL DEFAULT 'staff',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  full_name VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure valid user roles
  CONSTRAINT check_user_role CHECK (user_role IN ('admin', 'manager', 'staff'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles table

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Policy: Managers can read staff and other manager profiles
CREATE POLICY "Managers can read staff and manager profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_role IN ('admin', 'manager')
    )
  );

-- Policy: Only admins can insert new user profiles
CREATE POLICY "Only admins can insert user profiles" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Policy: Admins can update any profile, users can update their own basic info
CREATE POLICY "Users can update profiles" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Policy: Only admins can delete user profiles
CREATE POLICY "Only admins can delete user profiles" ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, user_role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    CASE 
      -- First user becomes admin
      WHEN (SELECT COUNT(*) FROM user_profiles) = 0 THEN 'admin'
      -- Otherwise default to staff
      ELSE 'staff'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get current user's role (useful for RLS and frontend)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN (
    SELECT user_role 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has permission for a specific action
CREATE OR REPLACE FUNCTION has_permission(required_role VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
  current_role VARCHAR(20);
BEGIN
  SELECT user_role INTO current_role
  FROM user_profiles 
  WHERE id = auth.uid();
  
  -- Admin has all permissions
  IF current_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Manager has manager and staff permissions
  IF current_role = 'manager' AND required_role IN ('manager', 'staff') THEN
    RETURN true;
  END IF;
  
  -- Staff only has staff permissions
  IF current_role = 'staff' AND required_role = 'staff' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing RLS policies for employees table to respect user roles

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;

-- New RLS policies for employees table based on user roles

-- Everyone can read employees
CREATE POLICY "All authenticated users can read employees" ON employees
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and managers can insert employees
CREATE POLICY "Admins and managers can insert employees" ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('manager'));

-- Only admins and managers can update employees
CREATE POLICY "Admins and managers can update employees" ON employees
  FOR UPDATE
  TO authenticated
  USING (has_permission('manager'));

-- Only admins can delete employees
CREATE POLICY "Only admins can delete employees" ON employees
  FOR DELETE
  TO authenticated
  USING (has_permission('admin'));

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(VARCHAR) TO authenticated;

-- Insert a sample admin user (replace with your actual email)
-- This will only work if you run this after creating your first user account
-- INSERT INTO user_profiles (id, user_role, full_name, email) 
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com' LIMIT 1),
--   'admin',
--   'Admin User',
--   'your-admin-email@example.com'
-- )
-- ON CONFLICT (id) DO UPDATE SET user_role = 'admin';

COMMENT ON TABLE user_profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN user_profiles.user_role IS 'User access level: admin (full access), manager (employee management), staff (read-only)';
COMMENT ON FUNCTION get_current_user_role() IS 'Returns the current authenticated user role';
COMMENT ON FUNCTION has_permission(VARCHAR) IS 'Checks if current user has the required permission level';