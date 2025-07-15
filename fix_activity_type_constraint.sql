-- Fix the activity_type check constraint to allow all our activity types

-- First, let's see what the current constraint is
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_activities'::regclass 
AND conname LIKE '%activity_type%';

-- Drop the existing constraint (replace 'constraint_name' with the actual name from above)
-- DROP CONSTRAINT IF EXISTS user_activities_activity_type_check ON user_activities;

-- Create a new constraint that allows all our activity types
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;

ALTER TABLE user_activities 
ADD CONSTRAINT user_activities_activity_type_check 
CHECK (activity_type IN (
  'search_providers',
  'view_provider',
  'save_market',
  'view_market'
)); 