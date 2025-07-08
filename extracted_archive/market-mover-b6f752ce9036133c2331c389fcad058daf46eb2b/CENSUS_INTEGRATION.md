# Census Data Integration for Market Mover

## Overview

This document outlines the implementation of American Community Survey (ACS) census data integration into the Market Mover platform. The integration provides demographic insights for market analysis using publicly available BigQuery datasets.

## Architecture

### Data Sources
- **Primary**: `bigquery-public-data.census_bureau_acs` - American Community Survey 5-year estimates
- **Geographic**: `bigquery-public-data.geo_census_tracts` - TIGER/Line boundaries
- **Integration**: Uses existing provider FIPS codes and geospatial coordinates

### Geographic Levels
1. **County Level** (Recommended for most use cases)
   - Uses existing provider FIPS codes
   - Faster queries, broader coverage
   - Good for market-level analysis
   - **Coverage**: All 3,221 counties and county-equivalents
   - **Best For**: Rural areas, large market analysis, quick demographic overview

2. **Census Tract Level** (For detailed analysis)
   - Uses spatial joins with TIGER/Line geometry data
   - More granular demographic data
   - Better for precise market boundaries
   - **Coverage**: ~74,000 census tracts across the United States
   - **Best For**: Urban areas, detailed market research, precise demographic analysis
   - **Technical**: Uses `internal_point_lat`/`internal_point_lon` from TIGER/Line data for centroids

## Implementation

### Backend API (`server/routes/censusData.js`)

#### Endpoints

1. **GET `/api/census-data`**
   - Fetches demographic data for a market
   - Parameters: `lat`, `lon`, `radius`, `level`, `year`
   - Returns: Market totals and geographic breakdown

2. **GET `/api/census-data/available-years`**
   - Lists available ACS years
   - Returns: Array of available years

3. **GET `/api/census-data/schema/:year`**
   - Shows available fields for a specific year
   - Useful for exploring available metrics

#### Key Features
- **Caching**: 1-hour cache for census data (infrequent updates)
- **Error Handling**: Graceful fallbacks for missing data
- **Flexible Geography**: Support for county and tract levels
- **Performance**: Optimized queries with spatial indexing

### Frontend Integration

#### React Hook (`src/hooks/useCensusData.js`)
```javascript
const { data, loading, error } = useCensusData(provider, radiusInMiles, 'county', '2021');
```

#### Component (`src/components/CensusDataPanel.jsx`)
- Displays market demographics
- Interactive controls for geographic level and year
- Responsive design with data tables

## Key Metrics Available

### Population Demographics
- **Total Population**: `B01003_001E`
- **65+ Population**: `B01001_020E` through `B01001_049E`
- **Age Distribution**: Various age group breakdowns

### Economic Indicators
- **Median Household Income**: `B19013_001E`
- **Poverty Rate**: Calculated from `B17001_002E`
- **Unemployment Rate**: `B23025_005E`

### Healthcare-Relevant
- **Health Insurance Coverage**: `B27001_001E`
- **Disability Status**: `B18101_001E`
- **Commuting Patterns**: `B08303_001E`

## Usage Examples

### Basic Market Analysis
```javascript
// Fetch county-level demographics for a 25-mile market
const { data } = useCensusData(provider, 25, 'county', '2021');

if (data) {
  console.log('Market Population:', data.market_totals.total_population);
  console.log('65+ Population:', data.market_totals.population_65_plus);
  console.log('Median Income:', data.market_totals.median_income);
}
```

### Detailed Geographic Analysis
```javascript
// Get tract-level data for precise market boundaries
const { data } = useCensusData(provider, 10, 'tract', '2021');

if (data) {
  data.geographic_units.forEach(tract => {
    console.log(`${tract.tract_name}: ${tract.total_pop} people`);
  });
}
```

## Query Optimization

