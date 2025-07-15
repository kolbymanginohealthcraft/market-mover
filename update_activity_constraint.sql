-- Update the activity_type check constraint to include only the activity types we want

-- Drop the existing constraint first
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;

-- Create a new constraint with only the activity types we want to track
ALTER TABLE user_activities 
ADD CONSTRAINT user_activities_activity_type_check 
CHECK (activity_type = ANY (ARRAY[
  'login'::text,
  'search_providers'::text,
  'view_provider'::text, 
  'save_market'::text
])); 