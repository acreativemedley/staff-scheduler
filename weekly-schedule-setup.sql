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

-- Function to get/create a weekly schedule based on base schedule
CREATE OR REPLACE FUNCTION get_or_create_weekly_schedule(p_week_start_date DATE)
RETURNS TABLE (
  id UUID,
  week_start_date DATE,
  employee_id UUID,
  employee_name TEXT,
  employee_position TEXT,
  schedule_date DATE,
  start_time TIME,
  end_time TIME,
  job_position TEXT,
  notes TEXT,
  is_from_base BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if this week already has saved schedule data
  IF EXISTS (SELECT 1 FROM weekly_schedules WHERE weekly_schedules.week_start_date = p_week_start_date) THEN
    -- Return the saved weekly schedule
    RETURN QUERY
    SELECT
      ws.id,
      ws.week_start_date,
      ws.employee_id,
      COALESCE(e.full_name, 'Unknown Employee') AS employee_name,
      COALESCE(e.position, ws.position, 'Unknown Position') AS employee_position,
      ws.schedule_date,
      ws.start_time,
      ws.end_time,
      COALESCE(ws.position, e.position) AS job_position,
      COALESCE(ws.notes, '') AS notes,
      ws.is_from_base
    FROM weekly_schedules ws
    LEFT JOIN employees e ON ws.employee_id = e.id
    WHERE ws.week_start_date = p_week_start_date
    ORDER BY ws.schedule_date, ws.start_time, COALESCE(e.full_name, '');
  ELSE
    -- Generate from base schedule and return
    RETURN QUERY
    SELECT
      NULL::UUID as id,
      p_week_start_date as week_start_date,
      bs.employee_id,
      COALESCE(e.full_name, 'Unknown Employee') AS employee_name,
      COALESCE(e.position, bs.position, 'Unknown Position') AS employee_position,
      (p_week_start_date + (bs.day_of_week * INTERVAL '1 day'))::DATE AS schedule_date,
      bs.start_time,
      bs.end_time,
      COALESCE(bs.position, e.position) AS job_position,
      COALESCE(bs.notes, '') AS notes,
      true AS is_from_base
    FROM base_schedule bs
    LEFT JOIN employees e ON bs.employee_id = e.id
    WHERE bs.is_active = true
    ORDER BY (p_week_start_date + (bs.day_of_week * INTERVAL '1 day'))::DATE, bs.start_time, COALESCE(e.full_name, '');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_weekly_schedule(DATE) TO authenticated;