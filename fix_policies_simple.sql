-- Fix RLS policies for activity tables (simple version)

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can update own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can view own roi" ON user_roi;
DROP POLICY IF EXISTS "Users can insert own roi" ON user_roi;
DROP POLICY IF EXISTS "Users can update own roi" ON user_roi;

-- Create policies for user_activities
CREATE POLICY "Users can update own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user_streaks
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user_roi
CREATE POLICY "Users can view own roi" ON user_roi
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roi" ON user_roi
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roi" ON user_roi
  FOR UPDATE USING (auth.uid() = user_id); 