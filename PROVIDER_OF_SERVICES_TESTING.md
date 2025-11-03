# Provider of Services File - Testing Guide

This guide shows you how to test the Provider of Services File API connection.

## 🚀 Quick Start

### Method 1: Node.js Test Script (Recommended)

1. **Make sure your server is running:**
   ```bash
   npm run dev
   # or your usual server start command
   ```

2. **Run the test script:**
   ```bash
   node test_provider_of_services.js
   ```

This will test all endpoints and show you sample data.

---

### Method 2: Browser Console Testing

1. **Start your server and frontend**

2. **Open your browser console** (F12)

3. **Run these commands:**

```javascript
// Test 1: Get Schema
fetch('/api/provider-of-services-schema')
  .then(r => r.json())
  .then(data => {
    console.log('Schema:', data);
    console.log('Fields:', data.data);
  });

// Test 2: Get Sample Data (no filters)
fetch('/api/provider-of-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ limit: 5 })
})
  .then(r => r.json())
  .then(data => {
    console.log('Sample Data:', data);
    console.log('First Record:', data.data[0]);
  });

// Test 3: Filter by State
fetch('/api/provider-of-services', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    filters: { STATE: 'MO' },
    limit: 10 
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('Missouri Facilities:', data.data.length);
    console.log('Sample:', data.data[0]);
  });

// Test 4: Get by State (GET endpoint)
fetch('/api/provider-of-services-by-fips?state=MO')
  .then(r => r.json())
  .then(data => {
    console.log('Missouri Facilities (GET):', data.data.length);
  });
```

---

### Method 3: Using the Test Page Component

If you want a visual interface, you can add the test page to your routes:

**In `src/app/App.jsx`, add:**

```javascript
import TestProviderOfServices from "../pages/TestProviderOfServices";

// Then in your routes (inside the private /app routes):
<Route path="test-pos" element={<TestProviderOfServices />} />
```

Then navigate to: `http://localhost:5173/app/test-pos`

---

### Method 4: cURL / Postman / HTTPie

#### Get Schema
```bash
curl http://localhost:5000/api/provider-of-services-schema
```

#### Get Sample Data (POST)
```bash
curl -X POST http://localhost:5000/api/provider-of-services \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

#### Filter by State
```bash
curl -X POST http://localhost:5000/api/provider-of-services \
  -H "Content-Type: application/json" \
  -d '{"filters": {"STATE": "MO"}, "limit": 10}'
```

#### Get by FIPS/State (GET)
```bash
curl "http://localhost:5000/api/provider-of-services-by-fips?state=MO"
```

---

## 📋 Available Endpoints

### 1. GET `/api/provider-of-services-schema`
Returns the list of all field names in the dataset.

**Response:**
```json
{
  "success": true,
  "data": ["FIELD1", "FIELD2", ...]
}
```

---

### 2. POST `/api/provider-of-services`
Fetches data with flexible filtering.

**Request Body:**
```json
{
  "filters": {
    "STATE": "MO",
    "PRVDR_CTGRY_CD": "01",
    "CITY_NAME": "St. Louis"
  },
  "limit": 100,
  "offset": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "FACILITY_NAME": "...",
      "STATE": "MO",
      "CITY_NAME": "...",
      ...
    }
  ]
}
```

**Note:** You can filter by any field in the dataset. Omit `filters` to get all records.

---

### 3. GET `/api/provider-of-services-by-fips`
Convenience endpoint for geographic queries.

**Query Parameters:**
- `fipsList` - Comma-separated FIPS codes (e.g., "29001,29003")
- `state` - 2-letter state code (e.g., "MO")
- `county` - County name (must use with state)

**Examples:**
```
/api/provider-of-services-by-fips?state=MO
/api/provider-of-services-by-fips?state=MO&county=St. Louis
/api/provider-of-services-by-fips?fipsList=29001,29003
```

---

## 🔍 Common Dataset Fields

Based on the CMS Provider of Services File structure, here are some useful fields:

- `FACILITY_NAME` - Name of the facility
- `STATE` - 2-letter state code
- `CITY_NAME` - City name
- `ZIP_CD` - ZIP code
- `PRVDR_CTGRY_CD` - Provider category code
- `PRVDR_CTGRY_SBTYP_CD` - Provider subcategory code
- `FIPS` - FIPS code
- `SSA_CNTY_CD` - SSA county code
- `CRTFCTN_DT` - Certification date
- `CMPLNC_STUS_CD` - Compliance status code

**To see all available fields, call the schema endpoint first!**

---

## 🐛 Troubleshooting

### "Connection Error" or "Failed to fetch"
- Make sure your server is running on port 5000
- Check the server logs for errors
- Verify the dataset UUID is being found correctly

### "Dataset not found in CMS catalog"
- The dataset title must match exactly: "Provider of Services File - Hospital & Non-Hospital Facilities"
- Check if CMS has updated their catalog structure

### Empty results
- Try without filters first to verify the connection works
- Check that filter field names match the schema
- Field names are case-sensitive

### Slow responses
- The dataset is large - use `limit` to paginate
- Results are cached, so repeated queries will be faster

---

## ✅ Expected Results

When everything is working, you should see:

1. **Schema endpoint:** Returns ~50-100 field names
2. **Sample data:** Returns facility records with fields like `FACILITY_NAME`, `STATE`, `CITY_NAME`, etc.
3. **Filtered data:** Returns only records matching your filters

---

## 🎯 Next Steps

Once you've verified the connection works, you can:

1. Create a custom hook (like `useCMSEnrollmentData`) for Provider of Services data
2. Build a UI component to display the data
3. Integrate it into your existing provider or market analysis pages

The API is ready to use! 🎉

