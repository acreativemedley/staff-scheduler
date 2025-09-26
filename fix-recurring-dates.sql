-- Fully updated: generate_recurring_time_off_instances
DROP FUNCTION IF EXISTS generate_recurring_time_off_instances(UUID, DATE);

CREATE OR REPLACE FUNCTION public.generate_recurring_time_off_instances(
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
  instances_created INTEGER := 0;
  duration_interval INTERVAL;
  weekly_interval INTERVAL;
  monthly_interval INTERVAL;
BEGIN
  -- Fetch recurring request
  SELECT * INTO recurring_request
  FROM time_off_requests
  WHERE id = p_request_id AND is_recurring = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring request not found: %', p_request_id;
  END IF;

  -- Validate recurrence_interval presence and positivity (treat NULL as 1)
  IF recurring_request.recurrence_interval IS NULL THEN
    recurring_request.recurrence_interval := 1;
  ELSIF recurring_request.recurrence_interval <= 0 THEN
    RAISE EXCEPTION 'Invalid recurrence_interval: %', recurring_request.recurrence_interval;
  END IF;

  -- Compute end_date (as DATE)
  end_date := COALESCE(
    p_generate_until_date,
    recurring_request.recurrence_end_date,
    (CURRENT_DATE + INTERVAL '1 year')::DATE
  );

  -- If end_date earlier than start_date -> nothing to generate
  IF end_date < recurring_request.start_date THEN
    RETURN 0;
  END IF;

  -- Compute duration between original start and end for multi-day requests
  duration_interval := (recurring_request.end_date - recurring_request.start_date);

  -- Delete only child instances of this recurring request (intentional)
  DELETE FROM time_off_requests
  WHERE parent_request_id = p_request_id;

  -- Prepare common interval values
  weekly_interval := (recurring_request.recurrence_interval || ' weeks')::interval;
  monthly_interval := (recurring_request.recurrence_interval || ' months')::interval;

  CASE recurring_request.recurrence_pattern
    WHEN 'weekly' THEN
      instance_date := (recurring_request.start_date + weekly_interval)::date;
      WHILE instance_date <= end_date LOOP
        INSERT INTO time_off_requests (
          employee_id, start_date, end_date, request_type,
          partial_start_time, partial_end_time, status, reason,
          is_recurring, parent_request_id, submitted_at
        ) VALUES (
          recurring_request.employee_id,
          instance_date,
          CASE
            WHEN recurring_request.request_type = 'partial_day' THEN instance_date
            ELSE (instance_date + duration_interval)::date
          END,
          recurring_request.request_type,
          recurring_request.partial_start_time,
          recurring_request.partial_end_time,
          'approved',
          recurring_request.reason || ' (Recurring: Weekly)',
          false,
          p_request_id,
          NOW()
        );
        instances_created := instances_created + 1;
        instance_date := (instance_date + weekly_interval)::date;
      END LOOP;

    WHEN 'biweekly' THEN
      instance_date := (recurring_request.start_date + INTERVAL '14 days')::date;
      WHILE instance_date <= end_date LOOP
        INSERT INTO time_off_requests (
          employee_id, start_date, end_date, request_type,
          partial_start_time, partial_end_time, status, reason,
          is_recurring, parent_request_id, submitted_at
        ) VALUES (
          recurring_request.employee_id,
          instance_date,
          CASE
            WHEN recurring_request.request_type = 'partial_day' THEN instance_date
            ELSE (instance_date + duration_interval)::date
          END,
          recurring_request.request_type,
          recurring_request.partial_start_time,
          recurring_request.partial_end_time,
          'approved',
          recurring_request.reason || ' (Recurring: Bi-weekly)',
          false,
          p_request_id,
          NOW()
        );
        instances_created := instances_created + 1;
        instance_date := (instance_date + INTERVAL '14 days')::date;
      END LOOP;

    WHEN 'monthly' THEN
      instance_date := (recurring_request.start_date + monthly_interval)::date;
      WHILE instance_date <= end_date LOOP
        INSERT INTO time_off_requests (
          employee_id, start_date, end_date, request_type,
          partial_start_time, partial_end_time, status, reason,
          is_recurring, parent_request_id, submitted_at
        ) VALUES (
          recurring_request.employee_id,
          instance_date,
          CASE
            WHEN recurring_request.request_type = 'partial_day' THEN instance_date
            ELSE (instance_date + duration_interval)::date
          END,
          recurring_request.request_type,
          recurring_request.partial_start_time,
          recurring_request.partial_end_time,
          'approved',
          recurring_request.reason || ' (Recurring: Monthly)',
          false,
          p_request_id,
          NOW()
        );
        instances_created := instances_created + 1;
        instance_date := (instance_date + monthly_interval)::date;
      END LOOP;

    ELSE
      RAISE EXCEPTION 'Unsupported recurrence pattern: %', recurring_request.recurrence_pattern;
  END CASE;

  RETURN instances_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_recurring_time_off_instances(UUID, DATE) TO authenticated;


-- Fully updated: get_base_schedule_for_week
-- Fixed to match US calendar style: Sunday-Saturday weeks
-- p_week_start_date should be the SUNDAY of the week (not Monday)
-- bs.day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
DROP FUNCTION IF EXISTS get_base_schedule_for_week(date);

CREATE OR REPLACE FUNCTION public.get_base_schedule_for_week(p_week_start_date date)
RETURNS TABLE (
  schedule_date text,
  employee_id uuid,
  employee_name text,
  employee_position text,
  start_time time,
  end_time time,
  day_of_week integer,
  notes text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    -- p_week_start_date is now the SUNDAY of the week
    -- Sunday (day_of_week=0) = p_week_start_date + 0 days
    -- Monday (day_of_week=1) = p_week_start_date + 1 day  
    -- Tuesday (day_of_week=2) = p_week_start_date + 2 days
    -- Wednesday (day_of_week=3) = p_week_start_date + 3 days  
    -- Thursday (day_of_week=4) = p_week_start_date + 4 days
    -- Friday (day_of_week=5) = p_week_start_date + 5 days
    -- Saturday (day_of_week=6) = p_week_start_date + 6 days
    (p_week_start_date + (bs.day_of_week * INTERVAL '1 day'))::date::text AS schedule_date,
    bs.employee_id,
    COALESCE(e.full_name, 'Unknown Employee') AS employee_name,
    COALESCE(e.position, bs.position, 'Unknown Position') AS employee_position,
    bs.start_time,
    bs.end_time,
    bs.day_of_week,
    COALESCE(bs.notes, '') AS notes
  FROM base_schedule bs
  LEFT JOIN employees e ON bs.employee_id = e.id
  WHERE bs.is_active = true
  ORDER BY 
    -- Order by actual day sequence: Monday=1, Tuesday=2, ..., Saturday=6, Sunday=0
    CASE WHEN bs.day_of_week = 0 THEN 7 ELSE bs.day_of_week END,
    bs.start_time, 
    COALESCE(e.full_name, '');
$$;

GRANT EXECUTE ON FUNCTION public.get_base_schedule_for_week(date) TO authenticated;