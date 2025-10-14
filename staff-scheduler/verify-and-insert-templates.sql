-- First, check if you have any schedule templates
SELECT * FROM schedule_templates ORDER BY day_of_week;

-- If the above query returns no results, run this to insert default templates:
-- Delete any existing templates first (if you want to start fresh)
-- DELETE FROM schedule_templates;

-- Insert default schedule templates
INSERT INTO schedule_templates (name, day_of_week, store_open_time, store_close_time, required_managers, required_staff, is_active) 
VALUES
  ('Sunday Template', 0, '10:00'::TIME, '15:00'::TIME, 0, 3, true),
  ('Monday Template', 1, '10:00'::TIME, '18:00'::TIME, 1, 4, true),
  ('Tuesday Template', 2, '10:00'::TIME, '18:00'::TIME, 1, 4, true),
  ('Wednesday Template', 3, '10:00'::TIME, '18:00'::TIME, 1, 4, true),
  ('Thursday Template', 4, '10:00'::TIME, '18:00'::TIME, 1, 4, true),
  ('Friday Template', 5, '10:00'::TIME, '17:00'::TIME, 1, 4, true),
  ('Saturday Template', 6, '10:00'::TIME, '16:00'::TIME, 1, 4, true)
ON CONFLICT DO NOTHING;

-- Verify the templates were inserted
SELECT 
  day_of_week,
  name,
  store_open_time,
  store_close_time,
  required_managers,
  required_staff,
  is_active
FROM schedule_templates 
ORDER BY day_of_week;
