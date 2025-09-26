-- Updated Database Schema for Retail Store Scheduling

-- First, let's update the existing employees table and add new tables
-- Run these SQL commands in your Supabase SQL Editor

-- Update employees table to add retail-specific fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_hours_per_week INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS minimum_hours_per_week INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS maximum_hours_per_week INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- First, update any existing employees with invalid positions
UPDATE employees SET position = 'Sales Floor' WHERE position NOT IN ('Sales Floor', 'Teacher', 'Manager', 'Owner');

-- Update the position field to use specific retail positions
ALTER TABLE employees 
ALTER COLUMN position SET DEFAULT 'Sales Floor';

-- Drop existing constraints if they exist to avoid conflicts
ALTER TABLE employees DROP CONSTRAINT IF EXISTS check_position;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS check_hours_logical;

-- Add check constraint for positions (after cleaning up data)
ALTER TABLE employees 
ADD CONSTRAINT check_position 
CHECK (position IN ('Sales Floor', 'Teacher', 'Manager', 'Owner'));

-- Add check constraint for roles
ALTER TABLE employees 
ADD CONSTRAINT check_role 
CHECK (role IN ('staff', 'manager'));

-- Add constraint for logical hours
ALTER TABLE employees 
ADD CONSTRAINT check_hours_logical 
CHECK (
  minimum_hours_per_week <= preferred_hours_per_week 
  AND preferred_hours_per_week <= maximum_hours_per_week
  AND minimum_hours_per_week >= 0
  AND maximum_hours_per_week <= 80
);

-- Create employee_availability table for RED/GREEN/YELLOW system
CREATE TABLE IF NOT EXISTS employee_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, 2=Tuesday, etc.
  status VARCHAR(10) NOT NULL CHECK (status IN ('red', 'green', 'yellow')),
  earliest_start_time TIME,
  latest_end_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(employee_id, day_of_week)
);

-- Create time_off_requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  request_type VARCHAR(20) DEFAULT 'full_days' CHECK (request_type IN ('full_days', 'partial_day')),
  partial_start_time TIME, -- Only used for partial_day requests
  partial_end_time TIME,   -- Only used for partial_day requests
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'denied')),
  reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES employees(id),
  manager_notes TEXT
);

-- Create schedule_templates table
CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  store_open_time TIME NOT NULL,
  store_close_time TIME NOT NULL,
  required_managers INTEGER DEFAULT 1,
  required_staff INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create schedules table for actual weekly schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'no_show')),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security on all new tables
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view all availability" ON employee_availability;
DROP POLICY IF EXISTS "Users can manage availability" ON employee_availability;
DROP POLICY IF EXISTS "Users can view all time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Users can create time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Users can update time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Users can view schedule templates" ON schedule_templates;
DROP POLICY IF EXISTS "Users can manage schedule templates" ON schedule_templates;
DROP POLICY IF EXISTS "Users can view schedules" ON schedules;
DROP POLICY IF EXISTS "Users can manage schedules" ON schedules;

-- Create policies for employee_availability
CREATE POLICY "Users can view all availability" ON employee_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage availability" ON employee_availability FOR ALL TO authenticated USING (true);

-- Create policies for time_off_requests
CREATE POLICY "Users can view all time off requests" ON time_off_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create time off requests" ON time_off_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update time off requests" ON time_off_requests FOR UPDATE TO authenticated USING (true);

-- Create policies for schedule_templates
CREATE POLICY "Users can view schedule templates" ON schedule_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage schedule templates" ON schedule_templates FOR ALL TO authenticated USING (true);

-- Create policies for schedules
CREATE POLICY "Users can view schedules" ON schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage schedules" ON schedules FOR ALL TO authenticated USING (true);

-- Insert default schedule templates for your store (only if they don't exist)
INSERT INTO schedule_templates (name, day_of_week, store_open_time, store_close_time, required_managers, required_staff) 
SELECT * FROM (VALUES
  ('Monday Template', 1, '10:00'::TIME, '18:00'::TIME, 1, 4),
  ('Tuesday Template', 2, '10:00'::TIME, '18:00'::TIME, 1, 4),
  ('Wednesday Template', 3, '10:00'::TIME, '18:00'::TIME, 1, 4),
  ('Thursday Template', 4, '10:00'::TIME, '18:00'::TIME, 1, 4),
  ('Friday Template', 5, '10:00'::TIME, '17:00'::TIME, 1, 4),
  ('Saturday Template', 6, '10:00'::TIME, '16:00'::TIME, 1, 4),
  ('Sunday Template', 0, '10:00'::TIME, '15:00'::TIME, 0, 3)
) AS v(name, day_of_week, store_open_time, store_close_time, required_managers, required_staff)
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_templates 
  WHERE schedule_templates.day_of_week = v.day_of_week
);

-- Update existing employees to have proper roles based on positions
UPDATE employees SET role = 'manager' WHERE position IN ('Manager', 'Owner');
UPDATE employees SET role = 'staff' WHERE position IN ('Sales Floor', 'Teacher');