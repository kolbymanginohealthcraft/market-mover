-- Security improvements for existing functions

-- Update the team invitation function to be more secure
CREATE OR REPLACE FUNCTION handle_team_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if user metadata contains team information
  IF NEW.raw_user_meta_data IS NOT NULL 
     AND NEW.raw_user_meta_data->>'team_id' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'team_name' IS NOT NULL THEN
    
    -- Validate team_id is a valid UUID
    IF NOT (NEW.raw_user_meta_data->>'team_id')::uuid IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid team_id format';
    END IF;
    
    -- Check if team exists
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = (NEW.raw_user_meta_data->>'team_id')::uuid) THEN
      RAISE EXCEPTION 'Team does not exist';
    END IF;
    
    -- Insert or update the user's profile with team information
    INSERT INTO profiles (id, team_id, role, access_type, updated_at, email)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'team_id')::uuid,
      COALESCE(NEW.raw_user_meta_data->>'role', 'Team Member'),
      'join',
      NOW(),
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      team_id = EXCLUDED.team_id,
      role = EXCLUDED.role,
      access_type = EXCLUDED.access_type,
      updated_at = EXCLUDED.updated_at,
      email = EXCLUDED.email;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate user permissions
CREATE OR REPLACE FUNCTION auth.validate_user_permission(
  required_role TEXT DEFAULT NULL,
  required_team_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get current user's profile
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if user exists
  IF user_profile IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role requirement
  IF required_role IS NOT NULL THEN
    IF user_profile.role != required_role THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check team requirement
  IF required_team_id IS NOT NULL THEN
    IF user_profile.team_id != required_team_id THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log security events
CREATE OR REPLACE FUNCTION auth.log_security_event(
  event_type TEXT,
  event_details JSONB DEFAULT NULL,
  target_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_activities (
    user_id,
    activity_type,
    target_id,
    target_name,
    metadata
  ) VALUES (
    COALESCE(target_user_id, auth.uid()),
    'security_event',
    event_type,
    event_type,
    COALESCE(event_details, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can access team data
CREATE OR REPLACE FUNCTION auth.can_access_team(team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      team_id = auth.can_access_team.team_id
      OR role IN ('Platform Admin', 'Platform Support')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to sanitize user input
CREATE OR REPLACE FUNCTION auth.sanitize_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potential SQL injection patterns
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '--.*$', '', 'g'), -- Remove SQL comments
      ';.*$', '', 'g'), -- Remove multiple statements
    'union.*select', '', 'gi'); -- Remove UNION SELECT attacks
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate email format
CREATE OR REPLACE FUNCTION auth.validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check password strength
CREATE OR REPLACE FUNCTION auth.check_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Password must be at least 8 characters with mix of upper, lower, numbers, and special chars
  RETURN length(password) >= 8 
    AND password ~ '[A-Z]' 
    AND password ~ '[a-z]' 
    AND password ~ '[0-9]' 
    AND password ~ '[^A-Za-z0-9]';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's effective permissions
CREATE OR REPLACE FUNCTION auth.get_user_permissions()
RETURNS JSONB AS $$
DECLARE
  user_profile RECORD;
  permissions JSONB;
BEGIN
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF user_profile IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  permissions := jsonb_build_object(
    'user_id', user_profile.id,
    'team_id', user_profile.team_id,
    'role', user_profile.role,
    'is_platform_admin', user_profile.role IN ('Platform Admin', 'Platform Support'),
    'is_team_admin', user_profile.role IN ('Team Admin', 'Platform Admin', 'Platform Support'),
    'can_manage_team', user_profile.role IN ('Team Admin', 'Platform Admin', 'Platform Support'),
    'can_view_all_data', user_profile.role IN ('Platform Admin', 'Platform Support')
  );
  
  RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better security policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_markets_user_id ON public.markets(user_id);
CREATE INDEX IF NOT EXISTS idx_team_provider_tags_team_id ON public.team_provider_tags(team_id);
CREATE INDEX IF NOT EXISTS idx_team_custom_colors_team_id ON public.team_custom_colors(team_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_testimonials_user_id ON public.user_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON public.feature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_user_id ON public.feature_request_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_permissions_user_id ON public.policy_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_team_id ON public.subscriptions(team_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_license_add_ons_subscription_id ON public.license_add_ons(subscription_id);

-- Create a view for security monitoring
CREATE OR REPLACE VIEW security_events AS
SELECT 
  ua.id,
  ua.user_id,
  p.email,
  p.role,
  p.team_id,
  t.name as team_name,
  ua.activity_type,
  ua.target_id,
  ua.target_name,
  ua.metadata,
  ua.created_at
FROM public.user_activities ua
LEFT JOIN public.profiles p ON ua.user_id = p.id
LEFT JOIN public.teams t ON p.team_id = t.id
WHERE ua.activity_type IN ('security_event', 'login', 'failed_login')
ORDER BY ua.created_at DESC;

-- Grant appropriate permissions to the security view
GRANT SELECT ON security_events TO authenticated;

-- Create a function to clean up old security events
CREATE OR REPLACE FUNCTION auth.cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_activities 
  WHERE activity_type = 'security_event' 
  AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up old security events (runs monthly)
SELECT cron.schedule(
  'cleanup-security-events',
  '0 2 1 * *', -- First day of each month at 2 AM
  'SELECT auth.cleanup_old_security_events();'
);
