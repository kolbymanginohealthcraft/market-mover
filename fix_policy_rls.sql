-- Fix RLS policies for policy management tables
-- This will prevent the infinite authentication loop when accessing policy data

-- Enable RLS on all policy tables
ALTER TABLE policy_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to policy definitions" ON policy_definitions;
DROP POLICY IF EXISTS "Allow write access to policy definitions" ON policy_definitions;
DROP POLICY IF EXISTS "Allow read access to policy versions" ON policy_versions;
DROP POLICY IF EXISTS "Allow write access to policy versions" ON policy_versions;
DROP POLICY IF EXISTS "Allow read access to policy approvals" ON policy_approvals;
DROP POLICY IF EXISTS "Allow write access to policy approvals" ON policy_approvals;
DROP POLICY IF EXISTS "Allow read access to policy permissions" ON policy_permissions;
DROP POLICY IF EXISTS "Allow write access to policy permissions" ON policy_permissions;

-- Policy Definitions RLS
-- Anyone can read policy definitions
CREATE POLICY "Allow read access to policy definitions" ON policy_definitions
    FOR SELECT USING (true);

-- Only Platform Admin and Platform Support can create/edit policy definitions
CREATE POLICY "Allow write access to policy definitions" ON policy_definitions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Policy Versions RLS
-- Anyone can read policy versions
CREATE POLICY "Allow read access to policy versions" ON policy_versions
    FOR SELECT USING (true);

-- Platform Admin and Platform Support can create new versions
CREATE POLICY "Allow insert access to policy versions" ON policy_versions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Users can update their own versions, Platform Admin and Platform Support can update any
CREATE POLICY "Allow update access to policy versions" ON policy_versions
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Only Platform Admin can delete versions
CREATE POLICY "Allow delete access to policy versions" ON policy_versions
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'Platform Admin'
        )
    );

-- Policy Approvals RLS
-- Only Platform Admin and Platform Support can read approvals
CREATE POLICY "Allow read access to policy approvals" ON policy_approvals
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Platform Admin and Platform Support can create approval records
CREATE POLICY "Allow insert access to policy approvals" ON policy_approvals
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Only Platform Admin can update/delete approval records
CREATE POLICY "Allow update access to policy approvals" ON policy_approvals
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'Platform Admin'
        )
    );

CREATE POLICY "Allow delete access to policy approvals" ON policy_approvals
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'Platform Admin'
        )
    );

-- Policy Permissions RLS
-- Users can read their own permissions, Platform Admin and Platform Support can read all
CREATE POLICY "Allow read access to policy permissions" ON policy_permissions
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('Platform Admin', 'Platform Support')
        )
    );

-- Only Platform Admin can manage permissions
CREATE POLICY "Allow write access to policy permissions" ON policy_permissions
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'Platform Admin'
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT ON policy_definitions TO authenticated;
GRANT SELECT ON policy_versions TO authenticated;
GRANT SELECT ON policy_approvals TO authenticated;
GRANT SELECT ON policy_permissions TO authenticated;

-- Grant insert/update permissions to authenticated users for versions they create
GRANT INSERT ON policy_versions TO authenticated;
GRANT UPDATE ON policy_versions TO authenticated;

-- Grant insert permissions for approvals
GRANT INSERT ON policy_approvals TO authenticated;

-- Grant all permissions to service role (for admin operations)
GRANT ALL ON policy_definitions TO service_role;
GRANT ALL ON policy_versions TO service_role;
GRANT ALL ON policy_approvals TO service_role;
GRANT ALL ON policy_permissions TO service_role;

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE policy_definitions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE policy_versions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE policy_approvals_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE policy_permissions_id_seq TO authenticated;

GRANT USAGE ON SEQUENCE policy_definitions_id_seq TO service_role;
GRANT USAGE ON SEQUENCE policy_versions_id_seq TO service_role;
GRANT USAGE ON SEQUENCE policy_approvals_id_seq TO service_role;
GRANT USAGE ON SEQUENCE policy_permissions_id_seq TO service_role; 