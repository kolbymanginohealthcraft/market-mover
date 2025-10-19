# Referral Pathways Analysis - User Guide

## Overview

The **Referral Pathways Analysis** tool helps you understand where your facility referrals come from, enabling data-driven decisions about marketing, relationship building, and strategic partnerships.

**Access**: `/app/investigation/referral-pathways`

---

## What It Does

This tool analyzes patient flow FROM outbound providers (e.g., hospitals, physicians) TO inbound providers (your facilities - SNFs, home health, hospice).

### Executive Questions It Answers

1. **"Which hospitals send us the most patients?"**
   - Top referral sources ranked by volume

2. **"What's the payor mix by referral source?"**
   - Understand which hospitals send profitable vs low-margin patients

3. **"How long does it take from discharge to admission?"**
   - Lead time analysis to optimize intake processes

4. **"Are referrals growing or declining?"**
   - Trend analysis over time

5. **"Where are patients traveling from?"**
   - Geographic distribution of referral sources

---

## Data Source

**Table**: `aegis_access.pathways_provider_overall` (91.8 billion rows!)

**Key Fields**:
- **Outbound providers**: Where patients came FROM
  - Facility, billing, service location, performing providers
- **Inbound providers**: Where patients went TO (your facilities)
- **Lead-up period**: Time between outbound and inbound visits
- **Metrics**: Pathway counts, charges, explicit/implicit pathways

---

## How to Use

### Step 1: Select Your Providers

Choose **one** of these methods:

#### **Option A: Select a Saved Market**
- Click "Select Market" dropdown
- Choose a market (e.g., "Nashville Metro - 30 miles")
- All HCOs in that market will be analyzed

#### **Option B: Select a Provider Tag**
- Click "Or Select Tag" dropdown
- Choose a tag (e.g., "My SNFs", "Our Facilities")
- Only tagged providers will be analyzed

**Note**: The tool will fetch NPIs for all providers in the selected market/tag.

### Step 2: Set Analysis Parameters

#### **Date Range**
- Default: Last 12 months
- Use calendar pickers to adjust date range
- Recommendation: At least 6 months for meaningful trends

#### **Group By**
Choose which outbound provider field to group by:
- **Facility Provider** (default) - Best for hospitals
- **Billing Provider** - Best for billing entities
- **Service Location Provider** - Best for specific locations
- **Performing Provider** - Best for individual physicians

### Step 3: Run Analysis

- Click **"Run Analysis"** button
- Wait 10-30 seconds (depending on data volume)
- Tool fetches 4 datasets in parallel:
  1. Summary Statistics
  2. Top Referral Sources
  3. Referral Trends
  4. Payor Mix

### Step 4: Review Results

Use the **4 tabs** to explore different views:

---

## View 1: Summary

**6 key metrics displayed as cards:**

| Metric | What It Means |
|--------|---------------|
| **Total Referral Sources** | # of unique outbound providers |
| **Total Pathways** | # of patient referral events |
| **Total Charges** | Sum of charges for all pathways |
| **Avg Lead Time** | Average days between outbound and inbound |
| **Payor Groups** | # of distinct payor groups |
| **Patient States** | # of states patients traveled from |

**Use Case**: Quick snapshot of referral network size and diversity.

---

## View 2: Top Sources

**Table showing top referral sources (default: 50)**

**Columns**:
- Rank (1-50)
- Provider Name + NPI
- Location (city, state)
- Taxonomy (provider type)
- Pathways (referral count)
- Charges (total $)
- Avg Lead Days

**Features**:
- Sortable by any column
- Click "Export CSV" to download
- Hover to see full provider details

**Use Case**: 
- **Marketing**: Focus efforts on top 10-20 sources
- **Strategic**: Identify declining sources (compare to past periods)
- **Financial**: Prioritize high-charge sources

**Example Insight**:
> "Memorial Regional Hospital sends 450 patients/year at $2.3M charges vs Community Hospital with 180 patients at $450K. Focus marketing on Memorial."

---

## View 3: Trends

**Monthly trend table (last 36 months)**

