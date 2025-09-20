-- Remove max_users column from teams table
-- This migration removes the max_users column since we now use license_quantity from subscriptions table

-- First, drop any foreign key constraints or indexes that might reference max_users
-- (There shouldn't be any, but this is a safety check)

-- Drop the column
ALTER TABLE public.teams DROP COLUMN IF EXISTS max_users;

-- Update the schema comment to reflect the change
COMMENT ON TABLE public.teams IS 'Teams table - license limits now managed via subscriptions.license_quantity';
