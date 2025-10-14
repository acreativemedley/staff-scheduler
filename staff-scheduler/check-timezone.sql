-- Check database timezone settings
-- Run this in your Supabase SQL Editor to see what timezone the database is using

-- Show current timezone setting
SHOW timezone;

-- Show how TIME values are being stored and displayed
SELECT 
  day_of_week,
  name,
  store_open_time,
  store_close_time,
  store_open_time::text as open_as_text,
  store_close_time::text as close_as_text
FROM schedule_templates
ORDER BY day_of_week;

-- Check if there's any timezone conversion happening
SELECT 
  '10:00:00'::TIME as plain_time,
  '10:00:00'::TIME::text as plain_time_text,
  now()::TIME as current_time,
  now()::TIME::text as current_time_text;
