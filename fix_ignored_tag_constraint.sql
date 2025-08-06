-- Update the experimental_market_provider_tags table to allow 'ignored' tag type
-- Drop the existing constraint
ALTER TABLE experimental_market_provider_tags 
DROP CONSTRAINT IF EXISTS experimental_market_provider_tags_tag_type_check;

-- Add the new constraint that includes 'ignored'
ALTER TABLE experimental_market_provider_tags 
ADD CONSTRAINT experimental_market_provider_tags_tag_type_check 
CHECK (tag_type IN ('me', 'partner', 'competitor', 'target', 'ignored'));

-- Verify the constraint was updated
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'experimental_market_provider_tags_tag_type_check'; 