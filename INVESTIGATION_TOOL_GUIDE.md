# Claims Data Investigation Tool - Quick Start Guide

## What is this?

A standalone investigation environment to explore the `volume_procedure` table **WITHOUT**:
- ❌ URL routing patterns
- ❌ Props from parent components  
- ❌ Provider/market context dependencies
- ❌ Existing app architecture constraints

## Access

🔗 **URL**: `http://localhost:5173/app/investigation/claims`

(Or your deployed URL + `/app/investigation/claims`)

## Quick Start

1. **Navigate** to `/app/investigation/claims`
2. **Explore** the Overview tab to understand what's available
3. **Browse** the Table Schema to see all 130+ columns
4. **Configure** a query in the Query Builder:
   - Use pre-loaded test NPIs or add your own
   - Select specific columns (or leave empty for all)
   - Set a row limit (start with 100)
5. **Run** the query
6. **View** results in the Data Viewer
7. **Export** to CSV if needed

## Available Column Groups

The `volume_procedure` table contains **14 functional groups** of columns:

| Group | Columns | Description |
|-------|---------|-------------|
| **Temporal** | 1 | Date/time data |
| **Billing Provider** | 27 | NPI, name, location, taxonomy, network status |
| **Facility Provider** | 22 | Facility details and location |
| **Service Location** | 32 | Where service was provided |
| **Performing Provider** | 17 | Who performed the service |
| **Patient Demographics** | 6 | Age, gender, location |
| **Claim Details** | 6 | DRG codes and descriptions |
| **Billing Details** | 6 | Facility type, classification, frequency |
| **Site of Care** | 2 | Summary and classification |
| **Payor Information** | 2 | Coverage type, payor group |
| **Service & Procedure Codes** | 16 | CPT/HCPCS codes and hierarchies |
| **Revenue Codes** | 3 | Revenue code details |
| **Place of Service** | 2 | Service location codes |
| **Metrics & Charges** | 5 | Count, min, max, total, geomean |

**Total: 130+ columns**

## Sample Test NPIs

The tool comes pre-loaded with these NPIs:

```
1316491004  - ACCENTCARE MEDICAL GROUP OF CONNECTICUT
1831593391  - AUTUMN LAKE HEALTHCARE AT NEW BRITAIN  
1255444527  - Michelle L Purcaro
```

## Key Features

### 🔍 Column Explorer
- Browse all available columns organized by function
- See column names and groupings
- Understand the data structure

### 🛠️ Query Builder
- Add/remove NPIs dynamically
- Select specific columns to retrieve
- Configure query limits
- Execute queries on-demand

### 📊 Data Viewer
- View raw query results
- See all columns and values
- Export to CSV for offline analysis
- Handle NULL values gracefully

### 📤 Export Capability
- One-click CSV export
- Preserves all column data
- Includes proper CSV escaping

## API Endpoints

### Fetch Raw Data
```bash
POST /api/investigation/raw-procedure-data
Content-Type: application/json

{
  "npis": ["1234567890"],
  "limit": 100,
  "columns": ["billing_provider_npi", "code", "count"]
}
```

### Get Distinct Values (for filters)
```bash
POST /api/investigation/distinct-values
Content-Type: application/json

{
  "npis": ["1234567890"],
  "column": "service_line_code",
  "limit": 100
}
```

### Get Table Statistics
```bash
POST /api/investigation/table-stats
Content-Type: application/json

{
  "npis": ["1234567890"]
}
```

### Get Sample Data
```bash
GET /api/investigation/sample-data?limit=10
```

## Use Cases

### 1. Data Discovery
"What columns are available for patient demographics?"
→ Go to **Table Schema** → Expand **Patient Demographics**

### 2. Filter Testing
"What service lines are available for this provider?"
→ Use **Query Builder** → Run query → Check distinct values in results

### 3. UI Design
"How should I display billing provider information?"
→ Query billing provider columns → See data format → Design UI accordingly

### 4. Data Quality
"Are there NULL values in critical fields?"
→ Query specific columns → Check for NULL indicators in **Data Viewer**

### 5. Performance Testing
"How fast can I query 1000 rows with 50 columns?"
→ Configure query → Measure response time → Optimize as needed

## Best Practices

### ✅ DO:
- Start with small row limits (10-100)
- Select only needed columns when testing specific features
- Use the export feature for detailed analysis
- Explore the schema before building queries
- Test with multiple NPIs to see data variety

### ❌ DON'T:
- Query all columns with high limits (slow and expensive)
- Expect real-time updates (queries are on-demand)
- Use this for production queries (it's for investigation only)
- Forget to handle NULL values in your UI design

## Example Investigation Workflows

### Workflow 1: Understanding Charge Data
1. Go to **Table Schema**
2. Expand **Metrics & Charges** group
3. See available columns: `count`, `charge_min`, `charge_max`, `charge_total`, `charge_geomean`
4. Go to **Query Builder**
5. Select these 5 columns + `billing_provider_name` + `code`
6. Run query with limit 50
7. View results to understand charge patterns
8. Export to CSV for detailed analysis

### Workflow 2: Designing a Service Line Filter
1. **Query Builder** → Add test NPIs
2. Select columns: `service_line_code`, `service_line_description`, `count`
3. Run query
4. **Data Viewer** → See all available service lines
5. Note the format and values
6. Design filter UI based on actual data structure

### Workflow 3: Patient Demographics Analysis
1. **Table Schema** → Expand **Patient Demographics**
2. Note columns: `patient_zip3`, `patient_state`, `patient_us_region`, `patient_us_division`, `patient_age_bracket`, `patient_gender`
3. **Query Builder** → Select all patient columns
4. Run query with limit 100
5. Analyze the data patterns
6. Design demographic filters based on findings

## Troubleshooting

### "No data returned"
- Check if NPIs have data in the table
- Try different NPIs
- Remove filters to see if data exists

### "Query too slow"
- Reduce row limit
- Select fewer columns
- Query fewer NPIs

### "Export not working"
- Check browser popup blocker
- Ensure data is loaded first
- Try a different browser

### "Column not found error"
- Check spelling in column name
- Verify column exists in schema
- Use exact case from schema

## Next Steps

After investigating the data:

1. **Document findings** - Note interesting patterns, data quality issues
2. **Design filters** - Create filter components based on actual data
3. **Build UI components** - Use insights to create effective visualizations
4. **Implement in main app** - Take learnings back to production code
5. **Iterate** - Come back as needed to test new ideas

## Support

For questions or issues:
- Check the README in `src/pages/Private/Investigation/`
- Review the API endpoint documentation
- Check console logs for detailed error messages
- Examine network requests in browser DevTools

---

**Remember**: This is an investigation tool, not a production feature. Use it to explore, understand, and design - then implement properly in the main application.

