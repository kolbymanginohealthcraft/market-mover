-- Add system_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN DEFAULT false;

-- Add comment to clarify the purpose
COMMENT ON COLUMN profiles.is_system_admin IS 'Grants access to system administration features (separate from user-facing admin role)'; 