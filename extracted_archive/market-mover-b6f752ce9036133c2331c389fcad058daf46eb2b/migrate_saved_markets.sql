-- Migration script to update saved_market and market_provider_tags tables
-- for BigQuery provider data integration (dhc as integer)

-- Step 1: Drop existing foreign key constraints
ALTER TABLE public.saved_market 
DROP CONSTRAINT IF EXISTS saved_market_provider_id_fkey;

ALTER TABLE public.market_provider_tags 
DROP CONSTRAINT IF EXISTS market_provider_tags_tagged_provider_id_fkey;

-- Step 2: Update saved_market table
-- Change provider_id to bigint to store BigQuery dhc values as integer
ALTER TABLE public.saved_market 
ALTER COLUMN provider_id TYPE bigint
USING provider_id::bigint;

-- Step 3: Update market_provider_tags table  
-- Change tagged_provider_id to bigint to store BigQuery dhc values as integer
ALTER TABLE public.market_provider_tags 
ALTER COLUMN tagged_provider_id TYPE bigint
USING tagged_provider_id::bigint;

-- Step 4: Add comments to document the new structure
COMMENT ON COLUMN public.saved_market.provider_id IS 'BigQuery dhc value (integer) from market-mover-464517.providers.org_dhc.dhc';
COMMENT ON COLUMN public.market_provider_tags.tagged_provider_id IS 'BigQuery dhc value (integer) from market-mover-464517.providers.org_dhc.dhc';

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_market_provider_id ON public.saved_market(provider_id);
CREATE INDEX IF NOT EXISTS idx_market_provider_tags_tagged_provider_id ON public.market_provider_tags(tagged_provider_id);

-- Step 6: Verify the changes
-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'saved_market' 
AND column_name IN ('provider_id', 'user_id', 'radius_miles', 'name');

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'market_provider_tags' 
AND column_name IN ('market_id', 'tagged_provider_id', 'tag_type');

-- Check indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('saved_market', 'market_provider_tags'); 