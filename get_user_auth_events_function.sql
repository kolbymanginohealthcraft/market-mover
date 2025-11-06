-- Function to get user authentication events
-- This function queries auth.audit_log_entries and auth.sessions to get comprehensive auth history

CREATE OR REPLACE FUNCTION get_user_auth_events(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  event_timestamp TIMESTAMPTZ,
  event_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get events from audit_log_entries
  -- Supabase audit logs may have different payload structures
  -- Try multiple ways to match the user
  RETURN QUERY
  SELECT 
    ale.id,
    ale.created_at as event_timestamp,
    COALESCE(
      (ale.payload->>'event_type')::TEXT,
      (ale.payload->>'action')::TEXT,
      (ale.payload->>'type')::TEXT,
      'unknown'
    ) as event_type,
    ale.ip_address::TEXT as ip_address,
    NULL::TEXT as user_agent,
    ale.payload::jsonb as details
  FROM auth.audit_log_entries ale
  WHERE (
    ale.payload->>'user_id' = target_user_id::TEXT
    OR ale.payload->>'id' = target_user_id::TEXT
    OR ale.payload->>'actor_id' = target_user_id::TEXT
    OR (ale.payload->>'traits' IS NOT NULL AND ale.payload->'traits'->>'id' = target_user_id::TEXT)
    OR (ale.payload->>'user' IS NOT NULL AND ale.payload->'user'->>'id' = target_user_id::TEXT)
  )
  ORDER BY ale.created_at DESC
  LIMIT 100;

  -- Get identity-related events (sign-ins, email confirmations, etc.)
  RETURN QUERY
  SELECT 
    i.id,
    COALESCE(i.last_sign_in_at, i.created_at) as event_timestamp,
    CASE 
      WHEN i.last_sign_in_at IS NOT NULL THEN 'identity_sign_in'
      WHEN i.created_at = i.updated_at THEN 'identity_created'
      ELSE 'identity_updated'
    END::TEXT as event_type,
    ''::TEXT as ip_address,
    ''::TEXT as user_agent,
    jsonb_build_object(
      'provider', i.provider,
      'provider_id', i.provider_id,
      'created_at', i.created_at,
      'updated_at', i.updated_at,
      'last_sign_in_at', i.last_sign_in_at
    ) as details
  FROM auth.identities i
  WHERE i.user_id = target_user_id
    AND i.last_sign_in_at IS NOT NULL
  ORDER BY i.last_sign_in_at DESC
  LIMIT 20;

  -- Get user metadata changes from auth.users
  -- This captures email changes, password changes, etc.
  RETURN QUERY
  SELECT 
    u.id,
    u.updated_at as event_timestamp,
    CASE
      WHEN u.email_change IS NOT NULL AND u.email_change != '' THEN 'email_changed'
      WHEN u.recovery_sent_at IS NOT NULL THEN 'password_reset_requested'
      WHEN u.email_confirmed_at IS NOT NULL AND u.email_confirmed_at = u.updated_at THEN 'email_confirmed'
      ELSE 'user_updated'
    END::TEXT as event_type,
    ''::TEXT as ip_address,
    ''::TEXT as user_agent,
    jsonb_build_object(
      'email', u.email,
      'email_change', u.email_change,
      'email_confirmed_at', u.email_confirmed_at,
      'recovery_sent_at', u.recovery_sent_at,
      'last_sign_in_at', u.last_sign_in_at,
      'created_at', u.created_at
    ) as details
  FROM auth.users u
  WHERE u.id = target_user_id
    AND u.updated_at IS NOT NULL
  ORDER BY u.updated_at DESC
  LIMIT 10;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_auth_events(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_events(UUID) TO service_role;

