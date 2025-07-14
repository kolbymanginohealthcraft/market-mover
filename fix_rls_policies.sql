-- Fix RLS policies for user_activities table
-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_activities';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;

-- Create correct RLS policies
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Also fix other activity-related tables
-- user_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- user_streaks
DROP POLICY IF EXISTS "Users can view their own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert their own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update their own streaks" ON user_streaks;

CREATE POLICY "Users can view their own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- user_roi
DROP POLICY IF EXISTS "Users can view their own roi" ON user_roi;
DROP POLICY IF EXISTS "Users can insert their own roi" ON user_roi;
DROP POLICY IF EXISTS "Users can update their own roi" ON user_roi;

CREATE POLICY "Users can view their own roi" ON user_roi
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roi" ON user_roi
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roi" ON user_roi
  FOR UPDATE USING (auth.uid() = user_id); 