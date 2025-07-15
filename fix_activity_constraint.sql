-- Fix the activity_type check constraint to include all our activity types

-- Drop the existing constraint
ALTER TABLE user_activities 
DROP CONSTRAINT user_activities_activity_type_check;

-- Create a new constraint that includes all our activity types
ALTER TABLE user_activities 
ADD CONSTRAINT user_activities_activity_type_check 
CHECK (activity_type = ANY (ARRAY[
  'search_providers'::text,
  'view_provider'::text, 
  'save_market'::text,
  'view_market'::text
])); 