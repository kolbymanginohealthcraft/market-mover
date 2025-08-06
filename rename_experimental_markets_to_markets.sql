-- Migration script to rename experimental_markets to markets
-- This removes the "experimental" naming from the database

-- Rename the main table
ALTER TABLE experimental_markets RENAME TO markets;

-- Rename the provider tags table
ALTER TABLE experimental_market_provider_tags RENAME TO market_provider_tags;

-- Update the foreign key reference in market_provider_tags
ALTER TABLE market_provider_tags 
DROP CONSTRAINT IF EXISTS experimental_market_provider_tags_market_id_fkey;

ALTER TABLE market_provider_tags 
ADD CONSTRAINT market_provider_tags_market_id_fkey 
FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_experimental_markets_user_id;
CREATE INDEX idx_markets_user_id ON markets(user_id);

DROP INDEX IF EXISTS idx_experimental_markets_location;
CREATE INDEX idx_markets_location ON markets(latitude, longitude);

-- Update table comments
COMMENT ON TABLE markets IS 'Markets defined by geographic area rather than specific providers';
COMMENT ON COLUMN markets.latitude IS 'Latitude of market center (decimal degrees)';
COMMENT ON COLUMN markets.longitude IS 'Longitude of market center (decimal degrees)';
COMMENT ON COLUMN markets.radius_miles IS 'Market radius in miles (1-100)';

-- Drop the old trigger first
DROP TRIGGER IF EXISTS update_experimental_markets_updated_at ON experimental_markets;

-- Drop the old function
DROP FUNCTION IF EXISTS update_experimental_markets_updated_at();

-- Create the new function
CREATE OR REPLACE FUNCTION update_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER update_markets_updated_at
BEFORE UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION update_markets_updated_at();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own experimental markets" ON markets;
CREATE POLICY "Users can view their own markets" ON markets
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own experimental markets" ON markets;
CREATE POLICY "Users can insert their own markets" ON markets
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own experimental markets" ON markets;
CREATE POLICY "Users can update their own markets" ON markets
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own experimental markets" ON markets;
CREATE POLICY "Users can delete their own markets" ON markets
FOR DELETE USING (user_id = auth.uid());

-- Update market_provider_tags policies
DROP POLICY IF EXISTS "Users can view their own experimental market provider tags" ON market_provider_tags;
CREATE POLICY "Users can view their own market provider tags" ON market_provider_tags
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM markets
    WHERE markets.id = market_provider_tags.market_id
    AND markets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert their own experimental market provider tags" ON market_provider_tags;
CREATE POLICY "Users can insert their own market provider tags" ON market_provider_tags
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM markets
    WHERE markets.id = market_provider_tags.market_id
    AND markets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own experimental market provider tags" ON market_provider_tags;
CREATE POLICY "Users can update their own market provider tags" ON market_provider_tags
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM markets
    WHERE markets.id = market_provider_tags.market_id
    AND markets.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own experimental market provider tags" ON market_provider_tags;
CREATE POLICY "Users can delete their own market provider tags" ON market_provider_tags
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM markets
    WHERE markets.id = market_provider_tags.market_id
    AND markets.user_id = auth.uid()
  )
);

-- Verify the migration
SELECT 
  'Migration completed successfully' as status,
  (SELECT COUNT(*) FROM markets) as markets_count,
  (SELECT COUNT(*) FROM market_provider_tags) as tags_count; 