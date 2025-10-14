-- Add 'owner' role to user_profiles table
-- This updates the check constraint to allow the 'owner' role

-- First, drop the existing constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS check_user_role;

-- Then, add the updated constraint with 'owner' included
ALTER TABLE user_profiles ADD CONSTRAINT check_user_role 
  CHECK (user_role IN ('staff', 'manager', 'owner', 'admin'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_profiles'::regclass 
  AND conname = 'check_user_role';
