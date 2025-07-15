-- Remove votes column from feature_requests table
-- This script removes the votes column since we're using the feature_request_votes table instead

-- 1. Drop the index on votes column
DROP INDEX IF EXISTS idx_feature_requests_votes;

-- 2. Remove votes column from feature_requests table
ALTER TABLE feature_requests DROP COLUMN IF EXISTS votes;

-- 3. Update sample data to remove votes values
-- Note: The votes will now be calculated dynamically from feature_request_votes table
UPDATE feature_requests SET votes = NULL WHERE votes IS NOT NULL;

-- 4. Create a view to calculate vote counts dynamically
CREATE OR REPLACE VIEW feature_requests_with_votes AS
SELECT 
  fr.*,
  COALESCE(vote_counts.vote_count, 0) as votes
FROM feature_requests fr
LEFT JOIN (
  SELECT 
    feature_request_id,
    COUNT(*) as vote_count
  FROM feature_request_votes
  GROUP BY feature_request_id
) vote_counts ON fr.id = vote_counts.feature_request_id;

-- 5. Create index for better performance on the votes calculation
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_count ON feature_request_votes(feature_request_id); 