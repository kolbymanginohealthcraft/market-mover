-- Check current database state and identify issues

-- 1. Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_activities', 'user_streaks', 'user_progress', 'user_roi')
ORDER BY table_name;

-- 2. Check if user_streaks table exists and has correct structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    RAISE NOTICE 'user_streaks table exists';
  ELSE
    RAISE NOTICE 'user_streaks table is MISSING - needs to be created';
  END IF;
END $$;

-- 3. Check if user_activities table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activities') THEN
    RAISE NOTICE 'user_activities table exists';
  ELSE
    RAISE NOTICE 'user_activities table is MISSING - this is a problem!';
  END IF;
END $$;

-- 4. Check activity_type constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%activity_type%';

-- 5. Check if login activity type is allowed
SELECT 'login'::text = ANY(ARRAY['search_providers', 'view_provider', 'save_market']) as login_allowed;

-- 6. Check for existing triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%streak%' OR trigger_name LIKE '%progress%';

-- 7. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('user_activities', 'user_streaks')
ORDER BY tablename, policyname; 