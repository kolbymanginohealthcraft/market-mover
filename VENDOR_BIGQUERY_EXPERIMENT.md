# Vendor BigQuery Provider Source Experiment

## Overview

This document describes the experimental implementation of using **vendor BigQuery's `hco_flat` table** as an alternative provider source instead of your personal BigQuery `org_dhc` table.

## Key Differences

### Current System (My BigQuery)
- **Table**: `market-mover-464517.providers.org_dhc`
- **Primary Key**: `dhc` (integer)
- **Fields**: Basic provider info (name, location, network, type, etc.)
- **Requires**: Multiple joins to get NPIs (`org_dhc_npi`, `org_npi`)

### Experimental System (Vendor BigQuery)
- **Table**: `populi-clients.aegis_access.hco_flat`
- **Primary Key**: `atlas_definitive_id` (mapped to DHC)
- **Fields**: Comprehensive provider info including **both DHC and NPI in the same row**
- **Filters**: 
  - `atlas_definitive_id IS NOT NULL` (Atlas-affiliated organizations only)
  - `atlas_definitive_id_primary_npi = TRUE` (primary NPIs only - no duplicates!)
- **Benefits**: 
  - No joins needed - DHC and NPI values together
  - Richer data (firm types, affiliations, taxonomy details)
  - More up-to-date vendor data
  - Filters out noise - only Atlas-affiliated organizations
  - **Super fast** - `atlas_definitive_id_primary_npi` filter eliminates need for ROW_NUMBER()

## Field Mapping

| My BigQuery (org_dhc) | Vendor BigQuery (hco_flat) |
|----------------------|---------------------------|
| `dhc` | `atlas_definitive_id` |
| `name` | `atlas_definitive_name` |
| `street` | `primary_address_line_1` |
| `city` | `primary_address_city` |
| `state` | `primary_address_state_or_province` |
| `zip` | `primary_address_zip5` |
| `network` | `atlas_network_name` |
| `type` | `atlas_definitive_firm_type` |
| `latitude` | `primary_address_lat` |
| `longitude` | `primary_address_long` |
| *(missing)* | `npi` |
| *(missing)* | `atlas_hospital_parent_id` |
| *(missing)* | `atlas_physician_group_parent_id` |

## Experimental Routes

All new routes are accessible with the `-vendor` suffix:

### 1. Get Providers by DHC
**Endpoint**: `POST /api/getProvidersByDhcVendor`
```javascript
// Request
{
  "dhc_ids": [12345, 67890]
}

// Response
{
  "success": true,
  "providers": [
    {
      "dhc": 12345,
      "npi": "1234567890",  // Now included!
      "name": "Provider Name",
      "street": "123 Main St",
      "city": "City",
      "state": "CA",
      "zip": "12345",
      "network": "Network Name",
      "type": "HOSPITAL",
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  ]
}
```

### 2. Search Providers
**Endpoint**: `GET /api/search-providers-vendor`
```
?search=hospital OR ?dhc=12345 OR (no params for all)
```

### 3. Nearby Providers
**Endpoint**: `GET /api/nearby-providers-vendor`
```
?lat=37.7749&lon=-122.4194&radius=10
```

## Advantages of Vendor Approach

1. **Single Query**: NPI and DHC together - no joins needed
2. **Richer Data**: Includes affiliations, parent organizations, taxonomy details
3. **Better Coverage**: More comprehensive provider directory
4. **Simplified Code**: No need for separate NPI lookup queries
5. **Fresh Data**: Vendor BigQuery updated regularly

## Testing the Experiment

### Test Provider by DHC
```bash
curl -X POST http://localhost:5000/api/getProvidersByDhcVendor \
  -H "Content-Type: application/json" \
  -d '{"dhc_ids": [12345]}'
```

### Test Search
```bash
curl "http://localhost:5000/api/search-providers-vendor?search=hospital"
```

### Test Nearby
```bash
curl "http://localhost:5000/api/nearby-providers-vendor?lat=37.7749&lon=-122.4194&radius=10"
```

## Migration Considerations

### Pros
- ✅ Richer data source
- ✅ DHC + NPI in same table
- ✅ Better coverage
- ✅ More fields available

### Cons
- ⚠️ Different field names need mapping
- ⚠️ Need to verify `definitive_id` = `dhc` mapping is 1:1
- ⚠️ Vendor BigQuery project access required
- ⚠️ May have different deactivation logic

### Next Steps
1. **Verify Mapping**: Confirm that `definitive_id` from vendor matches your `dhc` values
2. **Data Validation**: Compare counts and key providers between both sources
3. **Performance Testing**: Check query speed differences
4. **Update Client Code**: If migrating, update all frontend calls to use new routes
5. **Update Other Routes**: Apply vendor approach to `getCcns` and `getNpis` if successful

## Files Created

- `server/routes/getProvidersByDhcVendor.js` - Provider lookup by DHC
- `server/routes/getNearbyProvidersVendor.js` - Nearby provider search
- `server/routes/searchProvidersVendor.js` - Text search

## Files Modified

- `server.js` - Registered new routes

## Rollback Plan

If the experiment doesn't work as expected, simply:
1. Remove the route registrations from `server.js`
2. Delete the three vendor route files
3. Original routes remain unchanged and functional

