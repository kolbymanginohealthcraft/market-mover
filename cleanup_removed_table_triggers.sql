-- Clean up triggers that reference removed tables

-- Drop triggers that reference user_progress table
DROP TRIGGER IF EXISTS trigger_update_tool_progress ON user_activities;
DROP TRIGGER IF EXISTS trigger_update_market_progress ON user_activities;

-- Drop the functions that are no longer needed
DROP FUNCTION IF EXISTS update_tool_progress();
DROP FUNCTION IF EXISTS update_market_progress();

-- Keep only the login streak trigger and function
-- (These should already exist from database_triggers.sql) 