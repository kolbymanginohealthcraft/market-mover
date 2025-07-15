-- Comprehensive fix for feature request RLS policies
-- This should resolve the approval issue

-- First, disable RLS temporarily to clean up
ALTER TABLE feature_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_testimonials DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view approved feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can insert their own feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can update vote counts" ON feature_requests;
DROP POLICY IF EXISTS "Admins can view all feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Admins can manage all feature requests" ON feature_requests;

DROP POLICY IF EXISTS "Users can view approved testimonials" ON user_testimonials;
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON user_testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON user_testimonials;
DROP POLICY IF EXISTS "Admins can manage all testimonials" ON user_testimonials;

-- Re-enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_testimonials ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies for feature_requests
-- 1. Everyone can view approved requests
CREATE POLICY "view_approved_requests" ON feature_requests
    FOR SELECT USING (status = 'approved');

-- 2. Users can insert their own requests
CREATE POLICY "insert_own_requests" ON feature_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own approved requests
CREATE POLICY "update_own_requests" ON feature_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'approved');

-- 4. Admins can do everything (view, insert, update, delete)
CREATE POLICY "admin_full_access" ON feature_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = true
        )
    );

-- Create policies for testimonials
-- 1. Everyone can view approved testimonials
CREATE POLICY "view_approved_testimonials" ON user_testimonials
    FOR SELECT USING (status = 'approved');

-- 2. Users can insert their own testimonials
CREATE POLICY "insert_own_testimonials" ON user_testimonials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Admins can do everything with testimonials
CREATE POLICY "admin_full_access_testimonials" ON user_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = true
        )
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('feature_requests', 'user_testimonials')
ORDER BY tablename, policyname; 