# Referral Pathways Analysis - Implementation Guide

## ✅ What Was Built

A comprehensive **Referral Pathways Analysis** tool that helps analyze facility-to-facility referral patterns, specifically focused on identifying which facilities are sending patients to your organization.

---

## 🎯 Key Features

### 1. **Automatic Date Range Calculation**
- Automatically fetches the `max_date` from the `reference_metadata` table for `pathways_provider_overall`
- Sets the default date range to the last 12 months
- Users can adjust the date range as needed

### 2. **Multi-Level Taxonomy Grouping**
Users can group referral sources by:
- **Provider Type** (taxonomy classification) - See which types of facilities send referrals
- **Specialization** (taxonomy specialization) - Drill down to specific specializations
- **State** - Geographic analysis by state
- **County** - More granular geographic view
- **Individual Facilities** - See specific facility-level data

### 3. **Drill-Down Capability**
- Click on any grouped row to expand and see the underlying facilities
- Seamlessly drill from high-level taxonomy to individual facility details
- Cached results for better performance

### 4. **Two Analysis Views**

#### **Referral Sources Tab**
- Shows aggregated data by selected grouping level
- Displays:
  - Number of unique facilities
  - Total referrals (using `inbound_count`)
  - Total charges
  - Months with activity
  - Latest referral date
- Expandable rows for drill-down
- CSV export functionality

#### **Monthly Trends Tab**
- Shows month-by-month breakdown
- Tracks:
  - Unique facilities referring each month
  - Total referrals per month
  - Total charges per month
- Helps identify seasonal patterns and growth trends

---

## 📦 Components Created

### **Backend** (`server/routes/referralPathways.js`)

Four main endpoints:

1. **`GET /api/referral-pathways/metadata`**
   - Fetches the `max_date` from `reference_metadata`
   - Used to set the default 12-month date range

2. **`POST /api/referral-pathways/referral-sources`**
   - Returns aggregated referral sources grouped by selected field
   - Supports filtering and custom date ranges
   - Parameters:
     - `inboundNPI` (required) - The facility receiving referrals
     - `dateFrom`, `dateTo` - Date range
     - `groupByField` - What to group by
     - `filters` - Additional filters
     - `limit` - Max results (default 100)

3. **`POST /api/referral-pathways/facility-details`**
   - Drill-down endpoint for seeing individual facilities
   - Filters by taxonomy classification, specialization, state, or county
   - Returns top 50 facilities with detailed metrics

4. **`POST /api/referral-pathways/filter-options`**
   - Returns available filter values for a given column
   - Cached for 5 minutes for performance

5. **`POST /api/referral-pathways/trends`**
   - Returns monthly trend data
   - Shows referral volume over time

### **Frontend** (`src/pages/Private/ReferralPathways/`)

Files:
- `ReferralPathways.jsx` - Main component (600+ lines)
- `ReferralPathways.module.css` - Styling with modern CSS

Features:
- Clean, professional UI with gradient accents
- Responsive table layouts
- Loading states and error handling
- CSV export functionality
- Expandable rows for drill-down
- Tab-based navigation

### **Integration**

Modified files:
- `server.js` - Registered the route
- `src/app/App.jsx` - Added route and import
- `src/components/Navigation/Sidebar.jsx` - Added navigation button with GitBranch icon

---

## 🚀 How to Use

### Access the Tool

1. Navigate to **Referral Pathways** in the sidebar (look for the GitBranch icon)
2. Or go directly to: `/app/investigation/referral-pathways`

### Basic Workflow

1. **Enter Inbound NPI** (default is `1043205479`)
   - This is the facility receiving referrals (e.g., your SNF)

2. **Verify Date Range**
   - Automatically set to last 12 months
   - Adjust if needed

3. **Select Grouping Level**
   - Start with "Provider Type" to see high-level categories
   - Can drill down to specialization or individual facilities

