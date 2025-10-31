# Experimental Vendor BigQuery Routes

Quick reference for testing the new vendor BigQuery provider routes.

## Routes

| Endpoint | Method | Purpose | Original Route |
|----------|--------|---------|----------------|
| `/api/getProvidersByDhcVendor` | POST | Get providers by DHC IDs | `/api/getProvidersByDhc` |
| `/api/search-providers-vendor` | GET | Search providers by name/location | `/api/search-providers` |
| `/api/nearby-providers-vendor` | GET | Find providers within radius | `/api/nearby-providers` |

## Test URLs

### 1. Get Providers by DHC
```bash
POST /api/getProvidersByDhcVendor
Content-Type: application/json

{
  "dhc_ids": [12345, 67890]
}
```

### 2. Search Providers
```bash
# By name
GET /api/search-providers-vendor?search=hospital

# By DHC
GET /api/search-providers-vendor?dhc=12345

# All providers (limit 100)
GET /api/search-providers-vendor
```

### 3. Nearby Providers
```bash
GET /api/nearby-providers-vendor?lat=37.7749&lon=-122.4194&radius=10
```

## Key Difference

**New vendor routes return BOTH DHC and NPI together** - no need for separate queries!

```json
{
  "dhc": 12345,
  "npi": "1234567890",  // ← Included now!
  "name": "Provider Name",
  ...
}
```

## Testing in Browser DevTools

```javascript
// Test nearby providers
fetch('/api/nearby-providers-vendor?lat=37.7749&lon=-122.4194&radius=10')
  .then(r => r.json())
  .then(d => console.log(d))

// Test search
fetch('/api/search-providers-vendor?search=hospital')
  .then(r => r.json())
  .then(d => console.log(d))

// Test by DHC
fetch('/api/getProvidersByDhcVendor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dhc_ids: [12345] })
})
  .then(r => r.json())
  .then(d => console.log(d))
```

