# Aggregation & Filtering Guide

## 🎉 New Enhanced Features

The Claims Investigation Tool now supports:
1. **Aggregation Queries** with GROUP BY
2. **Dynamic Filtering** with auto-populated options
3. **Multiple aggregate functions** (COUNT, SUM, AVG, MIN, MAX, COUNT DISTINCT)
4. **Filter combinations** for precise data exploration

## 📊 Aggregation Queries

### What is Aggregation?

Aggregation lets you **summarize data** instead of viewing raw rows. Instead of seeing every individual procedure, you can see:
- Total procedures **by provider**
- Total charges **by service line**
- Average charges **by patient demographics**
- And much more!

### How to Use Aggregation

1. **Navigate to Aggregation Tab**
2. **Add NPIs** (or use pre-loaded ones)
3. **Select GROUP BY columns** - These define how data is grouped
4. **Configure aggregate functions** - What calculations to perform
5. **Run the query**

### Example 1: Summarize by Provider

**Goal**: See total procedures and charges for each provider

**Steps**:
```
1. Aggregation Tab
2. GROUP BY: billing_provider_name
3. Aggregations:
   - COUNT(*) as total_procedures
   - SUM(charge_total) as total_charges
4. Run Query
```

**Result**: One row per provider with their totals

```
billing_provider_name          | total_procedures | total_charges
-------------------------------|------------------|---------------
ACCENTCARE MEDICAL GROUP       | 1,234            | $125,430
AUTUMN LAKE HEALTHCARE         | 567              | $67,890
...
```

### Example 2: Summarize by Service Line and Provider

**Goal**: See procedures by service line for each provider

**Steps**:
```
1. Aggregation Tab
2. GROUP BY: 
   - billing_provider_name
   - service_line_description
3. Aggregations:
   - COUNT(*) as procedures
   - SUM(count) as total_count
4. Run Query
```

**Result**: One row per provider/service line combination

### Example 3: Patient Demographics Analysis

**Goal**: Understand patient age and gender distribution

**Steps**:
```
1. Aggregation Tab
2. GROUP BY:
   - patient_age_bracket
   - patient_gender
3. Aggregations:
   - COUNT(*) as records
   - SUM(count) as total_patients
   - AVG(charge_total) as avg_charge
4. Run Query
```

## 🎯 Dynamic Filtering

### What is Dynamic Filtering?

Instead of seeing ALL data, you can **filter to specific values**. The tool automatically fetches available values from the database, so you only see options that exist in your data!

### How to Use Filters

1. **Navigate to Filters Tab**
2. **Click "Select a column to filter"** dropdown
3. **Choose a column** (e.g., `service_line_description`)
4. **The tool fetches available values automatically**
5. **Select a value** from the dropdown
6. **Run your query** (from Query Builder or Aggregation tab)

### Example 1: Filter by Service Line

**Goal**: Only see data for a specific service line

**Steps**:
```
1. Filters Tab
2. Add Filter: service_line_description
3. Select "Physical Therapy" (or whatever you want)
4. Go to Query Builder or Aggregation tab
5. Run your query
```

**Result**: All queries now only return Physical Therapy data

### Example 2: Multiple Filters

**Goal**: See data for specific service line AND patient age

**Steps**:
```
1. Filters Tab
2. Add Filter: service_line_description → Select "Surgery"
3. Add Filter: patient_age_bracket → Select "65-84"
4. Run your query
```

**Result**: Only Surgery procedures for patients aged 65-84

### Example 3: Filter with Aggregation

**Goal**: Total charges by provider, but only for Medicare patients

**Steps**:
```
1. Filters Tab
2. Add Filter: payor_group → Select "Medicare"
3. Aggregation Tab
4. GROUP BY: billing_provider_name
5. Aggregations: SUM(charge_total)
6. Run Query
```

**Result**: Provider totals filtered to Medicare only

## 🔌 New API Endpoints

### 1. Aggregation Endpoint

