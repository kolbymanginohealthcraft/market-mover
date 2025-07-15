-- Add view_market activity type to the database constraint

-- Drop the existing constraint first
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;

-- Create a new constraint that includes the new view_market activity type
ALTER TABLE user_activities 
ADD CONSTRAINT user_activities_activity_type_check 
CHECK (activity_type = ANY (ARRAY[
  'search_providers'::text,
  'view_provider'::text, 
  'save_market'::text,
  'view_market'::text
]));

-- Verify the constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_activities'::regclass 
AND conname LIKE '%activity_type%'; 