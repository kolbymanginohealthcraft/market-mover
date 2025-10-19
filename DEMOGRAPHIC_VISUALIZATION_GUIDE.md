# Demographic Visualization Guide

## Overview

The Geography Analysis page now includes a powerful demographic choropleth mapping system that visualizes census data across your markets. This allows you to color-code census tracts by various demographic metrics like median income, age distribution, poverty rates, and more.

## Features Implemented

### 1. Backend API Endpoint

**Endpoint:** `/api/market-geography/demographics-map`

**Query Parameters:**
- `latitude` (required): Market center latitude
- `longitude` (required): Market center longitude
- `radius` (required): Market radius in miles
- `metric` (optional): Demographic metric to visualize (default: `median_income`)
- `year` (optional): ACS year (default: `2023`)

**What it does:**
1. Queries BigQuery for census tract geometries within the market radius
2. Fetches demographic data from the Census Bureau ACS API
3. Joins the geography with demographics by tract ID
4. Calculates quantile breaks for color-coding
5. Returns GeoJSON with enriched demographic properties

**Response includes:**
- Census tract polygons/points with demographic data
- Statistics (min, max, median, mean, quantile breaks)
- Metadata about the query

### 2. Available Demographic Metrics

The system supports 10 key demographic metrics grouped by category:

**Economic:**
- Median Household Income
- Per Capita Income
- Poverty Rate

**Age:**
- % Population 65+

**Population:**
- Total Population

**Housing:**
- Median Home Value
- Median Gross Rent

**Health:**
- Uninsured Rate
- Disability Rate

**Education:**
- Bachelor's Degree or Higher Rate

### 3. Color Schemes

Each metric uses a carefully selected ColorBrewer palette for accessibility:

- **Income metrics**: Red sequential (light to dark)
- **Home values**: Blue sequential
- **Rent**: Green sequential
- **Age 65+**: Orange sequential
- **Poverty/Uninsured**: Green/Red sequential
- **Disability**: Teal sequential
- **Education**: Purple sequential

All use 6-color quantile classification with a gray color for "no data" tracts.

### 4. User Interface

**Navigation:**
1. Go to Geography Analysis page
2. Select a saved market from the dropdown
3. Click the **"Demographics"** button (with Activity icon)
4. Select a demographic metric from the dropdown

**Interactive Features:**
- **Click** census tracts to see detailed popup with:
  - Metric value (formatted)
  - Census tract ID
  - Total population
- **Hover** over tracts for pointer cursor
- **Legend** displays:
  - Color scale with value ranges
  - Median and mean statistics
  - No data indicator

**View Modes:**
- Census Tracts (boundaries only)
- ZIP Codes (boundaries only)
- Counties (boundaries only)
- **Demographics** (census tracts with color-coded data)

## How the System Works

### Data Flow

```
1. User selects market + metric
   ↓
2. GeographyAnalysis page passes props to GeographyMap
   ↓
3. GeographyMap fetches from /api/market-geography/demographics-map
   ↓
4. Backend queries BigQuery for tract geometries
   ↓
5. Backend queries Census API for demographic data
   ↓
6. Backend joins data and calculates statistics
   ↓
7. Frontend receives GeoJSON with enriched properties
   ↓
8. MapLibre renders choropleth with data-driven styling
   ↓
9. Legend component displays color scale and stats
```

### Technical Implementation

**Backend (server/routes/marketGeography.js):**
- Uses `vendorBigQuery` to query census tract geometries
- Uses `node-fetch` to query Census Bureau ACS API
- Batches county queries (3 at a time) to respect rate limits
- Calculates quantile breaks for 6-color classification
- Joins geometry with demographics by state-county-tract

**Frontend Components:**

1. **GeographyAnalysis.jsx**
   - Manages state for demographics mode, selected metric
   - Provides metric selector dropdown
   - Receives demographic stats from map component
   - Displays legend

2. **GeographyMap.jsx**
   - Detects demographics mode vs regular boundaries mode
   - Fetches appropriate endpoint
   - Builds MapLibre color expressions using quantile breaks
   - Renders choropleth or regular boundaries
   - Creates rich popups with demographic data

3. **DemographicLegend.jsx**
   - Displays color scale with value ranges
   - Shows median and mean statistics
   - Compact and full versions available

4. **demographicColors.js**
   - Defines color schemes for each metric
   - Provides formatting functions (currency, percent, number)
   - Maps values to colors using quantile breaks
   - Provides metric labels and descriptions

### Performance Optimizations

