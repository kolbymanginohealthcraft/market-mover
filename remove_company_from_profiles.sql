-- Remove company field from profiles table
-- This simplifies the data model by keeping company information only in the teams table

-- Remove the company column from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS company;

-- Add comment to document the change
COMMENT ON TABLE profiles IS 'User profiles - company information now stored in teams table'; 