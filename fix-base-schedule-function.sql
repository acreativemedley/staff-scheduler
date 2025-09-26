-- Fix for the base schedule function
-- Run this SQL in your Supabase SQL Editor to fix the function error

-- Drop and recreate the function with proper type handling
DROP FUNCTION IF EXISTS get_base_schedule_for_week(DATE);

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