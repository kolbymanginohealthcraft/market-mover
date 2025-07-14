-- Check constraints on user_activities table
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_activities'::regclass;

-- Check the activity_type column specifically
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_activities' 
AND column_name = 'activity_type'; 