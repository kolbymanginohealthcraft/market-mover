# Claims Investigation Tool - Quick Reference Card

## 🔗 Access URL
```
/app/investigation/claims
```

## 📊 Column Groups (14 total, 130+ columns)

| # | Group Name | Columns | Key Fields |
|---|------------|---------|------------|
| 1 | Temporal | 1 | `date__month_grain` |
| 2 | Billing Provider | 27 | `billing_provider_npi`, `billing_provider_name`, `billing_provider_taxonomy_classification` |
| 3 | Facility Provider | 22 | `facility_provider_npi`, `facility_provider_name`, `facility_provider_state` |
| 4 | Service Location | 32 | `service_location_provider_npi`, `service_location_provider_city`, `service_location_provider_state` |
| 5 | Performing Provider | 17 | `performing_provider_npi`, `performing_provider_name`, `performing_provider_taxonomy_code` |
| 6 | Patient Demographics | 6 | `patient_age_bracket`, `patient_gender`, `patient_state`, `patient_zip3` |
| 7 | Claim Details | 6 | `claim_type_code`, `drg_code`, `drg_description` |
| 8 | Billing Details | 6 | `bill_facility_type`, `bill_classification_type`, `bill_frequency_type` |
| 9 | Site of Care | 2 | `site_of_care_summary`, `site_of_care_classification` |
| 10 | Payor Information | 2 | `type_of_coverage`, `payor_group` |
| 11 | Service Codes | 16 | `code`, `code_description`, `service_line_code`, `service_line_description` |
| 12 | Revenue Codes | 3 | `revenue_code`, `revenue_code_description` |
| 13 | Place of Service | 2 | `place_of_service_code`, `place_of_service` |
| 14 | Metrics & Charges | 5 | `count`, `charge_total`, `charge_min`, `charge_max`, `charge_geomean` |

## 🎯 Sample NPIs (Pre-loaded)
```
1316491004  - ACCENTCARE MEDICAL GROUP OF CONNECTICUT
1831593391  - AUTUMN LAKE HEALTHCARE AT NEW BRITAIN
1255444527  - Michelle L Purcaro
```

## 🔌 API Endpoints

### Get Raw Data
```
POST /api/investigation/raw-procedure-data
Body: { "npis": [...], "limit": 100, "columns": [...] }
```

### Get Distinct Values
```
POST /api/investigation/distinct-values
Body: { "npis": [...], "column": "field_name", "limit": 100 }
```

### Get Statistics
```
POST /api/investigation/table-stats
Body: { "npis": [...] }
```

### Get Sample
```
GET /api/investigation/sample-data?limit=10
```

## 🚀 Quick Start Workflow

1. **Navigate** → `/app/investigation/claims`
2. **Overview Tab** → Understand what's available
3. **Schema Tab** → Browse column groups
4. **Query Builder** → 
   - ✓ Use pre-loaded NPIs or add your own
   - ✓ Select columns (or leave empty for all)
   - ✓ Set limit (start with 50-100)
   - ✓ Click "Run Query"
5. **Data Viewer** → View results, export CSV

## 💡 Pro Tips

| Scenario | Recommended Approach |
|----------|---------------------|
| **First Time Use** | Start with Overview → Schema → Query Builder with 10 rows |
| **Exploring Fields** | Schema Tab → Expand groups of interest |
| **Testing Filters** | Select 5-10 relevant columns, 50 rows, multiple NPIs |
| **UI Design** | Query specific group, export CSV, analyze patterns |
| **Performance Test** | Start small (10 columns, 100 rows), increase gradually |
| **Data Quality Check** | Query all columns, 500 rows, look for NULLs |

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate tabs | Click tab headers |
| Add NPI | Type NPI, press Enter |
| Remove NPI | Click × on chip |
| Select all in group | Check group checkbox |
| Run query | Click "Run Query" button |
| Export data | Click "Export CSV" |

## 🎨 Common Use Cases

### 1. Design a Provider Filter
```
Columns: billing_provider_npi, billing_provider_name, 
         billing_provider_taxonomy_classification
Limit: 100
NPIs: Multiple test NPIs
Goal: See provider name formats, taxonomy values
```

### 2. Understand Charge Data
```
Columns: billing_provider_name, code, code_description,
         count, charge_total, charge_geomean
Limit: 50
NPIs: 1-2 test NPIs
Goal: Understand charge patterns and distributions
```

### 3. Build Service Line UI
```
Columns: service_line_code, service_line_description,
         subservice_line_code, subservice_line_description
Limit: 200
NPIs: Multiple test NPIs
Goal: See hierarchical structure, design drill-down UI
```

### 4. Patient Demographics Filter
```
Columns: patient_age_bracket, patient_gender, patient_state,
         patient_us_region, patient_us_division
Limit: 100
NPIs: Multiple test NPIs
Goal: Understand demographic breakdowns
```

### 5. Place of Service Analysis
```
Columns: place_of_service_code, place_of_service,
         site_of_care_summary, site_of_care_classification
Limit: 100
NPIs: Multiple test NPIs
Goal: Design location-based filters
```

## ⚠️ Common Pitfalls

| ❌ Don't | ✅ Do Instead |
|---------|--------------|
| Query all columns with 1000 rows | Start with 10-20 columns, 50-100 rows |
| Use production NPIs without testing | Use provided test NPIs first |
| Forget to check for NULLs | Always check NULL handling in results |
| Query without a plan | Know what you're investigating first |
| Skip the Schema tab | Always browse schema first |

## 🔍 Investigation Checklist

Before implementing a new feature:

- [ ] Browse schema to understand available fields
- [ ] Query sample data (50-100 rows)
- [ ] Check for NULL values
- [ ] Test with multiple NPIs
- [ ] Analyze data patterns
- [ ] Export for offline analysis
- [ ] Document findings
- [ ] Design UI based on real data
- [ ] Test query performance
- [ ] Plan filter hierarchies

## 📦 Export Formats

### CSV Export
- Automatic column headers
- NULL values preserved
- Comma escaping handled
- Quote escaping handled
- Ready for Excel/Google Sheets

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No data shown | Check NPIs are valid, reduce filters |
| Query timeout | Reduce columns or row limit |
| Export not working | Check popup blocker |
| Columns missing | Verify spelling in selection |
| Slow performance | Select fewer columns, lower limit |

## 📞 Need Help?

1. Check **INVESTIGATION_TOOL_GUIDE.md** for detailed workflows
2. Review **README.md** in `src/pages/Private/Investigation/`
3. See **CLAIMS_INVESTIGATION_SUMMARY.md** for implementation details
4. Check browser console for error messages
5. Review network tab in DevTools for API errors

---

## 🎯 Remember

This tool is for **investigation and design**, not production use.

**Explore → Understand → Design → Implement**

Happy investigating! 🚀

