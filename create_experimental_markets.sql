-- Create experimental markets table
-- This is a separate table from the existing saved_market table
-- to avoid breaking existing functionality

CREATE TABLE IF NOT EXISTS experimental_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_miles INTEGER NOT NULL CHECK (radius_miles > 0 AND radius_miles <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create experimental market provider tags table
-- This is separate from the existing market_provider_tags table
CREATE TABLE IF NOT EXISTS experimental_market_provider_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID REFERENCES experimental_markets(id) ON DELETE CASCADE,
  tagged_provider_dhc TEXT NOT NULL, -- BigQuery dhc value
  tag_type TEXT NOT NULL CHECK (tag_type IN ('me', 'partner', 'competitor', 'target')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(market_id, tagged_provider_dhc)
);

-- Enable RLS
ALTER TABLE experimental_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE experimental_market_provider_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for experimental_markets
CREATE POLICY "Users can view their own experimental markets" ON experimental_markets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experimental markets" ON experimental_markets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experimental markets" ON experimental_markets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experimental markets" ON experimental_markets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for experimental_market_provider_tags
CREATE POLICY "Users can view tags for their own markets" ON experimental_market_provider_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM experimental_markets 
      WHERE experimental_markets.id = experimental_market_provider_tags.market_id 
      AND experimental_markets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tags for their own markets" ON experimental_market_provider_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM experimental_markets 
      WHERE experimental_markets.id = experimental_market_provider_tags.market_id 
      AND experimental_markets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags for their own markets" ON experimental_market_provider_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM experimental_markets 
      WHERE experimental_markets.id = experimental_market_provider_tags.market_id 
      AND experimental_markets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags for their own markets" ON experimental_market_provider_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM experimental_markets 
      WHERE experimental_markets.id = experimental_market_provider_tags.market_id 
      AND experimental_markets.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experimental_markets_user_id ON experimental_markets(user_id);
CREATE INDEX IF NOT EXISTS idx_experimental_markets_location ON experimental_markets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_experimental_market_provider_tags_market_id ON experimental_market_provider_tags(market_id);
CREATE INDEX IF NOT EXISTS idx_experimental_market_provider_tags_provider_dhc ON experimental_market_provider_tags(tagged_provider_dhc);

-- Add comments for documentation
COMMENT ON TABLE experimental_markets IS 'Experimental markets defined by geographic area rather than specific providers';
COMMENT ON COLUMN experimental_markets.latitude IS 'Latitude of market center (decimal degrees)';
COMMENT ON COLUMN experimental_markets.longitude IS 'Longitude of market center (decimal degrees)';
COMMENT ON COLUMN experimental_markets.radius_miles IS 'Market radius in miles (1-100)';

COMMENT ON TABLE experimental_market_provider_tags IS 'Provider tags for experimental markets';
COMMENT ON COLUMN experimental_market_provider_tags.tagged_provider_dhc IS 'BigQuery dhc value for the tagged provider';
COMMENT ON COLUMN experimental_market_provider_tags.tag_type IS 'Tag type: me, partner, competitor, or target';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_experimental_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_experimental_markets_updated_at
  BEFORE UPDATE ON experimental_markets
  FOR EACH ROW
  EXECUTE FUNCTION update_experimental_markets_updated_at();

-- Verify the tables were created correctly
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('experimental_markets', 'experimental_market_provider_tags')
ORDER BY table_name, ordinal_position;

-- Show the constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('experimental_markets', 'experimental_market_provider_tags')
ORDER BY table_name, constraint_name; 