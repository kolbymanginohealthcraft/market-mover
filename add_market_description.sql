-- Add description column to experimental_markets table
ALTER TABLE experimental_markets 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN experimental_markets.description IS 'Optional description/notes for the market'; 