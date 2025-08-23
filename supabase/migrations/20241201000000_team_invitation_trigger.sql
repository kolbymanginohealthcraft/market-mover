-- Create a function to handle team assignment when users accept invitations
CREATE OR REPLACE FUNCTION handle_team_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a new user who accepted an invitation
  IF NEW.raw_user_meta_data IS NOT NULL 
     AND NEW.raw_user_meta_data->>'team_id' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'team_name' IS NOT NULL THEN
    
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

-- Create trigger to run when users are created (after invitation acceptance)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_team_invitation();

-- Also create a trigger for when user metadata is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_team_invitation();
