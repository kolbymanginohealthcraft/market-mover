# How to Test the Vendor BigQuery Experiment

## What Was Changed

The search page has been **temporarily switched** to use the vendor BigQuery route instead of your personal BigQuery table.

## How to Test

### 1. Navigate to the Search Page
Go to: **http://localhost:5173/app/search** (or whatever your local URL is)

### 2. Search for Providers
Try searching for:
- "hospital"
- "clinic"
- "skilled nursing"
- Any provider name

### 3. What to Look For

The **vendor route returns BOTH DHC and NPI together**, so you should now see:
- All the same provider info you had before
- **Plus** the NPI field in the results

## Comparing Results

To compare side-by-side:

1. **Current (vendor route)**: Just search normally at `/app/search`
2. **Original (your BigQuery)**: Can test via browser console:
   ```javascript
   fetch('/api/search-providers?search=hospital')
     .then(r => r.json())
     .then(d => console.log('ORIGINAL:', d))
   ```

## Reverting Back

If you want to go back to your original BigQuery table:

**File**: `src/pages/Private/Search/ProviderSearch.jsx`  
**Line**: 326

Change:
```javascript
const response = await fetch(apiUrl(`/api/search-providers-vendor?search=${encodeURIComponent(q)}`));
```

Back to:
```javascript
const response = await fetch(apiUrl(`/api/search-providers?search=${encodeURIComponent(q)}`));
```

## Other Routes

The experimental vendor routes are also available:
- `POST /api/getProvidersByDhcVendor`
- `GET /api/search-providers-vendor` (now active on search page)
- `GET /api/nearby-providers-vendor`

## What Changed

✅ **Now using `atlas_definitive_id` instead of `definitive_id`**  
✅ **Filters**: `atlas_definitive_id IS NOT NULL` AND `atlas_definitive_id_primary_npi = TRUE`  
✅ **Atlas-specific fields**: `atlas_network_name`, `atlas_definitive_firm_type`, etc.  
✅ **Removed CCN filter** - No longer doing expensive CCN lookups from `org_dhc` tables  
✅ **Removed Medicare badge** - No CCN data in vendor BigQuery directories  
✅ **Maximum speed** - Using `primary_npi` flag instead of `ROW_NUMBER()` for deduplication

## Questions to Answer

After testing:
1. **Is it noticeably faster?** (should be - no CCN lookup bottleneck!)
2. Do you get fewer but higher quality results? (should be filtered to Atlas-affiliated only)
3. Do the DHC IDs match your expectations?
4. Do you see NPI values now?
5. Is the data quality better/worse?
6. Any missing providers you expected?
7. Are the firm types and networks correct?

