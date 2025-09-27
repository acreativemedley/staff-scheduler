-- Add Tech role to the staff scheduler
-- This script adds "Tech" as a valid role and position in the employees table

-- First, drop the existing position constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS check_position;

-- First, drop the existing role constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS check_role;

-- Add the new position constraint that includes "Tech"
ALTER TABLE employees 
ADD CONSTRAINT check_position 
CHECK (position IN ('Sales Floor', 'Teacher', 'Tech', 'Manager', 'Owner'));

-- Add the new role constraint that includes "Tech" as a staff role
ALTER TABLE employees 
ADD CONSTRAINT check_role 
CHECK (role IN ('staff', 'manager', 'tech'));

-- Update any existing employees with "Tech" position to have "tech" role
-- (in case there are any)
UPDATE employees SET role = 'tech' WHERE position = 'Tech';

-- Optional: Add a comment to document that 'tech' is considered equivalent to 'staff'
COMMENT ON COLUMN employees.role IS 'Employee role: staff, manager, or tech (tech is considered equivalent to staff for scheduling purposes)';