```javascript
POST /api/investigation/aggregate-data

Body:
{
  "npis": ["1234567890"],
  "groupBy": ["billing_provider_name", "service_line_description"],
  "aggregates": [
    { "function": "COUNT", "column": "*", "alias": "total_count" },
    { "function": "SUM", "column": "charge_total", "alias": "total_charges" }
  ],
  "filters": {
    "payor_group": "Medicare",
    "patient_age_bracket": "65-84"
  },
  "limit": 100
}

Response:
{
  "success": true,
  "data": [
    {
      "billing_provider_name": "ACCENTCARE",
      "service_line_description": "Physical Therapy",
      "total_count": 45,
      "total_charges": "12345.67"
    },
    ...
  ]
}
```

### 2. Filter Options Endpoint

```javascript
POST /api/investigation/filter-options

Body:
{
  "npis": ["1234567890"],
  "columns": ["service_line_description", "patient_age_bracket"],
  "existingFilters": {
    "payor_group": "Medicare"
  },
  "limit": 100
}

Response:
{
  "success": true,
  "data": {
    "service_line_description": [
      { "value": "Physical Therapy", "count": 234 },
      { "value": "Surgery", "count": 156 },
      ...
    ],
    "patient_age_bracket": [
      { "value": "65-84", "count": 567 },
      { "value": "45-64", "count": 234 },
      ...
    ]
  }
}
```

## 💡 Practical Use Cases

### Use Case 1: Identify Top Service Lines

**Question**: What are our most common service lines?

**Solution**:
```
Aggregation Tab:
- GROUP BY: service_line_description
- Aggregations: COUNT(*), SUM(count)
- Sort by count descending (automatic)
```

**Insight**: See which service lines have the most volume

### Use Case 2: Provider Performance Analysis

**Question**: Which providers have the highest charges?

**Solution**:
```
Aggregation Tab:
- GROUP BY: billing_provider_name
- Aggregations: 
  - COUNT(*) as procedures
  - SUM(charge_total) as total_charges
  - AVG(charge_total) as avg_charge
```

**Insight**: Compare provider volumes and charge patterns

### Use Case 3: Geographic Analysis

**Question**: Where are patients coming from?

**Solution**:
```
Aggregation Tab:
- GROUP BY: patient_state, patient_zip3
- Aggregations: COUNT(*), SUM(count)

Optional Filter:
- service_line_description: "Physical Therapy"
```

**Insight**: Understand patient geographic distribution

### Use Case 4: Payor Mix Analysis

**Question**: What's the payor distribution?

**Solution**:
```
Aggregation Tab:
- GROUP BY: payor_group, type_of_coverage
- Aggregations: 
  - COUNT(*) as claims
  - SUM(charge_total) as charges
```

**Insight**: See Commercial vs Medicare vs other payors

### Use Case 5: Temporal Trends

**Question**: How has volume changed over time?

**Solution**:
```
Aggregation Tab:
- GROUP BY: date__month_grain
- Aggregations: 
  - COUNT(*) as claims
  - SUM(count) as procedures
  - SUM(charge_total) as charges
```

**Insight**: See monthly trends

### Use Case 6: Patient Demographics Deep Dive

**Question**: What patient populations do we serve?

**Solution**:
```
Aggregation Tab:
- GROUP BY: 
  - patient_age_bracket
  - patient_gender
  - service_line_description
- Aggregations: COUNT(*), SUM(count)
```

**Insight**: Understand patient demographic mix by service

## 🎓 Advanced Patterns

### Pattern 1: Hierarchical Aggregation

Group by multiple levels to drill down:

```
GROUP BY: 
1. service_category_code
2. service_line_code
3. subservice_line_code

Result: Hierarchical breakdown from category → line → subline
```

### Pattern 2: Filtered Aggregation

Combine filters and aggregation:

