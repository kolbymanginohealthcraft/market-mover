-- Check policy data state
SELECT 'Policy Definitions:' as info;
SELECT * FROM policy_definitions;

SELECT 'Policy Versions:' as info;
SELECT 
  pv.id,
  pd.slug,
  pv.version_number,
  pv.status,
  pv.title,
  LEFT(pv.content, 100) as content_preview,
  pv.created_at,
  pv.approved_at
FROM policy_versions pv
JOIN policy_definitions pd ON pd.id = pv.policy_id
ORDER BY pd.slug, pv.version_number;

SELECT 'Latest Approved Policies:' as info;
SELECT 
  pd.slug,
  pv.version_number,
  pv.status,
  pv.title
FROM policy_versions pv
JOIN policy_definitions pd ON pd.id = pv.policy_id
WHERE pv.status = 'approved'
ORDER BY pd.slug, pv.version_number DESC;

-- Test the function
SELECT 'Function Test - Terms:' as info;
SELECT * FROM get_latest_approved_policy('terms');

SELECT 'Function Test - Privacy:' as info;
SELECT * FROM get_latest_approved_policy('privacy');

SELECT 'Function Test - Refund:' as info;
SELECT * FROM get_latest_approved_policy('refund'); 