# HCP Analysis Test Page

## Overview
The HCP (Healthcare Professionals) Analysis page is a test interface that allows users to analyze healthcare professional/provider data from the vendor BigQuery instance based on their saved market areas.

## Features

### 1. Market Selection
- Dropdown selector showing all user's saved markets
- Each market shows name, city, state, and radius
- Selected market is highlighted

### 2. Statistical Analysis
When a market is selected, the page displays comprehensive statistics:

#### Overall Statistics
- **Total Providers**: Count of all HCPs within the market radius
- **Specialties**: Number of distinct provider specialties
- **Cities**: Number of cities represented
- **States**: Number of states represented
- **Distance Metrics**: Average distance from market center
- **ZIP Codes**: Number of distinct ZIP codes

#### Gender Distribution
- Breakdown of providers by gender
- Percentage of total for each gender

#### Organizational Affiliations
Coverage statistics for:
- Hospital affiliations
- Physician group affiliations
- Network affiliations
- Atlas affiliations (definitive ID)

#### Breakdowns
Detailed breakdowns by:
- **Specialty**: Count and average distance for each specialty type
- **State**: Distribution across states
- **City**: Top 15 cities by provider count

### 3. Sample Data
- Load up to 50 nearest providers
- Table shows:
  - Provider name
  - Specialty
  - Location (city, state)
  - Distance from market center
  - Hospital affiliation (if applicable)

## Data Source

### BigQuery Table
Uses `aegis_access.hcp_flat` from the vendor BigQuery instance.

**Key Fields:**
- `primary_address_lat` / `primary_address_long`: Coordinates for distance calculation (99.86% coverage)
- `npi`: National Provider Identifier
- `name_first`, `name_last`, `name_full_formatted`: Provider names
- `primary_taxonomy_consolidated_specialty`: Provider specialty
- `gender`: Provider gender
- `birth_year`: Year of birth
- `atlas_affiliation_primary_*`: Affiliation relationships
- Location fields: city, state, ZIP code, county

**Table Size:** ~7.2 million healthcare professionals nationwide

## API Endpoints

### GET `/api/hcp-data/stats`
Returns aggregate statistics for providers within a geographic area.

**Query Parameters:**
- `latitude`: Center point latitude
- `longitude`: Center point longitude
- `radius`: Radius in miles

**Response:** JSON with overall stats and breakdowns by specialty, state, city, and gender.

### GET `/api/hcp-data/sample`
Returns sample provider records within a geographic area.

**Query Parameters:**
- `latitude`: Center point latitude
- `longitude`: Center point longitude
- `radius`: Radius in miles
- `limit`: Number of records to return (default: 100)

**Response:** JSON array of provider records sorted by distance.

## Distance Calculation

Uses BigQuery's **ST_DISTANCE** function for geographic calculations:
```sql
ST_DISTANCE(
  ST_GEOGPOINT(centerLng, centerLat),
  ST_GEOGPOINT(primary_address_long, primary_address_lat)
) / 1609.34
```

Result is in miles (meters divided by 1609.34).

## Navigation

Access via:
- Route: `/app/hcp`
- Sidebar link: "HCP Directory" in the sidebar

## Comparison: HCO vs HCP

| Aspect | HCO (Organizations) | HCP (Professionals) |
|--------|---------------------|---------------------|
| **Table** | `hco_flat` | `hcp_flat` |
| **Records** | ~1.9M organizations | ~7.2M providers |
| **Primary Key** | NPI (organization) | NPI (individual) |
| **Main Grouping** | Firm type (Hospital, Clinic, etc.) | Specialty (Cardiology, PT, etc.) |
| **Unique Attributes** | Parent relationships, network affiliations | Gender, birth year, credentials |
| **Coordinate Coverage** | 99.89% | 99.86% |

## Future Enhancements

Potential improvements:
1. **Filtering**: Add filters for specialty, gender, age, etc.
2. **Map Visualization**: Display providers on an interactive map
3. **Export**: Allow exporting results to CSV/Excel
4. **Cross-Reference**: Link providers to their affiliated organizations (HCO data)
5. **Credential Analysis**: Include degrees, certifications, licenses
6. **Claims Integration**: Connect provider data with claims patterns
7. **Referral Networks**: Analyze referral relationships between providers

## Technical Notes

- Uses React hooks for state management
- Styled with CSS Modules (shared with HCO Analysis)
- Responsive design for mobile/tablet/desktop
- Error handling for API failures
- Loading states for async operations
- Follows established codebase patterns
- No layout shift during loading

## Use Cases

1. **Provider Density Analysis**: Understand how many providers of each specialty are in your market
2. **Competitive Intelligence**: See which organizations providers are affiliated with
3. **Network Planning**: Identify gaps in specialty coverage
4. **Geographic Distribution**: Understand where providers are concentrated
5. **Market Entry**: Assess provider saturation before market entry

