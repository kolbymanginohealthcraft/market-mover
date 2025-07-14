-- Add missing RLS policies for activity tables

-- Add UPDATE policy for user_activities (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activities' AND policyname = 'Users can update own activities') THEN
    CREATE POLICY "Users can update own activities" ON user_activities
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add policies for user_progress (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can view own progress') THEN
    CREATE POLICY "Users can view own progress" ON user_progress
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can insert own progress') THEN
    CREATE POLICY "Users can insert own progress" ON user_progress
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can update own progress') THEN
    CREATE POLICY "Users can update own progress" ON user_progress
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add policies for user_streaks (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can view own streaks') THEN
    CREATE POLICY "Users can view own streaks" ON user_streaks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can insert own streaks') THEN
    CREATE POLICY "Users can insert own streaks" ON user_streaks
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can update own streaks') THEN
    CREATE POLICY "Users can update own streaks" ON user_streaks
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add policies for user_roi (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roi' AND policyname = 'Users can view own roi') THEN
    CREATE POLICY "Users can view own roi" ON user_roi
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roi' AND policyname = 'Users can insert own roi') THEN
    CREATE POLICY "Users can insert own roi" ON user_roi
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roi' AND policyname = 'Users can update own roi') THEN
    CREATE POLICY "Users can update own roi" ON user_roi
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$; 