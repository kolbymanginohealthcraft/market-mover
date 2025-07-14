-- Add DELETE policies for activity tables

-- Drop existing DELETE policies if they exist
DROP POLICY IF EXISTS "Users can delete own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can delete own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can delete own roi" ON user_roi;

-- Create DELETE policies
CREATE POLICY "Users can delete own activities" ON user_activities
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON user_progress
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own streaks" ON user_streaks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roi" ON user_roi
  FOR DELETE USING (auth.uid() = user_id); 