-- Fix RLS policies for feedback tables
-- ManageFeedback accesses: feature_requests, user_testimonials, profiles

-- 1. Fix feature_requests table RLS
-- Drop existing policies
DROP POLICY IF EXISTS "feature_requests_select_policy" ON feature_requests;
DROP POLICY IF EXISTS "feature_requests_update_policy" ON feature_requests;
DROP POLICY IF EXISTS "feature_requests_insert_policy" ON feature_requests;
DROP POLICY IF EXISTS "feature_requests_delete_policy" ON feature_requests;

-- Create permissive policies for feature_requests
CREATE POLICY "feature_requests_select_policy" ON feature_requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "feature_requests_update_policy" ON feature_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "feature_requests_insert_policy" ON feature_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "feature_requests_delete_policy" ON feature_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- 2. Fix user_testimonials table RLS
-- Drop existing policies
DROP POLICY IF EXISTS "user_testimonials_select_policy" ON user_testimonials;
DROP POLICY IF EXISTS "user_testimonials_update_policy" ON user_testimonials;
DROP POLICY IF EXISTS "user_testimonials_insert_policy" ON user_testimonials;
DROP POLICY IF EXISTS "user_testimonials_delete_policy" ON user_testimonials;

-- Create permissive policies for user_testimonials
CREATE POLICY "user_testimonials_select_policy" ON user_testimonials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user_testimonials_update_policy" ON user_testimonials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY "user_testimonials_insert_policy" ON user_testimonials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "user_testimonials_delete_policy" ON user_testimonials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- 3. Test access to all tables
SELECT 'Testing access to feature_requests:' as test_message;
SELECT COUNT(*) as request_count FROM feature_requests;

SELECT 'Testing access to user_testimonials:' as test_message;
SELECT COUNT(*) as testimonial_count FROM user_testimonials;

SELECT 'Testing access to profiles:' as test_message;
SELECT COUNT(*) as profile_count FROM profiles;

-- 4. Verify all policies are created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('feature_requests', 'user_testimonials', 'profiles')
ORDER BY tablename, policyname; 