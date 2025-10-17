# Claims Data Investigation Tool - Implementation Summary

## 🎯 What Was Built

A **completely standalone investigation environment** for exploring the `volume_procedure` table without any dependencies on your existing app architecture. This tool allows you to freely explore the data structure, test filters, and design UI components based on real data patterns.

## 📁 Files Created

### Frontend Components
1. **`src/pages/Private/Investigation/ClaimsDataInvestigation.jsx`**
   - Main investigation component with 4 tabs (Overview, Schema, Query Builder, Data Viewer)
   - ~600 lines of code
   - Full column group definitions (14 groups, 130+ columns)
   - Interactive query builder with NPI management
   - Data export to CSV functionality

2. **`src/pages/Private/Investigation/ClaimsDataInvestigation.module.css`**
   - Complete styling for the investigation tool
   - Modern, clean UI with good UX
   - Responsive layouts
   - ~600 lines of CSS

3. **`src/pages/Private/Investigation/README.md`**
   - Detailed documentation of the tool
   - API endpoints
   - Use cases and workflows

### Backend API
4. **`server/routes/investigation.js`**
   - 4 dedicated API endpoints for data investigation
   - Direct BigQuery access
   - No business logic, just raw data access

### Configuration
5. **`server.js`** (modified)
   - Added investigation route registration

6. **`src/app/App.jsx`** (modified)
   - Added route: `/app/investigation/claims`
   - Protected route (requires authentication)

### Documentation
7. **`INVESTIGATION_TOOL_GUIDE.md`**
   - Quick start guide
   - Use cases and workflows
   - Best practices

8. **`CLAIMS_INVESTIGATION_SUMMARY.md`** (this file)
   - Implementation summary

## 🚀 How to Access

### Local Development
```
http://localhost:5173/app/investigation/claims
```

### Production
```
https://your-domain.com/app/investigation/claims
```

## 🔧 Features Implemented

### 1. Overview Tab
- Introduction to the tool
- Table statistics (column counts, groups)
- Quick start guide
- Column group preview cards

### 2. Table Schema Tab
- All 130+ columns organized into 14 functional groups
- Expandable/collapsible sections
- Easy browsing of available fields

**Column Groups:**
- Temporal Data (1)
- Billing Provider (27)
- Facility Provider (22)
- Service Location Provider (32)
- Performing Provider (17)
- Patient Demographics (6)
- Claim Details (6)
- Billing Details (6)
- Site of Care (2)
- Payor Information (2)
- Service & Procedure Codes (16)
- Revenue Codes (3)
- Place of Service (2)
- Metrics & Charges (5)

### 3. Query Builder Tab
- **NPI Management**: Add/remove test NPIs
- **Column Selection**: Choose specific columns or all
- **Group Selection**: Select entire column groups at once
- **Query Options**: Set row limits
- **Visual Feedback**: Shows selection counts
- **Pre-loaded NPIs**: 3 sample NPIs from your CSV

### 4. Data Viewer Tab
- Table view of query results
- NULL value handling
- Row count display
- Export to CSV button
- Responsive table with horizontal scrolling

## 🔌 API Endpoints

### 1. Raw Procedure Data
```javascript
POST /api/investigation/raw-procedure-data

Request:
{
  "npis": ["1234567890"],
  "limit": 100,
  "columns": ["billing_provider_npi", "code", "count"] // optional
}

Response:
{
  "success": true,
  "data": [...rows...],
  "schema": [...column info...],
  "metadata": {
    "rowCount": 100,
    "columnCount": 3,
    "npis": 1,
    "limit": 100
  }
}
```

### 2. Distinct Values
```javascript
POST /api/investigation/distinct-values

Request:
{
  "npis": ["1234567890"],
  "column": "service_line_code",
  "limit": 100
}

Response:
{
  "success": true,
  "data": [
    { "value": "ABC", "count": 45 },
    ...
  ]
}
```

### 3. Table Statistics
```javascript
POST /api/investigation/table-stats

Request:
{
  "npis": ["1234567890"] // optional
}

Response:
{
  "success": true,
  "data": {
    "total_rows": 1000,
    "unique_billing_providers": 50,
    "unique_performing_providers": 75,
    "unique_facilities": 10,
    ...
  }
}
```

### 4. Sample Data
```javascript
GET /api/investigation/sample-data?limit=10

Response:
{
  "success": true,
  "data": [...random rows...]
}
```

## 🎨 Design Principles

### Independence
- **No URL dependencies**: Doesn't rely on route parameters
- **No props**: Manages its own state completely
- **No context dependencies**: Not tied to provider/market context
- **Self-contained**: All logic and data management internal

### User Experience
- **Clear navigation**: 4 intuitive tabs
- **Progressive disclosure**: Start simple, drill deeper
- **Visual feedback**: Loading states, error messages, counts
- **Export capability**: Take data offline for analysis

### Developer Experience
- **Clean code**: Well-organized, commented
- **Reusable patterns**: Can be adapted for other tables
- **Good documentation**: README and guides included
- **Error handling**: Graceful failures with helpful messages

