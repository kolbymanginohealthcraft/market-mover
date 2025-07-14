-- Remove report generation and data export activities from the system
-- Update the activity_type check constraint to only allow the three main activity types

-- Drop the existing constraint first
ALTER TABLE user_activities 
DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;

-- Create a new constraint with only the activity types we want to track
ALTER TABLE user_activities 
ADD CONSTRAINT user_activities_activity_type_check 
CHECK (activity_type = ANY (ARRAY[
  'search_providers'::text,
  'view_provider'::text, 
  'save_market'::text
]));

-- Remove any existing activities with the removed types
DELETE FROM user_activities 
WHERE activity_type IN ('generate_report', 'export_data');

-- Update user_progress to remove reports_generated
DELETE FROM user_progress 
WHERE progress_type = 'reports_generated';

-- Update user_roi to remove reports_generated column if it exists
-- (This will fail if the column doesn't exist, which is fine)
ALTER TABLE user_roi 
DROP COLUMN IF EXISTS reports_generated;

-- Drop the report generation trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_report_progress ON user_activities;
DROP FUNCTION IF EXISTS update_report_progress(); 