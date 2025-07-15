-- Migration script to remove votes column from feature_requests table
-- and ensure proper use of feature_request_votes table

-- 1. Drop the index on votes column
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

-- 4. Create index for better performance on the votes calculation
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_count ON feature_request_votes(feature_request_id);

-- 5. Update RLS policies to remove votes-related policy
DROP POLICY IF EXISTS "update_votes" ON feature_requests;

-- 6. Create new policy for users to update their own requests
CREATE POLICY "update_own_requests" ON feature_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'approved');

-- 7. Ensure feature_request_votes table has proper RLS policies
DROP POLICY IF EXISTS "Users can view their own votes" ON feature_request_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON feature_request_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON feature_request_votes;

CREATE POLICY "Users can view their own votes" ON feature_request_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON feature_request_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON feature_request_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Verify the migration
SELECT 'Migration completed successfully' as status; 