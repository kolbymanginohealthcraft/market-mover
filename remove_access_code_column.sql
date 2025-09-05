-- Remove access_code column from teams table
-- This column was used by the legacy join_team_by_code function which is no longer used

-- First, drop the unique constraint on access_code
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_access_code_key;

-- Then drop the column
ALTER TABLE public.teams DROP COLUMN IF EXISTS access_code;

-- Optional: Add a comment to document the change
COMMENT ON TABLE public.teams IS 'Teams table - access_code column removed as legacy join_team_by_code functionality is no longer used';