4. **Run Analysis**
   - Click "Run Analysis" button
   - Wait 10-30 seconds for results

5. **Review Results**
   - **Referral Sources Tab**: See aggregated data
   - Click any row to expand and see underlying facilities
   - **Monthly Trends Tab**: See time-based patterns

6. **Export Data**
   - Click "Export CSV" to download the results

### Example Analysis Flow

**Question**: "Which hospitals are sending patients to my SNF?"

1. Set grouping to "Provider Type"
2. Run analysis
3. See that "General Acute Care Hospital" sends 1,500 referrals
4. Click to expand → See top 10 specific hospitals
5. Switch to "Individual Facilities" grouping to see full list
6. Export to CSV for marketing team

---

## 📊 Data Source

**Table**: `aegis_access.pathways_provider_overall`

**Key Fields Used**:
- `inbound_facility_provider_npi` - Your facility (where patients go TO)
- `outbound_facility_provider_*` - Referring facilities (where patients come FROM)
- `inbound_count` - Volume metric (number of referrals)
- `charges_total` - Total charges
- `date__month_grain` - Month of referral

**Filters Applied**:
- Always filters to facility-to-facility pathways only
- Excludes NULL facility NPIs
- Date range filter for performance

---

## 🎨 UI Design

### Color Scheme
- Primary gradient: Purple-blue (`#667eea` to `#764ba2`)
- Clean white backgrounds
- Subtle shadows and borders
- Responsive and mobile-friendly

### Key UI Elements
- **Stat cards** for summary metrics
- **Expandable tables** for drill-down
- **Loading overlay** during API calls
- **Empty states** with helpful messaging
- **Export button** for CSV downloads

---

## ⚡ Performance

### Query Optimization
- Always requires `inboundNPI` filter (prevents full table scans)
- Uses aggregation (SUM, COUNT) instead of raw row retrieval
- Limits results to 100 rows by default
- Caches filter options for 5 minutes

### Expected Query Times
- Metadata fetch: < 1 second
- Referral sources: 10-20 seconds
- Facility details: 5-10 seconds
- Trends: 10-15 seconds

---

## 🔧 Technical Details

### Date Handling
- BigQuery returns dates as objects: `{value: "2024-01-01"}`
- Frontend sanitizes all date responses
- Displays dates in `YYYY-MM` format for month-level data

### Drill-Down Logic
```
Classification Level (e.g., "Hospital")
  ↓ Click to expand
Facility Details (Top 50 hospitals)
  ↓ Or change grouping
Individual Facility Level (See all as top-level rows)
```

### Caching Strategy
- Metadata cached in component state
- Filter options cached on backend (5 min TTL)
- Facility details cached by drill-down context in component state

---

## 🎯 Use Cases

### 1. Marketing Prioritization
**Goal**: Focus marketing efforts on top referral sources

**Steps**:
1. Run analysis with default settings
2. Review top 10-20 sources by volume
3. Export to CSV
4. Share with marketing team for outreach

### 2. Relationship Management
**Goal**: Identify declining referral sources

**Steps**:
1. Run analysis for last 12 months
2. Switch to Monthly Trends tab
3. Look for facilities with decreasing volume
4. Investigate and rebuild relationships

### 3. Geographic Analysis
**Goal**: Understand referral patterns by location

**Steps**:
1. Set grouping to "State"
2. Run analysis
3. Identify key states
4. Switch to "County" for more detail
5. Use insights for facility expansion planning

### 4. Taxonomy Analysis
**Goal**: Which types of providers refer most

**Steps**:
1. Set grouping to "Provider Type"
2. Run analysis
3. Identify top categories (hospitals, physicians, etc.)
4. Drill down to specializations
5. Target marketing to high-volume specialties

---

## 🚨 Troubleshooting

### "No referral sources found"
- **Cause**: No data for the selected NPI in the date range
- **Solution**: 
  - Verify NPI is correct
  - Expand date range
  - Check if NPI exists in pathways table

