-- Update existing feedback tables to include status field for approval workflow

-- Add status column to user_testimonials table
ALTER TABLE user_testimonials 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add status column to feature_requests table
ALTER TABLE feature_requests 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing records to be approved (for backward compatibility)
UPDATE user_testimonials SET status = 'approved' WHERE status IS NULL;
UPDATE feature_requests SET status = 'approved' WHERE status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_testimonials_status ON user_testimonials(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);

-- Update RLS policies to include status checks
-- For user_testimonials: users can only see approved testimonials
DROP POLICY IF EXISTS "Users can view approved testimonials" ON user_testimonials;
CREATE POLICY "Users can view approved testimonials" ON user_testimonials
    FOR SELECT USING (status = 'approved');

-- Users can insert their own testimonials
DROP POLICY IF EXISTS "Users can insert their own testimonials" ON user_testimonials;
CREATE POLICY "Users can insert their own testimonials" ON user_testimonials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all testimonials
DROP POLICY IF EXISTS "Admins can view all testimonials" ON user_testimonials;
CREATE POLICY "Admins can view all testimonials" ON user_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = true
        )
    );

-- For feature_requests: users can only see approved requests
DROP POLICY IF EXISTS "Users can view approved feature requests" ON feature_requests;
CREATE POLICY "Users can view approved feature requests" ON feature_requests
    FOR SELECT USING (status = 'approved');

-- Users can insert their own feature requests
DROP POLICY IF EXISTS "Users can insert their own feature requests" ON feature_requests;
CREATE POLICY "Users can insert their own feature requests" ON feature_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update vote counts on approved requests
DROP POLICY IF EXISTS "Users can update vote counts" ON feature_requests;
CREATE POLICY "Users can update vote counts" ON feature_requests
    FOR UPDATE USING (status = 'approved');

-- Admins can view all feature requests
DROP POLICY IF EXISTS "Admins can view all feature requests" ON feature_requests;
CREATE POLICY "Admins can view all feature requests" ON feature_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_system_admin = true
        )
    );

-- Enable RLS on both tables
ALTER TABLE user_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY; 