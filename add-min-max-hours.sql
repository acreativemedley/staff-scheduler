-- Add minimum and maximum hours columns to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS minimum_hours_per_week INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS maximum_hours_per_week INTEGER DEFAULT 50;

-- Add constraints to ensure logical values
ALTER TABLE employees 
ADD CONSTRAINT check_hours_logical 
CHECK (
  minimum_hours_per_week <= preferred_hours_per_week 
  AND preferred_hours_per_week <= maximum_hours_per_week
  AND minimum_hours_per_week >= 0
  AND maximum_hours_per_week <= 80
);