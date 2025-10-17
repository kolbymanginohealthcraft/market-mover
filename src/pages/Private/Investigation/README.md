# Claims Data Investigation Lab

## Purpose

This is a **standalone investigation environment** for exploring the `volume_procedure` table without any dependencies on:
- URL parameters
- Props from parent components
- Provider or market context
- Existing app routing patterns

## Access

Navigate to: `/app/investigation/claims`

## Features

### 1. Overview Tab
- Introduction to the tool
- Quick statistics about available data
- Preview of column groups

### 2. Table Schema Tab
- Browse all 130+ columns organized by functional groups
- Expandable/collapsible sections for each group:
  - Temporal Data
  - Billing Provider (27 columns)
  - Facility Provider (22 columns)
  - Service Location Provider (32 columns)
  - Performing Provider (17 columns)
  - Patient Demographics (6 columns)
  - Claim Details (6 columns)
  - Billing Details (6 columns)
  - Site of Care (2 columns)
  - Payor Information (2 columns)
  - Service & Procedure Codes (16 columns)
  - Revenue Codes (3 columns)
  - Place of Service (2 columns)
  - Metrics & Charges (5 columns)

### 3. Query Builder Tab
- **NPI Configuration**: Add/remove NPIs to query
- **Column Selection**: Choose specific columns or all columns
- **Query Options**: Set row limits
- **Execute Query**: Run queries against BigQuery

### 4. Data Viewer Tab
- View query results in a table
- Export data to CSV
- See all returned columns and rows

## API Endpoints

The tool uses these dedicated investigation endpoints:

### POST `/api/investigation/raw-procedure-data`
Fetch raw data from volume_procedure table

**Request Body:**
```json
{
  "npis": ["1234567890", "0987654321"],
  "limit": 100,
  "columns": ["billing_provider_npi", "code", "count", "charge_total"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "schema": [...],
  "metadata": {
    "rowCount": 100,
    "columnCount": 4,
    "npis": 2,
    "limit": 100
  }
}
```

### POST `/api/investigation/distinct-values`
Get distinct values for a specific column (useful for filter building)

**Request Body:**
```json
{
  "npis": ["1234567890"],
  "column": "service_line_code",
  "limit": 100
}
```

### POST `/api/investigation/table-stats`
Get statistics about the data

**Request Body:**
```json
{
  "npis": ["1234567890"]
}
```

### GET `/api/investigation/sample-data?limit=10`
Get random sample rows

## Use Cases

1. **Data Exploration**: Understand what data is available in each column
2. **Filter Design**: Test different filter combinations to see what data is returned
3. **UI Design**: Experiment with different ways to display the data
4. **Data Quality**: Check for null values, data patterns, and inconsistencies
5. **Performance Testing**: Test query performance with different column selections

## Example Workflow

1. Start with the **Overview** tab to understand what's available
2. Go to **Table Schema** to see all columns organized by category
3. Use **Query Builder** to:
   - Add test NPIs (default ones are provided)
   - Select specific columns of interest
   - Set a reasonable limit (start small!)
4. Click **Run Query**
5. Switch to **Data Viewer** to see results
6. Export to CSV if you want to analyze in Excel/other tools

## Sample NPIs

The tool comes pre-loaded with sample NPIs from the CSV:
- `1316491004` - ACCENTCARE MEDICAL GROUP OF CONNECTICUT
- `1831593391` - AUTUMN LAKE HEALTHCARE AT NEW BRITAIN
- `1255444527` - Michelle L Purcaro

## Tips

- Start with a small limit (10-100 rows) to get fast results
- Use column selection to reduce data transfer if you only need specific fields
- The table has 130+ columns, so selecting all columns returns a lot of data
- Use the export feature to analyze data offline
- This tool is completely isolated - changes here don't affect the main app

## Future Enhancements

Potential additions:
- Filter by date range
- Filter by specific column values
- Data visualization (charts/graphs)
- Query history
- Saved queries
- Aggregation support (GROUP BY)
- Join with other tables