### Query takes too long (>60 seconds)
- **Cause**: Large data volume or network issues
- **Solution**:
  - Reduce date range to 6 months
  - Check server logs
  - Verify BigQuery connection

### Dates showing as objects in UI
- **Cause**: Date sanitization not working
- **Solution**: Check browser console for errors
- This is handled automatically but may occur with new BigQuery versions

---

## 📈 Future Enhancements

### Planned Features
1. **Visual Charts**
   - Bar chart of top 10 sources
   - Line chart for trends
   - Pie chart for taxonomy distribution

2. **Advanced Filters**
   - Filter by payor type
   - Filter by lead time
   - Filter by charges

3. **Multiple Facilities**
   - Analyze multiple inbound NPIs at once
   - Compare referral patterns across facilities

4. **Benchmarking**
   - Compare to market averages
   - Market share calculations

5. **Alerts**
   - Email when referral volume drops
   - Dashboard widgets for at-risk relationships

---

## 📝 Code Examples

### API Call Example
```javascript
const response = await fetch('/api/referral-pathways/referral-sources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inboundNPI: '1043205479',
    dateFrom: '2023-01-01',
    dateTo: '2024-01-01',
    groupByField: 'outbound_facility_provider_taxonomy_classification',
    limit: 100
  })
});

const result = await response.json();
console.log(result.data); // Array of referral sources
```

### SQL Query Pattern
```sql
SELECT 
  outbound_facility_provider_taxonomy_classification,
  COUNT(DISTINCT outbound_facility_provider_npi) as unique_facilities,
  SUM(inbound_count) as total_referrals,
  SUM(charges_total) as total_charges
FROM `aegis_access.pathways_provider_overall`
WHERE inbound_facility_provider_npi = '1043205479'
  AND date__month_grain >= '2023-01-01'
  AND date__month_grain <= '2024-01-01'
  AND outbound_facility_provider_npi IS NOT NULL
GROUP BY outbound_facility_provider_taxonomy_classification
ORDER BY total_referrals DESC
LIMIT 100
```

---

## ✅ Testing Checklist

- [x] Backend route registered in `server.js`
- [x] Frontend component created
- [x] Route added to `App.jsx`
- [x] Sidebar navigation button added
- [x] Metadata endpoint returns max_date
- [x] Referral sources endpoint returns data
- [x] Facility details drill-down works
- [x] Trends endpoint returns monthly data
- [x] CSV export functionality works
- [x] Date sanitization handles BigQuery format
- [x] Loading states display properly
- [x] Error handling shows user-friendly messages
- [x] Responsive design on mobile
- [ ] **User testing with real NPIs**
- [ ] **Performance testing with large date ranges**
- [ ] **Cross-browser testing**

---

## 🎓 Key Takeaways

### What Works Well
✅ Multi-level grouping provides flexibility
✅ Drill-down UX is intuitive
✅ Automatic date range saves user time
✅ CSV export enables offline analysis
✅ Clean, modern UI

### What to Watch
⚠️ Large date ranges may be slow (10-30 seconds)
⚠️ BigQuery date format requires sanitization
⚠️ Cache invalidation on filter changes

### What Makes This Special
🌟 **Focused use case**: Facility → Facility referrals only
🌟 **Smart defaults**: Last 12 months automatically set
🌟 **Taxonomy hierarchy**: Drill from type → specialization → facility
🌟 **Actionable insights**: Export for marketing/sales use

---

## 📞 Support

For questions or issues:
1. Check server logs: `console.log` statements throughout code
2. Check browser console for frontend errors
3. Verify BigQuery connection
4. Test with known good NPI: `1043205479`

---

**Built with**: React, Node.js, Express, BigQuery
**Access**: `/app/investigation/referral-pathways`
**Icon**: GitBranch (represents referral pathways/network)

🎉 **Ready to use!**


