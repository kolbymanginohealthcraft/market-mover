# CMS Enrollment Experimental Feature

## Overview

This experimental feature provides Medicare enrollment data directly from the Centers for Medicare & Medicaid Services (CMS) data API. It offers detailed demographic breakdowns and enrollment statistics by county.

## Data Source

- **API Endpoint**: https://data.cms.gov/data-api/v1/dataset/d7fabe1e-d19b-4333-9eff-e80e0643f2fd/data
- **Coverage**: All Medicare beneficiaries by county
- **Updates**: Annual data releases
- **Geography**: County-level FIPS codes

## Features

### Enrollment Data
- Total Medicare beneficiaries
- Original Medicare vs Medicare Advantage enrollment
- Aged (65+) vs Disabled beneficiaries
- Dual eligibility status (Medicare + Medicaid)

### Demographic Breakdowns
- Age distribution (65-69, 70-74, 75-79, 80-84, 85-89, 90-94, 95+)
- Race/ethnicity (White, Black, Hispanic, Asian/Pacific Islander, Native American, Other)
- Gender distribution

### Prescription Drug Coverage
- Total beneficiaries with drug coverage
- PDP (Prescription Drug Plan) only
- MAPD (Medicare Advantage with Prescription Drug coverage)

## Implementation

### Backend Components
- `server/routes/cmsEnrollment.js` - API routes for CMS data
- `/api/cms-enrollment` - POST endpoint for enrollment data
- `/api/cms-enrollment-years` - GET endpoint for available years

### Frontend Components
- `src/hooks/useCMSEnrollmentData.js` - Data fetching hook
- `src/components/CMSEnrollmentPanel.jsx` - Data display component
- `src/pages/Private/CMSEnrollmentTab.jsx` - Tab page component

### Integration
- Added to SubNavbar as "CMS Enrollment" tab
- Accessible via `/app/provider/{dhc}/cms-enrollment`
- Uses same provider and radius context as other tabs

## Usage

1. Navigate to a provider detail page
2. Click the "CMS Enrollment" tab in the navigation
3. Select a year from the dropdown (defaults to 2023)
4. View aggregated enrollment data for the market area

## Data Processing

The system:
1. Gets county FIPS codes for the market area using existing census API
2. Fetches CMS enrollment data for those counties
3. Aggregates data across all counties in the market
4. Displays totals and percentages for various demographic categories

## Comparison with Existing Enrollment Tab

| Feature | Existing MA Enrollment | CMS Enrollment |
|---------|----------------------|----------------|
| Data Source | BigQuery (internal) | CMS API (external) |
| Plan Details | Yes (contracts, plans) | No |
| Demographics | Limited | Comprehensive |
| Historical Trends | Yes | No |
| Real-time Updates | No | Annual releases |
| Geographic Coverage | Limited | Nationwide |

## Future Enhancements

- Historical trend analysis
- Comparison with existing MA enrollment data
- Export functionality
- Integration with other demographic data sources
- Real-time data updates when CMS releases new data

## Testing

Run the test script to verify API integration:
```bash
node test_cms_enrollment.js
```

## Notes

- This is an experimental feature and may be refined based on user feedback
- Data is cached for 1 hour to improve performance
- The CMS API has rate limits and may require adjustments for high-volume usage
- Some counties may have suppressed data (marked with "*") for privacy reasons 