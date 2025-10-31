# Performance Optimization: Primary NPI Filter

## The Problem

Initially we were using `ROW_NUMBER() OVER (PARTITION BY atlas_definitive_id)` to deduplicate results. This adds computational overhead.

## The Solution

The `atlas_definitive_id_primary_npi` boolean field already marks which NPIs are the "primary" ones for each organization. By filtering to `atlas_definitive_id_primary_npi = TRUE`, we:
- Eliminate duplicate organizations automatically
- Remove the need for `ROW_NUMBER()` window function
- Make queries **significantly faster**

## Before vs After

### Before (with ROW_NUMBER)
```sql
SELECT ... 
FROM (
  SELECT 
    atlas_definitive_id as dhc,
    ...
    ROW_NUMBER() OVER (PARTITION BY atlas_definitive_id) as rn
  FROM `aegis_access.hco_flat`
  WHERE atlas_definitive_id IS NOT NULL
)
WHERE rn = 1
```

### After (with primary_npi flag)
```sql
SELECT 
  atlas_definitive_id as dhc,
  ...
FROM `aegis_access.hco_flat`
WHERE atlas_definitive_id IS NOT NULL
  AND atlas_definitive_id_primary_npi = TRUE
```

**Result**: Simple WHERE clause vs window function = much faster queries!

## Performance Impact

✅ **Search queries**: No ROW_NUMBER() overhead  
✅ **Provider lookup**: Direct WHERE filter  
✅ **Nearby providers**: Filter applied before distance calculation  

All three experimental vendor routes now use this optimization.

