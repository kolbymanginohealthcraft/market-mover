-- Fix RLS policies for feature requests to allow admin approval/rejection

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view approved feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can insert their own feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can update vote counts" ON feature_requests;
DROP POLICY IF EXISTS "Admins can view all feature requests" ON feature_requests;

-- Create new policies that work properly
-- Users can view approved requests
CREATE POLICY "Users can view approved feature requests" ON feature_requests
    FOR SELECT USING (status = 'approved');

-- Users can insert their own requests
CREATE POLICY "Users can insert their own feature requests" ON feature_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update vote counts on approved requests
CREATE POLICY "Users can update vote counts" ON feature_requests
    FOR UPDATE USING (status = 'approved');

-- Admins can do everything (view, insert, update, delete)
CREATE POLICY "Admins can manage all feature requests" ON feature_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = true
        )
    );

-- Also fix testimonials policies
DROP POLICY IF EXISTS "Users can view approved testimonials" ON user_testimonials;
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON user_testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON user_testimonials;

-- Users can view approved testimonials
CREATE POLICY "Users can view approved testimonials" ON user_testimonials
    FOR SELECT USING (status = 'approved');

-- Users can insert their own testimonials
CREATE POLICY "Users can insert their own testimonials" ON user_testimonials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can do everything with testimonials
CREATE POLICY "Admins can manage all testimonials" ON user_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = true
        )
    );

-- Make sure RLS is enabled
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_testimonials ENABLE ROW LEVEL SECURITY; 