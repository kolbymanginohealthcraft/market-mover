# Claims Tab Implementation

## Overview

The Claims tab is a new unified interface that replaces the separate Diagnoses, Procedures, and Referrals tabs. It provides a comprehensive view of claims data with flexible filtering options based on claim type and data type.

## Features

### Claim Type Selection
- **Rendered**: Claims belonging to the provider (uses volume tables)
- **Referred**: Claims that took place elsewhere some days before (uses pathways tables)

### Data Type Selection
- **Diagnosis**: Diagnosis-related claims data
- **Procedure**: Procedure-related claims data  
- **Overall**: Overall claims data (only available for referred claims)

### View Options
- **By Month**: Monthly breakdown of claims volume
- **By Provider**: Claims volume by individual providers
- **By Service Line**: Claims volume by service line

## Table Mapping

The system automatically selects the appropriate table based on the user's choices:

| Claim Type | Data Type | Table Name |
|------------|-----------|------------|
| Rendered | Diagnosis | `volume_diagnosis` |
| Rendered | Procedure | `volume_procedure` |
| Referred | Diagnosis | `pathways_provider_diagnosis_code` |
| Referred | Procedure | `pathways_provider_procedure_code` |
| Referred | Overall | `pathways_provider_overall` |

## Field Mapping

### Volume Tables (Rendered Claims)
- `date__month_grain`
- `billing_provider_npi`
- `performing_provider_npi`
- `patient_age_bracket`
- `patient_gender`
- `payor_group`
- `code`
- `count`
- `charge_total`

### Pathways Tables (Referred Claims)
- `date__month_grain`
- `outbound_billing_provider_npi`
- `outbound_performing_provider_npi`
- `inbound_code`
- `inbound_payor_group`
- `patient_gender`
- `patient_age_bracket`
- `inbound_count`
- `charges_total`

## API Endpoints

### `/api/claims-volume`
- **Method**: POST
- **Purpose**: Get monthly claims volume data
- **Parameters**: `npis`, `claimType`, `dataType`

### `/api/claims-by-provider`
- **Method**: POST
- **Purpose**: Get claims data grouped by provider
- **Parameters**: `npis`, `claimType`, `dataType`

### `/api/claims-by-service-line`
- **Method**: POST
- **Purpose**: Get claims data grouped by service line
- **Parameters**: `npis`, `claimType`, `dataType`

## Frontend Components

### Main Component
- `src/pages/Private/ClaimsTab.jsx` - Main claims tab component

### Sub-components
- `src/pages/Private/ClaimsTab/ClaimsByMonth.jsx` - Monthly view
- `src/pages/Private/ClaimsTab/ClaimsByProvider.jsx` - Provider view
- `src/pages/Private/ClaimsTab/ClaimsByServiceLine.jsx` - Service line view

## Backend Implementation

### Route File
- `server/routes/claims.js` - All claims-related API endpoints

### Key Functions
- `getTableName(claimType, dataType)` - Determines which table to query
- `getFieldNames(tableName)` - Returns appropriate field names based on table type

## Navigation Integration

The Claims tab has been integrated into the navigation system:
- Updated `src/components/Navigation/SubNavbar.jsx` to include Claims tab
- Updated `src/pages/Private/ProviderDetail.jsx` to include Claims route
- Updated `server.js` to register the claims routes

## Styling

The Claims tab uses the existing `DiagnosesTab.module.css` styles with additional styles for:
- Claim type selection buttons
- Data type selection buttons
- Responsive design for mobile devices

## Testing

A test file `test_claims_tab.js` has been created to verify the API functionality:
- Tests all three endpoints
- Tests invalid combinations
- Provides detailed logging for debugging

## Usage

1. Navigate to a provider detail page
2. Click on the "Claims" tab in the navigation
3. Select "Rendered" or "Referred" for claim type
4. Select "Diagnosis", "Procedure", or "Overall" (if referred) for data type
5. Choose between "By Month", "By Provider", or "By Service Line" views
6. View the data in tables with summary cards

## Future Enhancements

- Add filtering by date range
- Add export functionality
- Add charts and visualizations
- Add drill-down capabilities
- Add comparison features between rendered and referred claims

## Error Handling

The implementation includes comprehensive error handling:
- Invalid claim type/data type combinations
- Missing or invalid NPIs
- Database connection issues
- Empty result sets

## Performance Considerations

- Caching implemented for API responses
- Efficient SQL queries with proper indexing
- Pagination for large datasets (future enhancement)
- Debounced API calls to prevent excessive requests 