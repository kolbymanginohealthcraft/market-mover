# HCO Analysis Test Page

## Overview
The HCO (Healthcare Organizations) Analysis page is a test interface that allows users to analyze healthcare organization data from the vendor BigQuery instance based on their saved market areas.

## Features

### 1. Market Selection
- Displays all user's saved markets in a grid layout
- Each market card shows:
  - Market name
  - City and state
  - Radius in miles
- Click any market to analyze HCO data within that geographic area

### 2. Statistical Analysis
When a market is selected, the page displays comprehensive statistics:

#### Overall Statistics
- **Total Organizations**: Count of all HCOs within the market radius
- **Firm Types**: Number of distinct organization types
- **Cities**: Number of cities represented
- **States**: Number of states represented
- **Distance Metrics**: Average, minimum, and maximum distances from market center
- **ZIP Codes**: Number of distinct ZIP codes

#### Organizational Relationships
Coverage statistics for:
- Hospital parent relationships
- Physician group parent relationships
- Network affiliations
- Definitive ID assignments

#### Breakdowns
Detailed breakdowns by:
- **Organization Type**: Count and average distance for each firm type (hospitals, physician groups, etc.)
- **State**: Distribution across states
- **City**: Top 15 cities by organization count

### 3. Sample Data
- Load up to 50 nearest organizations
- Table shows:
  - Organization name
  - Firm type
  - Location (city, state)
  - Distance from market center
  - Parent hospital (if applicable)
  - Network affiliation (if applicable)

## Data Source

### BigQuery Table
Uses `aegis_access.hco_flat` from the vendor BigQuery instance.

**Key Fields:**
- `primary_address_lat` / `primary_address_long`: Coordinates for distance calculation (99.89% coverage)
- `npi`: National Provider Identifier
- `definitive_firm_type`: Organization type classification
- `hospital_parent_id` / `physician_group_parent_id`: Relationship identifiers
- Location fields: city, state, ZIP code, county

**Table Size:** ~1.9 million healthcare organizations nationwide

## API Endpoints

### GET `/api/hco-data/stats`
Returns aggregate statistics for organizations within a geographic area.

**Query Parameters:**
- `latitude`: Center point latitude
- `longitude`: Center point longitude
- `radius`: Radius in miles

**Response:** JSON with overall stats and breakdowns by firm type, state, and city.

### GET `/api/hco-data/sample`
Returns sample organization records within a geographic area.

**Query Parameters:**
- `latitude`: Center point latitude
- `longitude`: Center point longitude
- `radius`: Radius in miles
- `limit`: Number of records to return (default: 100)

**Response:** JSON array of organization records sorted by distance.

## Distance Calculation

Uses the **Haversine formula** to compute distances:
```sql
(3959 * acos(
  cos(radians(centerLat)) * 
  cos(radians(primary_address_lat)) * 
  cos(radians(primary_address_long) - radians(centerLng)) + 
  sin(radians(centerLat)) * 
  sin(radians(primary_address_lat))
))
```

Result is in miles.

## Navigation

Access via:
- Route: `/app/investigation/hco`
- Sidebar link: "HCO Analysis (Test)" under the Claims Data Explorer

## Future Enhancements

Potential improvements:
1. **Filtering**: Add filters for organization type, state, etc.
2. **Map Visualization**: Display organizations on an interactive map
3. **Export**: Allow exporting results to CSV/Excel
4. **Comparison**: Compare multiple markets side-by-side
5. **Time Series**: Track changes in organization counts over time
6. **Integration**: Link HCO data with claims data for deeper analysis

## Technical Notes

- Uses React hooks for state management
- Styled with CSS Modules
- Responsive design for mobile/tablet/desktop
- Error handling for API failures
- Loading states for async operations
- Follows existing codebase patterns and styling conventions

