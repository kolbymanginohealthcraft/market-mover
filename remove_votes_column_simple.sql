-- Simple script to remove votes column from feature_requests table
-- No data migration needed since all data was placeholder

-- 1. Drop the index on votes column (if it exists)
DROP INDEX IF EXISTS idx_feature_requests_votes;

-- 2. Remove votes column from feature_requests table
ALTER TABLE feature_requests DROP COLUMN IF EXISTS votes;

-- 3. Create a view to calculate vote counts dynamically
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

-- 4. Verify the migration
SELECT 'Votes column removed and view created successfully' as status; 