**Columns**:
- Month
- Distinct Referral Sources (# of referring providers that month)
- Total Pathways (referral count)
- Total Charges
- Avg Lead Days

**Use Case**:
- **Seasonality**: Identify seasonal referral patterns
- **Growth**: Track if referral network is expanding
- **Alerts**: Spot sudden drops in volume (lost relationship?)

**Example Insight**:
> "Referrals dropped 40% in March 2024 vs February. Investigation revealed hospital discharge planner retired - need to rebuild relationship."

---

## View 4: Payor Mix

**Table showing referral sources broken down by payor group**

**Columns**:
- Provider Name + NPI
- Payor Group (Medicare, MA, Medicaid, Commercial, etc.)
- Pathways
- Charges
- Avg Lead Days

**Use Case**:
- **Contracting**: Identify which hospitals send specific MA plans
- **Financial Planning**: Understand payor mix by referral source
- **Strategic**: Target hospitals that send high-margin payors

**Example Insight**:
> "St. Mary's Hospital sends 200 patients/year but 85% are Medicare Advantage with better reimbursement vs Sacred Heart with 180 patients but 60% Medicaid."

---

## Advanced Tips

### 1. **Compare Time Periods**

Run analysis for:
- **Last 12 months**: See current state
- **Same period last year**: Spot year-over-year changes

Compare top sources lists to see who's growing/declining.

### 2. **Analyze by Provider Type**

Change "Group By" to see different perspectives:

- **Facility Provider**: Broad organizational view (hospitals, health systems)
- **Service Location**: Specific campus or building
- **Performing Provider**: Individual physicians (identifies key referring docs)
- **Billing Provider**: Financial/billing entity view

### 3. **Geographic Analysis**

Look at "Patient States" in summary to understand:
- Are referrals local or regional?
- Are you drawing from expected catchment area?
- Opportunity for expansion into underserved areas

### 4. **Lead Time Optimization**

Review "Avg Lead Days" to:
- Identify sources with quick turnaround (urgent care coordination)
- Spot delays that could indicate process issues
- Compare to industry benchmarks (typical: 0-7 days for post-acute)

### 5. **Market Share Analysis**

Combine with HCO Analysis tool:
- Referral Pathways shows WHERE referrals come from
- HCO Analysis shows total market capacity
- Calculate your share: Your pathways / Total market pathways

---

## API Endpoints

Behind the scenes, the tool uses these endpoints:

### 1. `/api/referral-pathways/summary-stats`
**Returns**: High-level summary statistics

**POST Body**:
```json
{
  "inboundNPIs": ["1234567890", "0987654321"],
  "dateFrom": "2023-01-01",
  "dateTo": "2024-01-01"
}
```

### 2. `/api/referral-pathways/top-referral-sources`
**Returns**: Ranked list of referral sources

**POST Body**:
```json
{
  "inboundNPIs": ["1234567890"],
  "groupBy": "facility",
  "dateFrom": "2023-01-01",
  "dateTo": "2024-01-01",
  "limit": 50,
  "includePayorMix": true,
  "includeTiming": true,
  "includeGeography": true
}
```

### 3. `/api/referral-pathways/referral-trends`
**Returns**: Monthly trend data

**POST Body**:
```json
{
  "inboundNPIs": ["1234567890"],
  "limit": 36
}
```

### 4. `/api/referral-pathways/payor-mix`
**Returns**: Payor mix breakdown by source

**POST Body**:
```json
{
  "inboundNPIs": ["1234567890"],
  "dateFrom": "2023-01-01",
  "dateTo": "2024-01-01",
  "limit": 100
}
```

### 5. `/api/referral-pathways/geographic-distribution`
**Returns**: Geographic breakdown of referrals

**POST Body**:
```json
{
  "inboundNPIs": ["1234567890"],
  "groupBy": "state",
  "limit": 50
}
```

### 6. `/api/referral-pathways/referral-source-detail`
**Returns**: Drill-down for specific outbound provider

**POST Body**:
```json
{
  "inboundNPIs": ["1234567890"],
  "outboundNPI": "9876543210",
  "groupByMonth": true
}
```

---

## Performance Notes

### Query Speed

Given the 91.8 billion row table, queries are optimized for speed:

- **Typical query time**: 10-30 seconds
- **Optimization**: Always filters by inbound NPIs first
- **Aggregation**: Queries use SUM/COUNT aggregation (not row-by-row)
- **Limits**: Default limits prevent massive result sets

### Best Practices

✅ **DO**:
- Start with smaller date ranges (6-12 months)
- Use market/tag selection (filters to specific NPIs)
- Analyze 1-50 providers at a time
- Export CSV for offline analysis of large result sets

❌ **DON'T**:
- Query without date range (defaults to all time - slow!)
- Select markets with 1000+ providers (slow)
- Run multiple analyses simultaneously (blocks each other)

---

## Use Cases & Workflows

### Use Case 1: Marketing Focus

**Goal**: Identify top 10 hospitals to focus marketing efforts

**Workflow**:
1. Select market or "All My SNFs" tag
2. Set date range to last 12 months
3. Run analysis
4. Go to "Top Sources" tab
5. Export CSV of top 50
6. Share with marketing team

**Outcome**: Marketing team visits top 10, ignores bottom 40.

---

### Use Case 2: Lost Relationship Alert

**Goal**: Identify referral sources that suddenly declined

**Workflow**:
1. Run analysis for "Last 12 months"
2. Export top sources
3. Run analysis for "Same period last year"
4. Export top sources
5. Compare lists in Excel - find sources that dropped off

**Outcome**: Sales team investigates why Hospital X stopped referring.

---

### Use Case 3: MA Network Strategy

**Goal**: Identify which hospitals send high-MA volume

**Workflow**:
1. Select market
2. Run analysis
3. Go to "Payor Mix" tab
4. Filter/sort by MA payor groups
5. Identify hospitals with high MA %

**Outcome**: Prioritize contracting conversations with those hospitals' preferred MA plans.

---

### Use Case 4: Geographic Expansion

**Goal**: Understand where patients travel from

**Workflow**:
1. Select your facilities
2. Run analysis
3. Review "Patient States" in summary
4. Use geographic-distribution endpoint to drill down by county/city

**Outcome**: Discover unexpected patient origins - opportunity for new facility location.

---

### Use Case 5: Physician-Level Relationships

**Goal**: Find specific physicians who refer frequently

**Workflow**:
1. Select facilities
2. Change "Group By" to "Performing Provider"
3. Run analysis
4. Top Sources tab now shows individual physicians

**Outcome**: Marketing focuses on building relationships with top 20 referring physicians personally.

---

## Troubleshooting

### Issue: "At least one inbound provider NPI is required"

**Solution**: Select a market or provider tag before running analysis.

---

### Issue: Query takes > 60 seconds

**Possible causes**:
- Too many providers selected (>100)
- No date range (querying all historical data)
- Network/server issue

**Solutions**:
- Reduce date range to 6-12 months
- Select fewer providers or use tags
- Check server logs for errors

---

### Issue: No data returned

**Possible causes**:
- Selected providers have no referral pathways in date range
- NPIs don't exist in pathways table (not in network or no claims data)

**Solutions**:
- Expand date range
- Check that providers are Type 2 (organizations), not Type 1 (individuals)
- Verify NPIs are correct

---

### Issue: "Cannot read property 'value' of undefined" for dates

**Solution**: This is a known quirk with BigQuery date objects. Dates are returned as `{value: "2024-01-01"}`. The code handles this with `?.value` but if you see it in exports, reference `date.value` instead of `date`.

---

## Roadmap / Future Enhancements

### Planned Features:

1. **Visual Charts**
   - Bar chart of top 10 sources
   - Line chart of trends
   - Pie chart of payor mix

2. **Alerts & Monitoring**
   - Email alerts when referral source volume drops >20%
   - Monthly automated reports

3. **Drill-Down**
   - Click a referral source to see month-by-month detail
   - Patient demographic breakdown by source

4. **Benchmarking**
   - Compare your referral patterns to market averages
   - "Market share" by referral source

5. **Integration with HCO Analysis**
   - Click a hospital in referral pathways → jump to HCO Analysis for that hospital
   - See quality scores, distance, contact info

---

## Summary

The **Referral Pathways Analysis** tool transforms your facility's referral data from scattered claims records into actionable intelligence about:
- WHERE your referrals come from
- WHO to focus marketing efforts on
- WHICH relationships are growing/declining
- WHAT payor mix each source provides
- WHEN to intervene if patterns change

**Key Insight**: 20% of referral sources typically drive 80% of volume. This tool identifies that critical 20% so you can allocate resources strategically.

---

## Quick Reference

| View | Shows | Best For |
|------|-------|----------|
| **Summary** | 6 key metrics | Quick snapshot |
| **Top Sources** | Ranked referral list | Marketing prioritization |
| **Trends** | Monthly patterns | Spotting changes |
| **Payor Mix** | Payor breakdown | Financial planning |

**Export**: Use "Export CSV" button on Top Sources tab for offline analysis

**Access**: `/app/investigation/referral-pathways`

**Requirements**: 
- Saved market OR provider tag
- At least 1 provider NPI
- Recommended: 6+ months of date range

---

*For technical implementation details, see `/server/routes/referralPathways.js`*

