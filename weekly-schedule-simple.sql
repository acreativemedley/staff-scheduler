-- Weekly Schedule Storage for Specific Week Instances
-- Run this SQL in your Supabase SQL Editor

-- Create a table to store specific weekly schedule instances
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL, -- The Sunday date of the week
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL, -- The specific date for this shift
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position VARCHAR(50),
  notes TEXT,
  is_from_base BOOLEAN DEFAULT true, -- Whether this came from base_schedule or was added manually
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Ensure one shift per employee per day
  UNIQUE(employee_id, schedule_date)
);

-- Enable Row Level Security
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for weekly_schedules
CREATE POLICY "Users can view weekly schedules" ON weekly_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create weekly schedule entries" ON weekly_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update weekly schedule entries" ON weekly_schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete weekly schedule entries" ON weekly_schedules FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_weekly_schedules_week ON weekly_schedules(week_start_date);
CREATE INDEX idx_weekly_schedules_employee ON weekly_schedules(employee_id);
CREATE INDEX idx_weekly_schedules_date ON weekly_schedules(schedule_date);
CREATE INDEX idx_weekly_schedules_week_employee ON weekly_schedules(week_start_date, employee_id);

-- Add comments
COMMENT ON TABLE weekly_schedules IS 'Stores specific weekly schedule instances with modifications';
COMMENT ON COLUMN weekly_schedules.week_start_date IS 'The Sunday date of the week (for grouping)';
COMMENT ON COLUMN weekly_schedules.schedule_date IS 'The specific date for this shift';
COMMENT ON COLUMN weekly_schedules.is_from_base IS 'Whether this shift originated from base_schedule or was manually added';