-- Function to get all approved policies with their nicknames (latest version only)
CREATE OR REPLACE FUNCTION get_all_approved_policies()
RETURNS TABLE (
  slug VARCHAR(50),
  nickname VARCHAR(100),
  full_name VARCHAR(200),
  content TEXT,
  version_number INTEGER,
  effective_date DATE,
  title VARCHAR(200)
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    pd.slug,
    pd.nickname,
    pd.full_name,
    pv.content,
    pv.version_number,
    pv.effective_date,
    pv.title
  FROM policy_definitions pd
  JOIN policy_versions pv ON pd.id = pv.policy_id
  WHERE pv.status = 'approved'
    AND pd.is_active = true
    AND pv.version_number = (
      SELECT MAX(pv2.version_number)
      FROM policy_versions pv2
      WHERE pv2.policy_id = pd.id
        AND pv2.status = 'approved'
    )
  ORDER BY pd.slug;
END;
$$ LANGUAGE plpgsql; 