1. **Caching**: Ready for implementation (commented in code)
2. **Geometry Simplification**: ST_SIMPLIFY with 50m tolerance
3. **Batch Processing**: Counties processed 3 at a time
4. **Spatial Indexes**: Uses ST_INTERSECTS which leverages spatial indexes
5. **Single Query**: Combines geometry and demographics in one request

## Usage Examples

### Example 1: View Median Income Distribution

1. Select your market (e.g., "Nashville Metro")
2. Click "Demographics" button
3. Metric dropdown automatically shows "Median Income"
4. View color-coded map with legend
5. Click tracts to see specific income values

### Example 2: Analyze Senior Population

1. Select market
2. Click "Demographics"
3. Change metric to "% Population 65+"
4. Orange gradient shows concentration of seniors
5. Legend shows percentage ranges

### Example 3: Identify Low-Income Areas

1. Select market
2. Click "Demographics"
3. Select "Poverty Rate"
4. Green gradient shows poverty concentration
5. Compare to national/state/county averages (data included in response)

## Data Sources

### BigQuery Public Data
- **Dataset**: `bigquery-public-data.geo_census_tracts.us_census_tracts_national`
- **Contains**: Census tract boundaries (polygons)
- **Update Frequency**: Annual

### Census Bureau ACS API
- **Endpoint**: `https://api.census.gov/data/{year}/acs/acs5`
- **Variables**: 20+ demographic variables from multiple tables
- **Update Frequency**: Annual (5-year estimates)
- **Current Year**: 2023

## Future Enhancement Opportunities

1. **Add More Metrics:**
   - Race/ethnicity breakdown
   - Household size
   - Language spoken at home
   - Commute times
   - Industry employment

2. **Comparison Features:**
   - Compare two metrics side-by-side
   - Show change over time (multi-year)
   - Overlay provider locations

3. **Export Capabilities:**
   - Download demographic data as CSV
   - Export maps as images
   - Generate demographic reports

4. **Advanced Filtering:**
   - Filter tracts by metric threshold
   - Highlight top/bottom percentiles
   - Custom color schemes

5. **Performance:**
   - Add server-side caching
   - Prefetch common metrics
   - Progressive loading for large markets

## Technical Notes

### Census Tract Geometry
- Some tracts render as **points** (internal centroid) when polygon parsing fails
- Most tracts render as **polygons** for true choropleth visualization
- Fallback ensures all tracts are visible even if geometry is incomplete

### Color Interpolation
- Uses MapLibre's `interpolate` expression for smooth color transitions
- Quantile breaks ensure even distribution across color classes
- Each break represents approximately 20% of tracts

### API Rate Limits
- Census API has rate limits (recommended 3 requests/second)
- Backend batches county queries with 100ms delays
- Consider adding caching for production use

### Browser Compatibility
- Requires modern browser with ES6+ support
- MapLibre GL JS requires WebGL support
- Tested on Chrome, Firefox, Safari, Edge

## Troubleshooting

**Issue: Map shows no data**
- Check browser console for API errors
- Verify market has valid lat/lon coordinates
- Ensure Census API is accessible

**Issue: Colors look wrong**
- Check metric selection matches expectation
- Verify quantile breaks in legend
- Some tracts may have null/missing data (shown in gray)

**Issue: Slow loading**
- Large markets with many tracts take longer
- Census API queries are sequential by design
- Consider reducing market radius for faster results

**Issue: Popup shows "No data"**
- Tract may not have data for selected metric
- Check ACS year availability
- Some metrics have null values in sparse areas

## Code Files Modified/Created

### Created:
- `server/routes/marketGeography.js` - Added `/demographics-map` endpoint
- `src/utils/demographicColors.js` - Color schemes and formatting utilities
- `src/components/UI/DemographicLegend.jsx` - Legend component
- `src/components/UI/DemographicLegend.module.css` - Legend styles
- `DEMOGRAPHIC_VISUALIZATION_GUIDE.md` - This guide

### Modified:
- `src/pages/Private/GeographyAnalysis/GeographyAnalysis.jsx` - Added demographics mode
- `src/pages/Private/GeographyAnalysis/GeographyAnalysis.module.css` - Added new styles
- `src/pages/Private/GeographyAnalysis/GeographyMap.jsx` - Added choropleth support

## Summary

This implementation provides a powerful, efficient, and user-friendly way to visualize demographic data across your markets. It combines the best of Google BigQuery's spatial capabilities with the Census Bureau's comprehensive demographic data, all rendered in beautiful, interactive choropleth maps.

The system is designed to be extensible, performant, and follows best practices for data visualization and web mapping.

