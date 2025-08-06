-- Remove user_streaks table and related objects since we're now calculating streaks
-- directly from user_activities table

-- Drop the trigger that updates streaks
DROP TRIGGER IF EXISTS trigger_update_login_streak ON user_activities;

-- Drop the function that updates streaks
DROP FUNCTION IF EXISTS update_login_streak();

-- Drop the user_streaks table
DROP TABLE IF EXISTS user_streaks;

-- Verify the table is gone
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    RAISE NOTICE 'user_streaks table still exists - removal failed';
  ELSE
    RAISE NOTICE 'user_streaks table successfully removed';
  END IF;
END $$; 