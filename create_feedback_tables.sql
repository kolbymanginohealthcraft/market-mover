-- Create tables for feedback and feature requests

-- 1. Feature requests table
CREATE TABLE IF NOT EXISTS feature_requests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Feature request votes table (to track who voted for what)
CREATE TABLE IF NOT EXISTS feature_request_votes (
  id SERIAL PRIMARY KEY,
  feature_request_id INTEGER REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

-- Enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for feature_requests
CREATE POLICY "Users can view all feature requests" ON feature_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own feature requests" ON feature_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature requests" ON feature_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for feature_request_votes
CREATE POLICY "Users can view their own votes" ON feature_request_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON feature_request_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON feature_request_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_user_id ON feature_request_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_request_id ON feature_request_votes(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_count ON feature_request_votes(feature_request_id);

-- Insert some sample feature requests
INSERT INTO feature_requests (title, description, user_id) VALUES
  ('Dark Mode Support', 'Add a dark theme option for better visibility in low-light environments', auth.uid()),
  ('Export to PDF', 'Allow users to export market reports and data to PDF format', auth.uid()),
  ('Mobile App', 'Create a mobile app for iOS and Android devices', auth.uid()),
  ('Advanced Filtering', 'Add more filtering options for provider searches', auth.uid()),
  ('Data Visualization', 'Add charts and graphs to visualize market data', auth.uid())
ON CONFLICT DO NOTHING;

-- Create a view to calculate vote counts dynamically
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