## 📊 Use Cases

### 1. Data Structure Exploration
**Goal**: Understand what columns are available  
**Process**: Browse Table Schema → See all column groups → Note interesting fields

### 2. Filter Design
**Goal**: Build effective filters for the main app  
**Process**: Query specific columns → See actual values → Design filters based on data

### 3. UI Component Design
**Goal**: Create optimal visualization components  
**Process**: Query data → Analyze patterns → Design appropriate UI elements

### 4. Data Quality Assessment
**Goal**: Identify data issues  
**Process**: Query various columns → Check for NULLs → Document quality issues

### 5. Performance Testing
**Goal**: Understand query performance  
**Process**: Test different column/row combinations → Measure response times → Optimize

## 🔄 Example Workflows

### Workflow A: Understanding Charge Data
1. **Schema Tab** → Expand "Metrics & Charges"
2. See 5 charge-related columns
3. **Query Builder** → Select charge columns + provider name
4. Run query with 50 row limit
5. **Data Viewer** → Analyze charge patterns
6. Export to CSV for detailed analysis
7. Design charge visualization component

### Workflow B: Building a Service Line Filter
1. **Query Builder** → Add test NPIs
2. Select: `service_line_code`, `service_line_description`, `count`
3. Run query
4. **Data Viewer** → See all available service lines
5. Note common patterns and values
6. Design hierarchical filter based on findings
7. Implement in main app

### Workflow C: Patient Demographics UI
1. **Schema Tab** → Note patient columns
2. **Query Builder** → Select all patient columns
3. Run query with 100 rows
4. Analyze geographic and demographic patterns
5. Design demographic filter UI
6. Export sample for mockups

## ⚙️ Technical Details

### Frontend Stack
- React functional components
- CSS Modules for styling
- Lucide icons
- Controlled forms

### Backend Stack
- Express.js routes
- BigQuery client
- No caching (investigation only)
- Direct table access

### Data Source
- Table: `aegis_access.volume_procedure`
- Filtered by: `billing_provider_npi IN UNNEST(@npis)`
- Columns: 130+ available

## 🚦 Getting Started

### Step 1: Start the App
```bash
npm run dev
```

### Step 2: Navigate
Open browser to: `http://localhost:5173/app/investigation/claims`

### Step 3: Explore
- Start with **Overview** tab
- Browse **Table Schema**
- Build a query in **Query Builder**
- View results in **Data Viewer**

### Step 4: Experiment
- Try different NPIs
- Select various column combinations
- Test different row limits
- Export data to CSV

### Step 5: Document
- Note interesting data patterns
- Identify filter opportunities
- Plan UI components
- Document data quality issues

## 🎓 Best Practices

### Query Building
✅ Start with small limits (10-50 rows)  
✅ Select only needed columns initially  
✅ Test with multiple NPIs to see variety  
✅ Use export for detailed offline analysis  

❌ Don't query all columns with high limits  
❌ Don't expect real-time updates  
❌ Don't use for production queries  

### Investigation Process
1. **Understand** the schema first
2. **Query** small samples initially
3. **Analyze** patterns and quality
4. **Document** findings
5. **Design** based on real data
6. **Implement** in main app
7. **Iterate** as needed

## 📝 Next Steps

### Immediate Actions
1. ✅ Tool is ready to use
2. ✅ Navigate to `/app/investigation/claims`
3. ✅ Start exploring the data

### Future Enhancements (Optional)
- [ ] Date range filtering
- [ ] Column value filtering
- [ ] Data visualizations (charts)
- [ ] Query history
- [ ] Saved queries
- [ ] Aggregation support (GROUP BY)
- [ ] Join with other tables
- [ ] Export to JSON

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 5000 is already in use
npx kill-port 5000
npm run dev
```

### No Data Returned
- Verify NPIs exist in the table
- Check BigQuery credentials
- Review console logs for errors

### Slow Queries
- Reduce row limit
- Select fewer columns
- Query fewer NPIs

### Export Issues
- Check browser popup blocker
- Ensure data is loaded first
- Try different browser

## 📚 Documentation Files

- **Tool Guide**: `INVESTIGATION_TOOL_GUIDE.md`
- **Component README**: `src/pages/Private/Investigation/README.md`
- **This Summary**: `CLAIMS_INVESTIGATION_SUMMARY.md`

## ✨ Key Benefits

1. **No Dependencies**: Completely isolated from existing app architecture
2. **Full Access**: See all 130+ columns in the volume_procedure table
3. **Interactive**: Build and execute queries on-demand
4. **Exportable**: Take data offline for detailed analysis
5. **Well Documented**: Multiple documentation files for reference
6. **Production Ready**: Clean code, error handling, good UX

## 🎉 You Can Now...

✅ Explore all available columns in volume_procedure  
✅ Test different filter combinations  
✅ Understand data patterns and quality  
✅ Design optimal UI components  
✅ Export data for offline analysis  
✅ Iterate quickly without affecting production code  

---

**The investigation tool is ready to use!**

Navigate to: **`/app/investigation/claims`**

Start exploring! 🚀

