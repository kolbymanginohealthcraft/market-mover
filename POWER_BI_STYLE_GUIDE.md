# 📊 Power BI-Style Claims Data Explorer

## 🎯 Overview

A **simplified, Power BI-inspired interface** for exploring claims data. No tabs, no complexity—just drag fields and get instant summaries.

## 🚀 Access

Navigate to: **`/app/investigation/claims`**

## 💡 Core Concept

**Simple 3-Step Process:**
1. **Add Columns** - Group data by these fields (GROUP BY)
2. **Add Filters** - Narrow down to specific values (WHERE)
3. **Run Analysis** - Get SUM(count) and SUM(charge_total) automatically

## 🎨 Interface Layout

```
┌─────────────────────────────────────────────────────┐
│  Claims Data Explorer                               │
├──────────────┬──────────────────────────────────────┤
│              │  NPIs: [1234567890] [0987654321]    │
│ FIELDS       │                                      │
│              │  COLUMNS (GROUP BY):                 │
│ Provider     │  [Provider Name] [Service Line]      │
│  └─ Name     │                                      │
│  └─ State    │  FILTERS (WHERE):                    │
│  └─ City     │  Patient Age: [65-84]                │
│              │  Payor Group: [Medicare]             │
│ Service      │                                      │
│  └─ Line     │  [Run Analysis]                      │
│  └─ Code     │                                      │
│              ├──────────────────────────────────────┤
│ Patient      │  RESULTS:                            │
│  └─ Age      │                                      │
│  └─ Gender   │  Provider   | Service | Count | $   │
│  └─ State    │  ACCENTCARE | PT      | 1,234 | ... │
│              │  ...                                 │
│ Payor        │                                      │
│  └─ Group    │                                      │
└──────────────┴──────────────────────────────────────┘
```

## 🔧 How to Use

### Step 1: Add Columns

**Click column icon** next to any field in the left sidebar to add it to **Columns**.

Columns determine **how your data is grouped** (GROUP BY in SQL).

**Examples:**
- Add `Provider Name` → See one row per provider
- Add `Service Line` → See one row per service line  
- Add both → See one row per provider/service combination

### Step 2: Add Filters (Optional)

**Click filter icon** next to any field to add it to **Filters**.

Filters **narrow down your data** (WHERE in SQL).

**Examples:**
- Add `Payor Group` filter, select "Medicare" → Only Medicare claims
- Add `Patient Age` filter, select "65-84" → Only patients 65-84
- Add multiple filters → They combine with AND logic

### Step 3: Run Analysis

Click **"Run Analysis"** button.

**Results show:**
- Your selected columns
- **Total Count** (SUM of count field)
- **Total Charges** (SUM of charge_total field)

## 📋 Available Fields

### Provider Fields
- Provider Name
- Provider State  
- Provider City
- Provider Specialty

### Service Fields
- Service Line
- Sub-Service Line
- Procedure Code
- Procedure Description

### Patient Fields
- Patient Age
- Patient Gender
- Patient State

### Payor Fields
- Payor Group
- Coverage Type

### Location Fields
- Place of Service
- Site of Care
- Site of Care Detail

### Temporal Fields
- Month

## 💡 Example Queries

### Example 1: Provider Summary
**Goal:** See total volume and charges per provider

**Steps:**
1. Add Column: `Provider Name`
2. Click "Run Analysis"

**Result:**
```
Provider Name              | Total Count | Total Charges
---------------------------|-------------|---------------
ACCENTCARE MEDICAL GROUP   | 1,234      | $125,430
AUTUMN LAKE HEALTHCARE     | 567        | $67,890
```

### Example 2: Service Line Breakdown
**Goal:** See which service lines have the most volume

**Steps:**
1. Add Column: `Service Line`
2. Click "Run Analysis"

**Result:**
```
Service Line        | Total Count | Total Charges
--------------------|-------------|---------------
Physical Therapy    | 2,345      | $234,560
Surgery             | 1,234      | $567,890
```

### Example 3: Provider by Service Line
**Goal:** See service line breakdown for each provider

**Steps:**
1. Add Column: `Provider Name`
2. Add Column: `Service Line`
3. Click "Run Analysis"

**Result:**
```
Provider      | Service Line     | Total Count | Total Charges
--------------|------------------|-------------|---------------
ACCENTCARE    | Physical Therapy | 500        | $50,000
ACCENTCARE    | Surgery          | 200        | $75,000
AUTUMN LAKE   | Physical Therapy | 300        | $30,000
```

### Example 4: Filtered Analysis
**Goal:** See provider volumes for Medicare patients 65-84

**Steps:**
1. Add Filter: `Payor Group` → Select "Medicare"
2. Add Filter: `Patient Age` → Select "65-84"
3. Add Column: `Provider Name`
4. Click "Run Analysis"

