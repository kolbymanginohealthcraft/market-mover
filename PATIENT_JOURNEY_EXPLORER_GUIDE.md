# Patient Journey Explorer - User Guide

## Overview

The **Patient Journey Explorer** is a powerful tool for analyzing patient pathways through the healthcare system. It answers critical questions like:
- "Where do my patients come from before they reach me?"
- "Where do hospital discharge patients go after leaving the hospital?"
- "Which procedures at Hospital X lead to admissions at my SNF?"

**Access**: `/app/investigation/referral-pathways`

**Data Source**: `pathways_provider_procedure_code` (240 billion rows)

---

## Core Concept: Patient Pathways

### What is a Pathway?

A pathway represents a patient's journey between two healthcare encounters:

**OUTBOUND Provider** → [Time Gap] → **INBOUND Provider**

**Example**:
- Patient has hip replacement at Hospital X (OUTBOUND)
- 3 days later...
- Patient admitted to SNF Y for rehab (INBOUND)

This creates a pathway: Hospital X → SNF Y for hip replacement patients.

---

## How to Use

### Step 1: Build Your Initial Query

Think of this like the Claims Data Explorer - you're building a query to find specific pathways.

**Click fields in the sidebar** to add them to "Group By":
- Click a field → it's added to Group By
- Click again → it's removed

**Example**:
- Click "Billing Provider Name" (outbound)
- Click "Taxonomy Classification" (outbound)
- Click "Service Line Description" (inbound procedures)

This will group pathways by provider + procedure type.

### Step 2: Add Filters (Optional)

**Click the filter icon (🔍)** next to any field to add a filter:
- Tool will fetch available values from the data
- Select one or more values
- Only pathways matching those values will be included

**Example Filters**:
- `billing_provider_state` = "TX" (only Texas outbound providers)
- `service_line_description` = "Surgery" (only surgical procedures)
- `payor_group` = "Medicare" (only Medicare patients)

### Step 3: Run Query

**Click "Run Query"** button (bright teal)

**What happens**:
- Query executes against 240 billion rows
- Filters by:
  - Your selected filters
  - Last 12 months (default)
  - Lead time ≤ 14 days (default - quick pathways only)
- Groups by your selected fields
- Returns aggregated counts and charges

**Wait 10-30 seconds** for results.

### Step 4: Explore Pathways

Once you have results, two new buttons appear:

**🔼 Upstream** - "Where did these patients come from before?"
- Takes your current filters
- Shows the OUTBOUND providers (where patients originated)
- Use this when you're analyzing YOUR facility and want to know referral sources

**🔽 Downstream** - "Where did these patients go next?"
- Takes your current filters
- Shows the INBOUND providers (where patients went TO)
- Use this when you're analyzing a HOSPITAL and want to know where they discharge to

---

## Use Cases

### Use Case 1: Hospital Referral Analysis

**Question**: "Which hospitals send patients to my SNF?"

**Steps**:
1. Add filter: `billing_provider_npi` = [Your SNF NPI]
2. This filters to pathways ending AT your SNF
3. Group by: `billing_provider_name` (outbound)
4. Run Query
5. **Result**: List of hospitals that sent patients to you, ranked by volume

**Expected Output**:
```
billing_provider_name         | total_count | total_charges
Memorial Hospital             | 450         | $2,300,000
Community Hospital            | 180         | $890,000
Regional Medical Center       | 95          | $450,000
```

**Insight**: Focus marketing on Memorial (5X the volume of Regional).

---

### Use Case 2: Hospital Discharge Pattern Analysis

**Question**: "Where does Memorial Hospital discharge their hip replacement patients?"

**Steps**:
1. Add filter: `billing_provider_npi` = [Memorial Hospital NPI]
2. Add filter: `code` = "27130" (hip replacement code)
3. Group by: `billing_provider_name` (inbound - where they went)
4. Run Query
5. **Result**: SNFs/facilities receiving hip patients from Memorial

**Expected Output**:
```
billing_provider_name (inbound) | total_count | total_charges
Sunshine SNF                    | 85          | $890,000
Parkview Rehab                  | 62          | $670,000
Your SNF                        | 12          | $125,000
```

**Insight**: Memorial sends most hip patients to Sunshine. You're getting only 12. Opportunity to grow.

---

### Use Case 3: Service Line Pathway Exploration

**Question**: "For patients who have surgery, where do they go for rehab?"

**Steps**:
1. Add filter: `service_line_description` (inbound) = "Surgery"
2. Group by: `billing_provider_name` (inbound - the rehab facility)
3. Group by: `facility_provider_name` (outbound - the surgical facility)
4. Run Query
5. Click **Downstream** to see complete pathway

**Result**: Map of Surgery → Rehab pathways.

---

### Use Case 4: Geographic Referral Patterns

**Question**: "Do Texas hospitals refer to Texas SNFs or out of state?"

**Steps**:
1. Add filter: `facility_provider_state` (outbound) = "TX"
2. Group by: `facility_provider_state` (inbound)
3. Run Query

**Expected Output**:
```
facility_provider_state (inbound) | total_count
TX                                | 12,450
LA                                | 890
OK                                | 345
```

**Insight**: 94% stay in-state. Geographic proximity matters.

---

## Field Groups Explained

### **Temporal**
- `date__month_grain` - Month of the pathway

### **Outbound Billing Provider**
- Where the patient came FROM (first encounter)
- Usually: Hospitals, physician practices
- All standard provider fields (NPI, name, location, taxonomy)

