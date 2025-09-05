-- Remove the tier column from the teams table
-- This script removes the tier column and its associated constraints

-- Drop the check constraint on tier if it exists
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_tier_check;

-- Remove the tier column from the teams table
ALTER TABLE public.teams DROP COLUMN IF EXISTS tier;

-- Add a comment to document the removal
COMMENT ON TABLE public.teams IS 'Teams table - tier column removed as part of legacy subscription system cleanup.';
