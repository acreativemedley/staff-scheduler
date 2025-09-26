-- Base Schedule Storage for Predefined Weekly Schedule
-- Run this SQL in your Supabase SQL Editor

-- Create a table to store your base weekly schedule
CREATE TABLE base_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE base_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for base_schedule
CREATE POLICY "Users can view base schedule" ON base_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create base schedule entries" ON base_schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update base schedule entries" ON base_schedule FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete base schedule entries" ON base_schedule FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_base_schedule_employee ON base_schedule(employee_id);
CREATE INDEX idx_base_schedule_day ON base_schedule(day_of_week);
CREATE INDEX idx_base_schedule_active ON base_schedule(is_active);

-- Add comments
COMMENT ON TABLE base_schedule IS 'Stores the predefined weekly base schedule';
COMMENT ON COLUMN base_schedule.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN base_schedule.is_active IS 'Whether this schedule entry is currently active';

-- Sample data - replace with your actual base schedule
-- You can run these INSERT statements to set up your base schedule

/*
-- Example base schedule entries (uncomment and modify as needed)
INSERT INTO base_schedule (employee_id, day_of_week, start_time, end_time, position, notes) VALUES 
-- Monday (day_of_week = 1)
((SELECT id FROM employees WHERE full_name = 'Manager Name' LIMIT 1), 1, '09:00', '17:00', 'Manager', 'Monday manager shift'),
((SELECT id FROM employees WHERE full_name = 'Staff Member 1' LIMIT 1), 1, '09:00', '17:00', 'Sales Floor', 'Monday staff shift'),
((SELECT id FROM employees WHERE full_name = 'Staff Member 2' LIMIT 1), 1, '10:00', '18:00', 'Sales Floor', 'Monday staff shift'),

-- Tuesday (day_of_week = 2)
((SELECT id FROM employees WHERE full_name = 'Manager Name' LIMIT 1), 2, '09:00', '17:00', 'Manager', 'Tuesday manager shift'),
((SELECT id FROM employees WHERE full_name = 'Staff Member 1' LIMIT 1), 2, '09:00', '17:00', 'Sales Floor', 'Tuesday staff shift'),

-- Add more entries for your specific schedule...
;
*/

-- Function to get base schedule for a specific week
CREATE OR REPLACE FUNCTION get_base_schedule_for_week(
  p_week_start_date DATE
)
RETURNS TABLE (
  schedule_date DATE,
  employee_id UUID,
  employee_name TEXT,
  employee_position TEXT,
  start_time TIME,
  end_time TIME,
  day_of_week INTEGER,
  notes TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p_week_start_date + (bs.day_of_week || ' days')::INTERVAL)::DATE as schedule_date,
    bs.employee_id,
    COALESCE(e.full_name, 'Unknown Employee')::TEXT as employee_name,
    COALESCE(e.position, 'Unknown Position')::TEXT as employee_position,
    bs.start_time,
    bs.end_time,
    bs.day_of_week,
    COALESCE(bs.notes, '')::TEXT as notes
  FROM base_schedule bs
  LEFT JOIN employees e ON bs.employee_id = e.id
  WHERE bs.is_active = true
  ORDER BY bs.day_of_week, bs.start_time, e.full_name;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_base_schedule_for_week TO authenticated;