```
Filters:
- patient_age_bracket: "65-84"
- payor_group: "Medicare"

GROUP BY: service_line_description
Aggregations: COUNT(*), SUM(charge_total)

Result: Service line totals for Medicare patients 65-84
```

### Pattern 3: Provider Comparison

Compare providers in specific contexts:

```
Filters:
- service_line_description: "Surgery"
- site_of_care_summary: "Inpatient"

GROUP BY: billing_provider_name
Aggregations: 
- COUNT(*) as surgeries
- AVG(charge_total) as avg_charge
- SUM(charge_total) as total_revenue

Result: Provider performance for inpatient surgery
```

### Pattern 4: Date Range Analysis

Group by time with specific filters:

```
Filters:
- date__month_grain: (specific months via custom filter)

GROUP BY: 
- date__month_grain
- billing_provider_name

Result: Monthly provider performance
```

## 📋 Aggregate Function Reference

| Function | Description | Requires Column | Example |
|----------|-------------|-----------------|---------|
| **COUNT** | Count rows | No (uses *) | COUNT(*) → total rows |
| **SUM** | Sum values | Yes | SUM(charge_total) → total charges |
| **AVG** | Average value | Yes | AVG(charge_total) → avg charge per claim |
| **MIN** | Minimum value | Yes | MIN(charge_total) → lowest charge |
| **MAX** | Maximum value | Yes | MAX(charge_total) → highest charge |
| **COUNT_DISTINCT** | Count unique values | Yes | COUNT(DISTINCT billing_provider_npi) → unique providers |

## 🔄 Workflow Examples

### Workflow A: Explore → Filter → Aggregate

1. **Query Builder**: Fetch raw data to understand structure
2. **Filters**: Identify interesting values, add filters
3. **Aggregation**: Summarize filtered data
4. **Data Viewer**: Analyze results
5. **Export**: Take data for further analysis

### Workflow B: Quick Aggregation

1. **Aggregation**: Go straight to aggregation
2. **GROUP BY**: Select columns of interest
3. **Run**: Execute query
4. **Refine**: Add filters based on results
5. **Re-run**: Get refined summary

### Workflow C: Comparative Analysis

1. **Aggregation**: Set up base query
2. **Run**: Get baseline results
3. **Filters**: Add a filter (e.g., specific service line)
4. **Run**: Compare to baseline
5. **Filters**: Change filter value
6. **Run**: See different perspective

## 🚀 Pro Tips

### Tip 1: Start Broad, Then Narrow
- Begin with high-level aggregation
- Identify interesting patterns
- Add filters to drill deeper

### Tip 2: Use COUNT DISTINCT for Cardinality
```
COUNT(DISTINCT billing_provider_npi) → How many unique providers?
COUNT(DISTINCT patient_state) → How many states?
```

### Tip 3: Combine Demographics
```
GROUP BY: patient_age_bracket, patient_gender, patient_state
→ Multi-dimensional demographic analysis
```

### Tip 4: Filter Before Aggregating
- Filters apply BEFORE aggregation
- More efficient than filtering after
- Get precise results faster

### Tip 5: Use Aliases for Clarity
```
SUM(charge_total) as total_revenue
AVG(charge_total) as average_charge
COUNT(*) as claim_count
```

Makes results easier to read!

## ⚠️ Important Notes

1. **Filters Apply to All Queries**: Once set, filters affect both raw and aggregate queries
2. **Clear Filters**: Use "Clear All Filters" to reset
3. **Multiple Aggregations**: You can add multiple aggregate functions
4. **Performance**: Fewer GROUP BY columns = faster queries
5. **Limit Still Applies**: Aggregation results are still limited by row limit

## 🎯 Next Steps

Now that you understand aggregation and filtering:

1. **Experiment** with different GROUP BY combinations
2. **Test** various filter combinations
3. **Document** interesting patterns you find
4. **Design** UI components based on insights
5. **Implement** in your main application

---

**Happy Investigating! 🚀**

The tool is ready for advanced data exploration and analysis!

