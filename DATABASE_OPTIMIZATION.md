# Database Optimization Recommendations

## BigQuery Table Indexing

To improve query performance for the quality measures data, consider the following optimizations:

### 1. Quality Measures Tables

#### `quality.qm_dictionary`
```sql
-- This table is small and frequently accessed, consider clustering by:
-- - active (boolean)
-- - sort_order (integer)
```

#### `quality.qm_provider`
```sql
-- This table is large and frequently queried, optimize with:
-- Clustering by:
--   - publish_date (date)
--   - ccn (string)
--   - code (string)

-- Partitioning by:
--   - publish_date (date) - monthly partitions

-- Example clustering:
CREATE OR REPLACE TABLE `market-mover-464517.quality.qm_provider`
CLUSTER BY publish_date, ccn, code
PARTITION BY DATE_TRUNC(publish_date, MONTH)
AS SELECT * FROM `market-mover-464517.quality.qm_provider`;
```

#### `quality.qm_post`
```sql
-- Optimize with clustering by:
--   - publish_date (date)
--   - code (string)

-- Example clustering:
CREATE OR REPLACE TABLE `market-mover-464517.quality.qm_post`
CLUSTER BY publish_date, code
AS SELECT * FROM `market-mover-464517.quality.qm_post`;
```

### 2. Provider Tables

#### `providers.org_dhc`
```sql
-- Optimize for geographic queries:
-- Clustering by:
--   - state (string)
--   - type (string)

-- Consider adding a geospatial index for location-based queries:
--   - latitude, longitude (for nearby provider searches)
```

### 3. Volume Tables

#### `aegis_access.volume_diagnosis` and `aegis_access.volume_procedure`
```sql
-- Optimize for time-series queries:
-- Clustering by:
--   - date__month_grain (date)
--   - billing_provider_npi (string)
--   - service_line_description (string)

-- Partitioning by:
--   - date__month_grain (date) - monthly partitions
```

## Query Optimization Tips

### 1. Use LIMIT clauses
Always add LIMIT clauses to prevent large result sets:
```sql
SELECT * FROM table WHERE condition LIMIT 10000;
```

### 2. Use UNNEST for array parameters
When querying with multiple values, use UNNEST:
```sql
SELECT * FROM table WHERE ccn IN UNNEST(@ccns);
```

### 3. Avoid SELECT *
Only select the columns you need:
```sql
SELECT ccn, code, score, percentile_column 
FROM table 
WHERE condition;
```

### 4. Use appropriate data types
- Use DATE for date fields
- Use FLOAT64 for decimal numbers
- Use STRING for text fields

## Caching Strategy

### 1. Server-Side Caching
- Cache static data (dictionary, available dates) for 5-10 minutes
- Cache frequently accessed provider data for 2-5 minutes
- Use cache invalidation when data is updated

### 2. Client-Side Caching
- Cache API responses for 5 minutes
- Implement cache warming for frequently accessed data
- Use cache keys based on query parameters

## Monitoring and Performance

### 1. Query Performance Monitoring
Monitor these metrics:
- Query execution time
- Bytes processed
- Slots used
- Cache hit rate

### 2. Cost Optimization
- Use appropriate slot reservations
- Monitor query costs
- Implement query cost limits

### 3. Regular Maintenance
- Update table statistics
- Monitor table growth
- Archive old data partitions

## Implementation Priority

1. **High Priority**: Add clustering to `qm_provider` table
2. **Medium Priority**: Add clustering to `qm_post` table
3. **Low Priority**: Optimize provider and volume tables

## Example Implementation

```sql
-- Example: Optimize qm_provider table
CREATE OR REPLACE TABLE `market-mover-464517.quality.qm_provider_optimized`
CLUSTER BY publish_date, ccn, code
PARTITION BY DATE_TRUNC(publish_date, MONTH)
AS SELECT * FROM `market-mover-464517.quality.qm_provider`;

-- Update the table reference in your queries
-- FROM `market-mover-464517.quality.qm_provider_optimized`
```

## Notes

- These optimizations require BigQuery admin access
- Test optimizations on a copy of the data first
- Monitor performance improvements after implementation
- Consider the cost implications of clustering and partitioning 