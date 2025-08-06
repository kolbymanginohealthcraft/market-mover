-- Fix RLS policies for AdminDashboard access
-- The AdminDashboard accesses: profiles, teams, subscriptions, and get_team_members function

-- 1. Fix teams table RLS
-- Drop existing policies
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
DROP POLICY IF EXISTS "teams_update_policy" ON teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON teams;

-- Create permissive policies for teams
CREATE POLICY "teams_select_policy" ON teams
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "teams_update_policy" ON teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support', 'Team Admin')
        )
    );

CREATE POLICY "teams_insert_policy" ON teams
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- 2. Fix subscriptions table RLS
-- Drop existing policies
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;

-- Create permissive policies for subscriptions
CREATE POLICY "subscriptions_select_policy" ON subscriptions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "subscriptions_update_policy" ON subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support', 'Team Admin')
        )
    );

CREATE POLICY "subscriptions_insert_policy" ON subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- 3. Fix team_custom_colors table RLS (if it exists)
-- Drop existing policies
DROP POLICY IF EXISTS "team_custom_colors_select_policy" ON team_custom_colors;
DROP POLICY IF EXISTS "team_custom_colors_update_policy" ON team_custom_colors;
DROP POLICY IF EXISTS "team_custom_colors_insert_policy" ON team_custom_colors;
DROP POLICY IF EXISTS "team_custom_colors_delete_policy" ON team_custom_colors;

-- Create permissive policies for team_custom_colors
CREATE POLICY "team_custom_colors_select_policy" ON team_custom_colors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "team_custom_colors_update_policy" ON team_custom_colors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support', 'Team Admin')
        )
    );

CREATE POLICY "team_custom_colors_insert_policy" ON team_custom_colors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support', 'Team Admin')
        )
    );

CREATE POLICY "team_custom_colors_delete_policy" ON team_custom_colors
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support', 'Team Admin')
        )
    );

-- 4. Check if get_team_members function exists and has proper permissions
-- This function should be accessible to authenticated users
-- If it doesn't exist, we'll need to create it

-- 5. Test access to all tables
SELECT 'Testing access to profiles:' as test_message;
SELECT COUNT(*) as profile_count FROM profiles;

SELECT 'Testing access to teams:' as test_message;
SELECT COUNT(*) as team_count FROM teams;

SELECT 'Testing access to subscriptions:' as test_message;
SELECT COUNT(*) as subscription_count FROM subscriptions;

SELECT 'Testing access to team_custom_colors:' as test_message;
SELECT COUNT(*) as color_count FROM team_custom_colors;

-- 6. Verify all policies are created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'teams', 'subscriptions', 'team_custom_colors')
ORDER BY tablename, policyname; 