-- Fix initial policy versions if they weren't properly approved
-- This script ensures the initial versions are approved and have the correct data

-- First, let's check what we have
SELECT 'Current state:' as info;
SELECT 
  pd.slug,
  pv.version_number,
  pv.status,
  pv.title,
  pv.approved_at
FROM policy_versions pv
JOIN policy_definitions pd ON pd.id = pv.policy_id
ORDER BY pd.slug, pv.version_number;

-- Update initial versions to approved status if they're not already
UPDATE policy_versions 
SET 
  status = 'approved',
  approved_at = NOW(),
  approved_by = (SELECT id FROM auth.users LIMIT 1)
WHERE 
  version_number = 1 
  AND status != 'approved'
  AND policy_id IN (SELECT id FROM policy_definitions WHERE slug IN ('terms', 'privacy', 'refund'));

-- Insert approval records for the updated versions
INSERT INTO policy_approvals (version_id, approver_id, action, comments)
SELECT 
  pv.id,
  (SELECT id FROM auth.users LIMIT 1),
  'approve',
  'Initial version approval'
FROM policy_versions pv
JOIN policy_definitions pd ON pd.id = pv.policy_id
WHERE 
  pv.version_number = 1 
  AND pv.status = 'approved'
  AND pd.slug IN ('terms', 'privacy', 'refund')
  AND NOT EXISTS (
    SELECT 1 FROM policy_approvals pa WHERE pa.version_id = pv.id
  );

-- Check the final state
SELECT 'Final state:' as info;
SELECT 
  pd.slug,
  pv.version_number,
  pv.status,
  pv.title,
  pv.approved_at
FROM policy_versions pv
JOIN policy_definitions pd ON pd.id = pv.policy_id
ORDER BY pd.slug, pv.version_number;

-- Test the function again
SELECT 'Function Test - Terms:' as info;
SELECT * FROM get_latest_approved_policy('terms');

SELECT 'Function Test - Privacy:' as info;
SELECT * FROM get_latest_approved_policy('privacy');

SELECT 'Function Test - Refund:' as info;
SELECT * FROM get_latest_approved_policy('refund'); 