### **Outbound Facility/Service Location/Performing**
- Different aspects of the outbound encounter
- Facility = the building
- Service Location = specific location within facility
- Performing = the actual physician/provider

### **Inbound Procedures**
- The procedure/service performed at the INBOUND encounter
- Includes: Code, description, service lines
- **Key**: This is what the patient received at the destination

### **Inbound Payor**
- Payor information for the INBOUND encounter
- Payor group, coverage type

### **Patient Demographics**
- Age, gender, geography
- Same for both directions (patient doesn't change)

---

## Understanding Upstream vs Downstream

### **Initial Query (Current)**
Your first query establishes the "current" perspective based on your filters.

**Example**:
- Filter: `billing_provider_npi` = [Your SNF]
- This means: "I'm looking at pathways ending AT my SNF"
- **Current direction**: INBOUND (you are the destination)

### **Upstream** 
Shows where patients came FROM before reaching your current filter.

**Example** (continuing from above):
- Current: Pathways ending at your SNF
- Click **Upstream**
- **Result**: Shows outbound providers (hospitals that referred to you)

### **Downstream**
Shows where patients went TO after your current filter.

**Example**:
- Filter: `billing_provider_npi` = [Hospital X]
- Current: Pathways starting AT Hospital X
- Click **Downstream**
- **Result**: Shows inbound providers (SNFs/facilities that received Hospital X discharges)

---

## Performance & Best Practices

### **Table Size**: 240 Billion Rows

This is an enormous table. To keep queries fast:

✅ **Always filter appropriately**:
- Default: Last 12 months only
- Default: Lead time ≤ 14 days
- Add provider filters (states, NPIs, taxonomies)

✅ **Use Group By (aggregation)**:
- Don't try to view raw data (too slow)
- Always group by at least one field
- Aggregation dramatically speeds up queries

✅ **Start small, then expand**:
- Begin with 1-2 group by fields
- Add more if needed
- Use limit wisely (default: 100)

❌ **Don't**:
- Query without filters (will timeout)
- Try to pull raw records (use aggregation)
- Remove the lead time filter (queries too broad)

### **Query Speed**

**Typical performance**:
- Well-filtered query: 10-20 seconds
- Broad query: 30-60 seconds
- Over-broad query: Timeout (>90 seconds)

**Tips for faster queries**:
- Add provider NPI filters
- Use taxonomy filters (reduce scope)
- Keep date range narrow (3-12 months)
- Limit results (50-100 rows)

---

## Default Filters

The tool applies these automatically:

1. **Lead Time ≤ 14 days**
   - Only pathways where patient moved quickly
   - Filters out unrelated encounters
   - Most post-acute transitions happen in 0-14 days

2. **Last 12 months**
   - Recent data only
   - Keeps queries fast
   - Reflects current referral patterns

**To override**: These will become user-configurable in future versions.

---

## Metrics Explained

### **total_count**
- Number of patient pathways
- Uses `inbound_count` from the table
- Represents actual patient movements

### **total_charges**
- Sum of charges for all pathways
- Dollar value of the pathway volume
- Use to prioritize high-value referral sources

### **avg_lead_days**
- Average days between outbound and inbound encounters
- Useful for understanding care transition timing
- Post-acute typically: 0-7 days

---

## Roadmap

### Coming Soon:
1. **Visual pathway diagrams** - Sankey charts showing patient flow
2. **Saved queries** - Save common analyses
3. **Alerts** - Email when pathway patterns change
4. **Procedure code search** - Easier procedure filtering
5. **DRG code integration** - Hospital discharge diagnosis context

---

## Troubleshooting

### Query takes > 60 seconds

**Cause**: Too broad a query (not enough filtering)

**Solution**:
- Add provider filters (state, taxonomy, NPI)
- Reduce date range (3-6 months instead of 12)
- Add more specific filters

---

### No results returned

**Causes**:
- Filters too restrictive (no matching data)
- Provider NPIs not in pathway table
- Lead time filter excluding all results

**Solutions**:
- Remove some filters
- Check that NPIs are correct
- Verify procedures exist in data

---

### "Please select at least one field to group by"

**Cause**: You clicked Run Query without selecting any Group By fields

**Solution**: Click at least one field in the sidebar to add to Group By

---

## Tips & Tricks

### Tip 1: Start with Provider Analysis
Group by outbound billing provider to see referral source overview.

### Tip 2: Layer on Service Lines
Add service line to group by to see which procedures drive referrals.

### Tip 3: Use Upstream/Downstream Iteratively
- Query hospital discharges
- Go downstream to see where patients went
- Pick interesting destination
- Filter to that destination
- Go upstream to see all sources

### Tip 4: Export for Deep Analysis
Run broad query, export CSV, analyze in Excel/Sheets with pivot tables.

### Tip 5: Compare Time Periods
- Run query for Q1 2024
- Export
- Run query for Q1 2023
- Export
- Compare to spot changes

---

## Summary

The **Patient Journey Explorer** transforms 240 billion pathway records into actionable intelligence about:
- **Referral sources** - Who sends you patients?
- **Discharge patterns** - Where do hospitals send patients?
- **Service line flows** - Which procedures lead to which facilities?
- **Geographic patterns** - Do patients cross state lines?
- **Payor dynamics** - Does payor type affect pathway destination?

**Key Feature**: Upstream/Downstream buttons let you follow the patient journey in either direction, starting from any point.

**Access**: `/app/investigation/referral-pathways`

---

*Built on the pathways_provider_procedure_code table with intelligent field mapping and direction-aware queries.*

