-- Enhanced Time-Off Requests with Recurring Pattern Support
-- Run this SQL in your Supabase SQL Editor to add recurring pattern support

-- First, let's add columns to support recurring patterns
ALTER TABLE time_off_requests 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern VARCHAR(50), -- 'weekly', 'biweekly', 'monthly', 'custom'
ADD COLUMN recurrence_interval INTEGER DEFAULT 1, -- every N weeks/months
ADD COLUMN recurrence_days_of_week INTEGER[], -- [1,2,3] for Mon,Tue,Wed (1=Monday, 7=Sunday)
ADD COLUMN recurrence_start_date DATE, -- when the recurring pattern starts
ADD COLUMN recurrence_end_date DATE, -- when the recurring pattern ends
ADD COLUMN parent_request_id UUID REFERENCES time_off_requests(id); -- links generated instances to parent

-- Add check constraints for recurrence patterns
ALTER TABLE time_off_requests 
ADD CONSTRAINT valid_recurrence_pattern 
CHECK (
  (is_recurring = false) OR 
  (is_recurring = true AND recurrence_pattern IN ('weekly', 'biweekly', 'monthly', 'custom'))
);

-- Create an index for better performance when querying recurring patterns
CREATE INDEX idx_time_off_recurring ON time_off_requests(is_recurring, recurrence_pattern, recurrence_start_date, recurrence_end_date);
CREATE INDEX idx_time_off_parent ON time_off_requests(parent_request_id);

-- Add comments to explain the new fields
COMMENT ON COLUMN time_off_requests.is_recurring IS 'Whether this is a recurring time-off pattern';
COMMENT ON COLUMN time_off_requests.recurrence_pattern IS 'Type of recurrence: weekly, biweekly, monthly, custom';
COMMENT ON COLUMN time_off_requests.recurrence_interval IS 'Interval for recurrence (e.g., every 2 weeks)';
COMMENT ON COLUMN time_off_requests.recurrence_days_of_week IS 'Array of day numbers (1=Monday, 7=Sunday) for recurring pattern';
COMMENT ON COLUMN time_off_requests.recurrence_start_date IS 'Start date for the recurring pattern';
COMMENT ON COLUMN time_off_requests.recurrence_end_date IS 'End date for the recurring pattern (when to stop generating instances)';
COMMENT ON COLUMN time_off_requests.parent_request_id IS 'References the parent recurring request for generated instances';

-- Create a function to generate recurring time-off instances
CREATE OR REPLACE FUNCTION generate_recurring_time_off_instances(
  p_request_id UUID,
  p_generate_until_date DATE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  recurring_request RECORD;
  instance_date DATE;
  end_date DATE;
  days_to_add INTEGER;
  current_week_start DATE;
  target_weekday INTEGER;
  instances_created INTEGER := 0;
BEGIN
  -- Get the recurring request details
  SELECT * INTO recurring_request 
  FROM time_off_requests 
  WHERE id = p_request_id AND is_recurring = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring request not found: %', p_request_id;
  END IF;
  
  -- Set the end date for generation (default to 1 year from now)
  end_date := COALESCE(
    p_generate_until_date,
    recurring_request.recurrence_end_date,
    CURRENT_DATE + INTERVAL '1 year'
  );
  
  -- Delete existing instances for this parent request
  DELETE FROM time_off_requests WHERE parent_request_id = p_request_id;
  
  -- Generate instances based on pattern type
  CASE recurring_request.recurrence_pattern
    WHEN 'weekly' THEN
      -- Generate weekly instances
      instance_date := recurring_request.recurrence_start_date;
      WHILE instance_date <= end_date LOOP
        INSERT INTO time_off_requests (
          employee_id, start_date, end_date, request_type,
          partial_start_time, partial_end_time, status, reason,
          is_recurring, parent_request_id
        ) VALUES (
          recurring_request.employee_id, instance_date, instance_date,
          recurring_request.request_type, recurring_request.partial_start_time,
          recurring_request.partial_end_time, 'approved',
          recurring_request.reason || ' (Recurring: Weekly)',
          false, p_request_id
        );
        instances_created := instances_created + 1;
        instance_date := instance_date + (7 * recurring_request.recurrence_interval);
      END LOOP;
      
    WHEN 'biweekly' THEN
      -- Generate biweekly instances (every 2 weeks)
      instance_date := recurring_request.recurrence_start_date;
      WHILE instance_date <= end_date LOOP
        INSERT INTO time_off_requests (
          employee_id, start_date, end_date, request_type,
          partial_start_time, partial_end_time, status, reason,
          is_recurring, parent_request_id
        ) VALUES (
          recurring_request.employee_id, instance_date, instance_date,
          recurring_request.request_type, recurring_request.partial_start_time,
          recurring_request.partial_end_time, 'approved',
          recurring_request.reason || ' (Recurring: Bi-weekly)',
          false, p_request_id
        );
        instances_created := instances_created + 1;
        instance_date := instance_date + 14;
      END LOOP;
      
    WHEN 'monthly' THEN
      -- Generate monthly instances (same day of month)
      instance_date := recurring_request.recurrence_start_date;
      WHILE instance_date <= end_date LOOP
        INSERT INTO time_off_requests (
          employee_id, start_date, end_date, request_type,
          partial_start_time, partial_end_time, status, reason,
          is_recurring, parent_request_id
        ) VALUES (
          recurring_request.employee_id, instance_date, instance_date,
          recurring_request.request_type, recurring_request.partial_start_time,
          recurring_request.partial_end_time, 'approved',
          recurring_request.reason || ' (Recurring: Monthly)',
          false, p_request_id
        );
        instances_created := instances_created + 1;
        -- Add months, handling month-end edge cases
        instance_date := instance_date + (recurring_request.recurrence_interval || ' months')::INTERVAL;
      END LOOP;
      
    ELSE
      RAISE EXCEPTION 'Unsupported recurrence pattern: %', recurring_request.recurrence_pattern;
  END CASE;
  
  RETURN instances_created;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_recurring_time_off_instances TO authenticated;