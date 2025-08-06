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

-- Fix RLS policies that are too restrictive
-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Platform users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Platform users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Platform users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Platform users can delete profiles" ON profiles;

-- Create simple, permissive policies
-- Allow authenticated users to view all profiles (for admin functions)
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow Platform Admin and Platform Support to update any profile
CREATE POLICY "Platform users can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Allow Platform Admin and Platform Support to insert profiles
CREATE POLICY "Platform users can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Allow Platform Admin and Platform Support to delete profiles
CREATE POLICY "Platform users can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Verify the policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test access
SELECT id, email, role FROM profiles WHERE id = auth.uid(); 