**Result:** Provider totals filtered to Medicare patients 65-84 only

### Example 5: Geographic Analysis
**Goal:** Where are patients coming from?

**Steps:**
1. Add Column: `Patient State`
2. Add Filter: `Service Line` → Select "Physical Therapy"
3. Click "Run Analysis"

**Result:** Patient state distribution for PT services

### Example 6: Temporal Trends
**Goal:** How has volume changed monthly?

**Steps:**
1. Add Column: `Month`
2. Add Column: `Service Line` (optional)
3. Click "Run Analysis"

**Result:** Monthly trends, optionally broken down by service line

## 🎯 Common Patterns

### Pattern 1: Single Dimension Analysis
**Add 1 Column** → See totals grouped by that dimension
- By Provider
- By Service Line
- By Patient Age
- By Payor

### Pattern 2: Two-Dimensional Analysis  
**Add 2 Columns** → See breakdown across two dimensions
- Provider × Service Line
- Service Line × Patient Age
- Payor × Coverage Type
- Provider × Month

### Pattern 3: Filtered Analysis
**Add Filters + Columns** → Focus on specific subset
- Medicare patients only
- Specific service line only
- Specific age group only
- Specific state only

### Pattern 4: Hierarchical Analysis
**Add multiple related columns** → Drill down progressively
- Provider State → Provider City → Provider Name
- Service Line → Sub-Service Line
- Patient State (with Service Line filter)

## 🔥 Pro Tips

### Tip 1: Start Simple
Add one column first to understand the data, then add more complexity.

### Tip 2: Use Filters to Focus
Instead of viewing all data, add filters to narrow to interesting subsets.

### Tip 3: Combine Dimensions
Add 2-3 columns for multi-dimensional analysis (e.g., Provider × Service × Age).

### Tip 4: Export for Deep Analysis
Use "Export CSV" to take results into Excel/Sheets for pivot tables and charts.

### Tip 5: Iterate Quickly
The tool is instant—try different combinations rapidly to explore patterns.

### Tip 6: Filter Values Are Auto-Populated
When you add a filter, available values load automatically with counts.

### Tip 7: Remove and Re-Add
Fields can be easily removed and re-added—experiment freely!

## ⚡ Quick Reference

| Action | How To |
|--------|--------|
| **Add to Columns** | Click column icon (⊞) next to field |
| **Add to Filters** | Click filter icon (🔍) next to field |
| **Remove Column** | Click X on column chip |
| **Remove Filter** | Click X button on filter row |
| **Run Query** | Click "Run Analysis" button |
| **Export Data** | Click "Export CSV" button in results |
| **Add NPI** | Type in NPI box, press Enter |
| **Remove NPI** | Click X on NPI chip |

## 🎓 Learning Path

**Minute 1: First Query**
1. Add Column: `Provider Name`
2. Click "Run Analysis"
3. See results!

**Minute 5: Add Filter**
1. Add Filter: `Service Line`
2. Select a service line
3. Re-run analysis

**Minute 10: Multi-Dimensional**
1. Add 2-3 columns
2. Add 1-2 filters
3. See complex breakdown

**Minute 15: Expert**
1. Try all field combinations
2. Export results
3. Analyze in Excel

## 📊 What Gets Calculated

**Measures (Always Shown):**
- **Total Count** = SUM(count)
- **Total Charges** = SUM(charge_total)

These are **automatically calculated** for whatever columns and filters you select.

## 🔄 Typical Workflows

### Workflow 1: Explore
1. Start with one column
2. See what values exist
3. Add more columns to drill deeper

### Workflow 2: Analyze
1. Have a question in mind
2. Add relevant columns
3. Add filters to focus
4. Run and export

### Workflow 3: Compare
1. Run query with one filter value
2. Note the results
3. Change filter value
4. Compare results

## ⚠️ Important Notes

1. **At least 1 Column required** - You must select at least one column
2. **Filters are optional** - But they help focus results
3. **Results are always aggregated** - No raw data, only summaries
4. **Limit applies** - Default 100 rows, adjustable up to 1000
5. **Auto-sorted** - Results sorted by Total Count (descending)

## 🎉 Benefits of This Design

✅ **Simple** - No tabs to navigate  
✅ **Visual** - See your query configuration at a glance  
✅ **Fast** - Click and run, instant results  
✅ **Flexible** - Any field can be column or filter  
✅ **Focused** - Only SUM(count) and SUM(charge_total) - no complexity  
✅ **Power BI-like** - Familiar interface for BI tool users  

## 🚀 Get Started Now!

1. Navigate to `/app/investigation/claims`
2. Add a column (try `Service Line`)
3. Click "Run Analysis"
4. See instant results! ✨

---

**Simple. Fast. Powerful. Just like Power BI.** 📊

Explore your claims data with ease!

