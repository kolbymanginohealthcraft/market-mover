# Saved Market Migration to BigQuery

## Overview

This migration updates the saved market functionality to work with BigQuery provider data instead of Supabase provider tables. The provider data has been moved from Supabase to BigQuery for performance reasons, requiring updates to the saved market and tagging systems.

## Key Changes

### 1. Database Schema Changes

#### Before Migration:
```sql
-- saved_market table with Supabase foreign key
CREATE TABLE public.saved_market (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  provider_id bigint NULL, -- References Supabase org_dhc.id
  radius_miles integer NOT NULL,
  name text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT saved_market_pkey PRIMARY KEY (id),
  CONSTRAINT saved_market_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES org_dhc (id) ON DELETE CASCADE,
  CONSTRAINT saved_market_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- market_provider_tags table with Supabase foreign key
CREATE TABLE public.market_provider_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  market_id uuid NULL,
  tagged_provider_id bigint NULL, -- References Supabase org_dhc.id
  tag_type text NULL,
  CONSTRAINT market_provider_tags_pkey PRIMARY KEY (id),
  CONSTRAINT market_provider_tags_unique UNIQUE (market_id, tagged_provider_id),
  CONSTRAINT market_provider_tags_market_id_fkey FOREIGN KEY (market_id) REFERENCES saved_market (id) ON DELETE CASCADE,
  CONSTRAINT market_provider_tags_tagged_provider_id_fkey FOREIGN KEY (tagged_provider_id) REFERENCES org_dhc (id),
  CONSTRAINT market_provider_tags_tag_type_check CHECK (
    (tag_type = any (array['competitor'::text, 'partner'::text, 'ally'::text]))
  )
);
```

#### After Migration:
```sql
-- saved_market table with BigQuery dhc values
CREATE TABLE public.saved_market (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  provider_id text NULL, -- Stores BigQuery dhc values
  radius_miles integer NOT NULL,
  name text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT saved_market_pkey PRIMARY KEY (id),
  CONSTRAINT saved_market_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- market_provider_tags table with BigQuery dhc values
CREATE TABLE public.market_provider_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  market_id uuid NULL,
  tagged_provider_id text NULL, -- Stores BigQuery dhc values
  tag_type text NULL,
  CONSTRAINT market_provider_tags_pkey PRIMARY KEY (id),
  CONSTRAINT market_provider_tags_unique UNIQUE (market_id, tagged_provider_id),
  CONSTRAINT market_provider_tags_market_id_fkey FOREIGN KEY (market_id) REFERENCES saved_market (id) ON DELETE CASCADE,
  CONSTRAINT market_provider_tags_tag_type_check CHECK (
    (tag_type = any (array['competitor'::text, 'partner'::text, 'ally'::text]))
  )
);
```

### 2. Frontend Code Changes

#### Updated Files:

1. **`src/hooks/useMarketData.js`**
   - Changed `providerId` parameter to `providerDhc`
   - Updated to store BigQuery dhc values in `provider_id` field
   - Updated navigation to use dhc values

2. **`src/pages/Private/MarketsPage.jsx`**
   - Removed Supabase joins with `provider_dhc` and `org_dhc` tables
   - Added BigQuery API calls to fetch provider details
   - Updated to handle BigQuery dhc values for provider data

3. **`src/pages/Private/ProviderListingTab.jsx`**
   - Updated tagging system to store BigQuery dhc values
   - Modified `handleTag` function to work with dhc values
   - Updated tag retrieval to work with new structure

### 3. Data Flow Changes

#### Before Migration:
```
User saves market → Store Supabase provider ID → Join with org_dhc table
User tags provider → Store Supabase provider ID → Join with org_dhc table
```

#### After Migration:
```
User saves market → Store BigQuery dhc value → Fetch provider details via API
User tags provider → Store BigQuery dhc value → Fetch provider details via API
```

## Migration Steps

### 1. Database Migration

Run the SQL migration script:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f migrate_saved_markets.sql
```

### 2. Frontend Deployment

Deploy the updated frontend code with the changes to:
- `src/hooks/useMarketData.js`
- `src/pages/Private/MarketsPage.jsx`
- `src/pages/Private/ProviderListingTab.jsx`

### 3. Testing

Run the test script to verify the migration:

```bash
node test_saved_market_migration.js
```

## API Integration

The migration relies on the existing BigQuery API endpoints:

- **`/getNpis`** - Fetches provider details by dhc values
- **`/getNearbyProviders`** - Fetches nearby providers for mapping

## Benefits

1. **Performance**: Provider data queries now use BigQuery's optimized storage
2. **Scalability**: BigQuery can handle larger datasets more efficiently
3. **Consistency**: All provider data now comes from a single source
4. **Flexibility**: No longer dependent on Supabase table structure for provider data

## Backward Compatibility

- Existing saved markets will continue to work
- Provider tagging will continue to function
- No data loss during migration
- Existing user workflows remain unchanged

## Monitoring

After migration, monitor:

1. **API Response Times**: Ensure BigQuery API calls are performing well
2. **Error Rates**: Check for any failed provider data fetches
3. **User Experience**: Verify saved markets and tagging work smoothly
4. **Data Consistency**: Ensure provider details are accurate

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. Reverting frontend code changes
2. Restoring original database schema
3. Re-enabling foreign key constraints
4. Restoring Supabase provider tables (if needed)

## Support

For issues related to this migration:

1. Check the test script output for specific errors
2. Verify BigQuery API connectivity
3. Review database migration logs
4. Test with a small subset of data first 