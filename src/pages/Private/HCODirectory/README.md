# HCO Advanced Directory

## Overview
The HCO Advanced Directory is a comprehensive healthcare organization search and exploration tool with advanced filtering, taxonomy viewing, market integration, and detailed profile pages.

## Key Features

### 🔍 Advanced Filtering
- **Geographic Filters**
  - Filter by state(s)
  - Filter by city/cities
  - Filter by saved markets (radius-based)
  
- **Organization Type Filters**
  - Firm types (hospital, SNF, HHA, etc.)
  - Definitive ID filtering
  
- **Taxonomy Filters** (Three Levels)
  - **Classification**: Primary service classification
  - **Consolidated Specialty**: Grouped specialties
  - **Grouping**: High-level taxonomy groupings
  
- **Affiliation Filters**
  - Hospital parent (Yes/No/Any)
  - Physician group parent (Yes/No/Any)
  - Network affiliation (Yes/No/Any)

### 🗺️ Market Integration
- Select from saved markets to filter organizations
- Automatically filters by market radius
- Shows distance from market center for each organization
- Filter options dynamically update based on selected market

### 📊 Fast Performance
- Paginated results (50 per page)
- Server-side filtering for fast queries
- Filter options loaded from BigQuery aggregations
- Efficient database queries with proper indexing

### 📋 Data Grid
- Clean, sortable table view
- Shows key information:
  - Organization name and NPI
  - Firm type
  - Taxonomy classification and specialty
  - Location (city, state, ZIP)
  - Affiliations (badges)
  - Distance (when market selected)
- Quick "View Profile" action button

### 👁️ Profile View
Detailed organization profile page includes:

1. **Provider Perspective Selector** (Header)
   - Toggle between: Billing, Facility, Service Location, Performing
   - Changes which NPI field is used for volume and pathway queries
   - Affects procedures, diagnoses, and pathways data

2. **Basic Information**
   - Organization name and NPI
   - Definitive ID and name
   - Firm type (short and full)

3. **Address & Location**
   - Complete address
   - County
   - Coordinates
   - Interactive map view

4. **Taxonomies**
   - Primary taxonomy code
   - Classification
   - Consolidated specialty
   - Grouping

5. **Affiliations**
   - Hospital parent (ID and name)
   - Physician group parent (ID and name)
   - Network (ID and name)

6. **Procedure Volume (Last 12 Months)**
   - Total procedures (based on selected perspective)
   - Total charges
   - Unique procedures
   - Months with data
   - Top 20 procedures table
   - Uses reference metadata for accurate date range

7. **Diagnosis Volume (Last 12 Months)**
   - Total diagnoses (based on selected perspective)
   - Unique diagnoses
   - Months with data
   - Top 20 diagnoses table
   - Uses reference metadata for accurate date range

8. **Upstream Pathways (Where Patients Came From)**
   - Top 20 referring providers
   - Perspective selector for upstream providers
   - Shows: Provider, Taxonomy, Location, Patient Count, Procedures, Charges
   - 14-day lead time window
   - Based on `pathways_provider_procedure_code` table

9. **Downstream Pathways (Where Patients Went To)**
   - Top 20 receiving providers
   - Perspective selector for downstream providers
   - Shows: Provider, Taxonomy, Location, Patient Count, Procedures, Charges
   - 14-day lead time window
   - Based on `pathways_provider_procedure_code` table

10. **All Database Fields**
    - Expandable section showing all fields from `hco_flat`
    - Useful for data exploration and debugging

### 📤 Export
- Export current page results to CSV
- Includes all visible columns plus taxonomies
- Distance column included when market is selected

## Technical Architecture

### Backend API Routes
**Base URL:** `/api/hco-directory`

1. **POST /search**
   - Main search endpoint
   - Supports pagination, filtering, sorting
   - Returns organizations + pagination metadata
   
2. **POST /filter-options**
   - Get available filter options
   - Dynamically updates based on current filters
   - Supports market-based filtering
   
3. **GET /profile/:npi**
   - Get detailed profile for single organization
   - Includes procedure volume metrics
   - Returns top procedures

### Database Tables
- **Primary:** `aegis_access.hco_flat`
- **Procedure Volume:** `aegis_access.volume_procedure`

### Key Fields Used
```
hco_flat:
  - npi (primary key)
  - healthcare_organization_name, name
  - definitive_id, definitive_name, definitive_firm_type
  - primary_taxonomy_classification
  - primary_taxonomy_consolidated_specialty
  - primary_taxonomy_grouping
  - primary_taxonomy_code
  - primary_address_* (address fields)
  - hospital_parent_id, hospital_parent_name
  - physician_group_parent_id, physician_group_parent_name
  - network_id, network_name
  - npi_deactivation_date (for filtering active only)
```

## Usage

### Navigation
Access via sidebar: **"HCO Advanced Directory"**
- Located next to existing "HCO Directory" link
- Icon: Building2 (lucide-react)

### Search Workflow
1. **Select a market** (optional) - filters to geographic area
2. **Apply filters** - narrow down by type, taxonomy, affiliations
3. **Enter search term** (optional) - search by name or NPI
4. **Click "Search"** - loads paginated results
5. **Navigate pages** - use Previous/Next buttons
6. **View profile** - click "View" button on any organization
7. **Export results** - download CSV of current page

### Filter Tips
- Filters are cumulative (AND logic)
- Filter counts update dynamically
- Clear individual filters or use "Clear All"
- Market filter takes precedence for distance calculations

## Performance Considerations

### Fast by Design
- **Server-side pagination**: Only loads 50 records at a time
- **Indexed queries**: BigQuery efficiently filters millions of records
- **Smart aggregations**: Filter options pre-calculated
- **Caching ready**: Backend supports caching for filter options

### Query Optimization
- Uses parameterized queries for safety
- Parallel query execution where possible
- Distance calculations only when market selected
- Proper WHERE clause ordering for performance

## Future Enhancements
Potential improvements:
- [ ] Save custom filter presets
- [ ] Compare multiple organizations side-by-side
- [ ] Export all results (not just current page)
- [ ] Advanced sorting options (multi-column)
- [ ] Bulk actions (tag multiple organizations)
- [ ] Integration with Network/Provider tagging
- [ ] Chart visualizations on profile pages
- [ ] Procedure code deep-dive from profile

## Related Components
- **HCO Analysis V2**: `/app/investigation/hco` - Market-based HCO statistics
- **HCP Directory**: Similar directory for individual practitioners
- **Markets**: Save markets for use as filters
- **Procedures**: Tag procedures for cross-referencing

## Data Sources
- **Vendor BigQuery**: `aegis_access` dataset
- **Supabase**: User markets table
- **Real-time**: All queries run against live data (no static snapshots)

---

**Built:** October 2025
**Last Updated:** October 2025