### County-Level Queries
```sql
-- Uses existing provider FIPS codes for efficient joins
WITH market_counties AS (
  SELECT DISTINCT CONCAT(state_fips, county_fips) as county_geo_id
  FROM `market-mover-464517.providers.org_dhc`
  WHERE ST_DISTANCE(ST_GEOGPOINT(longitude, latitude), ST_GEOGPOINT(@lon, @lat)) <= @radiusMeters
)
SELECT c.* FROM `bigquery-public-data.census_bureau_acs.county_2021_5yr` c
INNER JOIN market_counties mc ON c.geo_id = mc.county_geo_id
```

### Tract-Level Queries
```sql
-- Uses spatial joins with tract centroids
SELECT t.*, ST_DISTANCE(ST_GEOGPOINT(t.centroid_lon, t.centroid_lat), ST_GEOGPOINT(@lon, @lat)) as distance
FROM `bigquery-public-data.census_bureau_acs.tract_2021_5yr` t
WHERE ST_DISTANCE(ST_GEOGPOINT(t.centroid_lon, t.centroid_lat), ST_GEOGPOINT(@lon, @lat)) <= @radiusMeters
```

## Data Quality Considerations

### ACS 5-Year Estimates
- **Coverage**: All geographic areas, including small populations
- **Reliability**: More stable than 1-year estimates
- **Timeliness**: 5-year rolling averages (e.g., 2021 = 2017-2021)
- **Margin of Error**: Higher for small areas

### Geographic Accuracy
- **County Level**: Very reliable, uses official FIPS codes
- **Tract Level**: Good accuracy, but depends on centroid calculations
- **Boundary Changes**: Census tracts may change between decennial censuses

## Performance Considerations

### Query Optimization
- **Caching**: 1-hour cache reduces BigQuery costs
- **Spatial Indexing**: Uses BigQuery's geospatial functions efficiently
- **Parameter Binding**: Prevents SQL injection and improves performance

### Cost Management
- **Public Datasets**: No storage costs for census data
- **Query Costs**: Minimal due to efficient spatial queries
- **Caching**: Reduces repeated queries

## Future Enhancements

### Additional Data Sources
1. **Decennial Census**: Population counts every 10 years
2. **Population Estimates**: Annual county-level estimates
3. **Business Patterns**: County Business Patterns data

### Advanced Analytics
1. **Market Comparison**: Compare demographics across markets
2. **Trend Analysis**: Track demographic changes over time
3. **Predictive Modeling**: Use demographics for market forecasting

### Geographic Enhancements
1. **Block Group Level**: Most granular ACS data
2. **Custom Boundaries**: Support for user-defined market areas
3. **Drive-Time Analysis**: Replace radius with drive-time polygons

## Troubleshooting

### Common Issues

1. **No Data Returned**
   - Check if provider has valid lat/lon coordinates
   - Verify radius is reasonable (1-100 miles)
   - Ensure BigQuery public dataset access

2. **Slow Queries**
   - Use county level for faster results
   - Reduce radius size
   - Check BigQuery slot availability

3. **Missing Fields**
   - Verify ACS year availability
   - Check field names in schema endpoint
   - Some fields may not be available for all years

### Error Messages
- **"Access Denied"**: Check BigQuery permissions
- **"Table Not Found"**: Verify ACS year exists
- **"Invalid Coordinates"**: Check lat/lon format and range

## Security and Compliance

### Data Privacy
- **Public Data**: All census data is publicly available
- **No PII**: ACS data contains no personally identifiable information
- **Aggregated**: All data is at geographic aggregate levels

### Usage Guidelines
- **Attribution**: Always cite U.S. Census Bureau as data source
- **Accuracy**: Include margin of error information when available
- **Timeliness**: Note the vintage of ACS estimates used

## Support and Resources

### Documentation
- [BigQuery Public Datasets](https://cloud.google.com/bigquery/public-data)
- [Census Bureau ACS](https://www.census.gov/programs-surveys/acs)
- [TIGER/Line Files](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html)

### Tools
- [BigQuery Console](https://console.cloud.google.com/bigquery)
- [Census Bureau API](https://www.census.gov/data/developers/data-sets.html)
- [ACS Table Shells](https://www.census.gov/programs-surveys/acs/technical-documentation/table-shells.html) 