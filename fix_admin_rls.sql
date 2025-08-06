-- Comprehensive RLS fix for admin access
-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Platform users can update any profile" ON profiles;
DROP POLICY IF EXISTS "Platform users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Platform users can delete profiles" ON profiles;

-- Create comprehensive policies that allow admin access
-- 1. Allow all authenticated users to view profiles (needed for admin functions)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow users to update their own profile
CREATE POLICY "profiles_update_own_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Allow Platform Admin and Platform Support to update any profile
CREATE POLICY "profiles_update_admin_policy" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- 4. Allow Platform Admin and Platform Support to insert profiles
CREATE POLICY "profiles_insert_admin_policy" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- 5. Allow Platform Admin and Platform Support to delete profiles
CREATE POLICY "profiles_delete_admin_policy" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Test the policies
SELECT 'Testing profile access for current user:' as test_message;
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Verify all policies are created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname; 