-- Function to restore last_sign_in_at for impersonation
-- This function allows updating auth.users.last_sign_in_at directly
-- which is necessary because impersonation via verifyOtp updates this field,
-- but we want to preserve the original value

CREATE OR REPLACE FUNCTION restore_user_last_sign_in(
  target_user_id UUID,
  original_timestamp TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET last_sign_in_at = original_timestamp
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (service role will have access)
GRANT EXECUTE ON FUNCTION restore_user_last_sign_in(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_user_last_sign_in(UUID, TIMESTAMPTZ) TO service_role;

