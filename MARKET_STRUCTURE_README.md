# Market-Based Structure

This document describes the new market-based structure that mirrors the existing provider-based structure, allowing users to access the same subtabs (overview, provider listing, provider density, etc.) from a market perspective.

## URL Structure

### Provider URLs (Existing)
- `app/provider/:dhc/overview`
- `app/provider/:dhc/provider-listing`
- `app/provider/:dhc/provider-density`
- `app/provider/:dhc/population`
- `app/provider/:dhc/claims`
- `app/provider/:dhc/cms-enrollment`
- `app/provider/:dhc/storyteller`

### Market URLs (New)
- `app/market/:marketId/overview`
- `app/market/:marketId/provider-listing`
- `app/market/:marketId/provider-density`
- `app/market/:marketId/population`
- `app/market/:marketId/claims`
- `app/market/:marketId/cms-enrollment`
- `app/market/:marketId/storyteller`

## Components

### MarketDetail.jsx
- **Location**: `src/pages/Private/Results/MarketDetail.jsx`
- **Purpose**: Main component that handles market-based navigation and renders the appropriate subtab components
- **Features**:
  - Fetches market data from Supabase
  - Creates a mock provider object for the market center point
  - Handles loading and error states
  - Routes to MarketOverview for the overview tab and other subtab components for remaining tabs

### Navigation Updates

#### SubNavigation.jsx
- Added market page detection and navigation
- Provides the same subtab navigation as provider pages
- Handles active tab highlighting for market routes

#### Sidebar.jsx
- Added "Market Analysis" section when on market pages
- Shows the same navigation links as provider analysis
- Excludes market creation pages from market analysis section

#### App.jsx
- Updated routing to use `MarketDetail` component for market routes
- Changed from `market/:marketId/overview` to `market/:marketId/*` to support all subtabs

## Data Flow

### Unified Market Analysis Hook (`useMarketAnalysis`)

Both provider and market analysis now use the same unified data source that provides:

1. **Providers**: Nearby providers within the radius
2. **CCNs**: Related CCNs for all providers in the area
3. **NPIs**: Related NPIs for all providers in the area
4. **Census Data**: Demographic and geographic data for the market area
5. **Counties**: County information within the radius
6. **Census Tracts**: Tract information within the radius

### Context-Specific Behavior

- **Provider Context**: Uses provider's location as center point, filters out the main provider from nearby results
- **Market Context**: Uses market's location as center point, includes all providers in the area

### Default Radius

- **Provider Analysis**: Default 10-mile radius (configurable via URL parameter)
- **Market Analysis**: Uses market's stored radius (configurable via market settings)

## Subtabs Available

All the same subtabs available for providers are now available for markets:

- **Overview**: Market overview using the existing MarketOverview component (provider management, tagging, etc.)
- **Provider Listing**: List of providers within the market radius
- **Provider Density**: Map view of provider density in the market area
- **Population**: Census and demographic data for the market area
- **Claims**: Claims analysis for the market area
- **CMS Enrollment**: Medicare enrollment data for the market area
- **Storyteller**: Advanced analytics and reporting for the market

## Benefits

1. **Consistent Experience**: Users get the same analysis capabilities whether starting from a provider or a market
2. **Arbitrary Center Points**: Users can analyze any geographic area without needing a specific provider
3. **Reusable Components**: All existing subtab components are reused, ensuring consistency
4. **Same Data Sources**: Uses the same APIs and data sources as provider analysis

## Usage

Users can now:
1. Navigate to any market from the Markets list
2. Access all the same analysis tabs they would have for a provider
3. Get market-level insights based on the market's center point and radius
4. Use the same filtering and analysis tools as provider pages

## Technical Notes

- **Unified Data Source**: Both provider and market analysis use `useMarketAnalysis` hook
- **Efficient Data Fetching**: All data sources (providers, CCNs, NPIs, census) are fetched in parallel
- **Context-Aware**: Hook automatically handles provider vs market context differences
- **Consistent Props**: All subtab components receive the same data structure regardless of context
- **Error Handling**: Comprehensive error states for each data source
- **Loading States**: Granular loading states for better UX
- **Helper Functions**: Built-in utilities for common data transformations
