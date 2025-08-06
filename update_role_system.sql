-- Update role system to use new four-tier hierarchy
-- Remove is_system_admin field and update role column

-- First, let's see what the current data looks like
SELECT id, email, role, is_system_admin FROM profiles WHERE role IS NOT NULL OR is_system_admin = true;

-- Check for existing constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- Drop existing role constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
        AND conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
    END IF;
END $$;

-- Update existing roles to new system
-- Convert system admins to Platform Admin
UPDATE profiles 
SET role = 'Platform Admin' 
WHERE is_system_admin = true;

-- Convert regular admins to Team Admin (if they're not system admins)
UPDATE profiles 
SET role = 'Team Admin' 
WHERE role = 'admin' AND (is_system_admin = false OR is_system_admin IS NULL);

-- Convert members to Team Member
UPDATE profiles 
SET role = 'Team Member' 
WHERE role = 'member';

-- Update any existing NULL roles to Team Member
UPDATE profiles 
SET role = 'Team Member' 
WHERE role IS NULL;

-- Update RLS policies to use role instead of is_system_admin
-- Drop existing policies that depend on is_system_admin
DROP POLICY IF EXISTS admin_full_access ON feature_requests;
DROP POLICY IF EXISTS admin_full_access_testimonials ON user_testimonials;

-- Recreate policies using role column
CREATE POLICY admin_full_access ON feature_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

CREATE POLICY admin_full_access_testimonials ON user_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Remove the is_system_admin column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_system_admin;

-- Make role column NOT NULL
ALTER TABLE profiles 
ALTER COLUMN role SET NOT NULL;

-- Add new constraint to ensure only valid roles are used
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('Platform Admin', 'Platform Support', 'Team Admin', 'Team Member'));

-- Verify the changes
SELECT id, email, role FROM profiles ORDER BY role, email; 