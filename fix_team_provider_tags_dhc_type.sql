-- Fix team_provider_tags.provider_dhc column type
-- Change from TEXT to BIGINT to match BigQuery integer type

-- First, let's check the current data to make sure we can convert it
SELECT 
  provider_dhc,
  CASE 
    WHEN provider_dhc ~ '^[0-9]+$' THEN 'Valid integer'
    ELSE 'Invalid - contains non-numeric characters'
  END as validation
FROM team_provider_tags
LIMIT 10;

-- If the validation shows all valid integers, proceed with the conversion
-- Convert the column type from TEXT to BIGINT
ALTER TABLE team_provider_tags 
ALTER COLUMN provider_dhc TYPE BIGINT USING provider_dhc::BIGINT;

-- Verify the change
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_provider_tags' 
AND column_name = 'provider_dhc';

-- Test that the data is still accessible
SELECT 
  provider_dhc,
  tag_type,
  created_at
FROM team_provider_tags 
LIMIT 5; 