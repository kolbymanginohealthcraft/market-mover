# Vendor BigQuery Dataset Analysis
## Dataset: `populi-clients.aegis_access`

---

## Executive Summary

The `aegis_access` dataset contains **85 tables** with **MASSIVE scale** healthcare data:
- **40.8 BILLION** diagnosis claim records
- **7.1 MILLION** healthcare providers  
- **5.6 BILLION** referral pathway records (2025 YTD alone)
- **256,733** diagnosis codes
- **41,684** geographic locations

Data extends through **June 2025** for commercial claims and **December 2024** for Medicare data.

This is an enterprise-grade healthcare data warehouse with comprehensive provider directories, claims volume, referral pathways, benchmarking, and affiliation tracking capabilities at national scale.

---

## Data Availability

### Most Recent Data (per reference_metadata):
- **Commercial Claims**: Up to June 2025
- **Medicare Claims**: Up to December 2024
- **Provider Benchmarks**: Q1 2025 (March 2025)
- **Patient Journey Data**: 2024 (annual)

---

## Table Categories & Use Cases

### 1. **Provider Directories** (14 tables)
**Tables:**
- `hcp` / `hcp_base` / `hcp_flat` (Healthcare Practitioners)
- `hco` / `hco_base` / `hco_flat` (Healthcare Organizations)
- `hcx_base_flat` (Healthcare Extended)
- Various `*_flat` tables for addresses, taxonomies, affiliations, etc.

**Schema Highlights (hcp_flat - 83 fields):**
- Provider demographics (name, NPI, credentials)
- Addresses and locations
- Taxonomies and specialties
- Affiliations (IPA, CIN, PHO, ACO, MCO, MSO, ISM)
- In-network status
- Licenses, certifications, degrees
- Languages spoken
- Insurance networks
- Referral relationships

**Use Cases:**
- Provider directory and search
- Network adequacy analysis
- Provider credentialing verification
- Specialty mapping and coverage analysis
- Affiliation tracking (which providers work with which organizations)
- Geographic coverage mapping
- Insurance network participation analysis

---

### 2. **Claims Volume Analysis** (6 tables)
**Tables:**
- `volume_diagnosis` (135 fields)
- `volume_procedure` (147 fields)
- `medicare_volume_diagnosis` (135 fields)
- `medicare_volume_procedure` (147 fields)
- Plus `_lite` and `_oncology` variants

**Schema Highlights:**
- Monthly grain temporal data
- Billing, facility, service location, and performing provider details
- Patient demographics (age brackets, gender, ZIP3, state, region)
- Diagnosis codes (ICD) and procedure codes (CPT/HCPCS)
- Service line categorizations (service category, line, subservice line)
- Custom service line mappings
- Claim types, DRG codes, facility types
- Payor groups and coverage types
- Geographic breakdowns (CBSA, MSA, CSA)

**Use Cases:**
- Market share analysis by diagnosis/procedure
- Provider volume trending
- Patient origin analysis (where patients come from)
- Service line performance tracking
- Medicare vs. commercial volume comparison
- Seasonal/temporal pattern analysis
- Geographic market penetration
- Competitive intelligence (who's treating what, where, when)
- Payor mix analysis
- Facility utilization patterns

---

### 3. **Referral Pathways** (6 tables)
**Tables:**
- `pathways_provider_diagnosis_code` (226 fields)
- `pathways_provider_procedure_code` (227 fields)
- `pathways_provider_overall` (211 fields)
- Medicare equivalents

**Schema Highlights:**
- Outbound provider (referring)
- Inbound provider (receiving referral)
- Patient flow metrics
- Unique patient counts
- Claim counts by pathway
- Service categories
- Geographic relationships
- Day-of-week activity patterns

**Use Cases:**
- Referral network mapping ("who refers to whom")
- Leakage analysis (where patients go outside network)
- Referral pattern optimization
- Strategic partnership identification
- Provider relationship strength measurement
- Care coordination analysis
- Network design and optimization
- Physician liaison targeting
- Business development opportunity identification

---

### 4. **Provider Benchmarks** (28 tables)
**Tables organized by geography and service:**
- National benchmarks (7 tables)
- State benchmarks (7 tables)
- CBSA benchmarks (7 tables)
- Each broken down by:
  - Overall
  - Diagnosis service category/line/subservice
  - Procedure service category/line/subservice

**Schema Highlights (35 fields):**
- Quarterly grain
- Provider performance metrics
- Percentile rankings
- Volume and quality measures
- Comparative statistics by geography
- Service scope filtering

**Use Cases:**
- Provider performance evaluation
- Identify top performers vs. bottom performers
- Market positioning analysis
- Quality improvement targeting
- Competitive benchmarking
- Network tier assignment
- Value-based care program design
- Pay-for-performance program development
- Provider recruitment prioritization (find high performers to recruit)

---

### 5. **Provider Affiliations** (7 tables)
**Tables:**
- `affiliations_provider_overall`
- By diagnosis/procedure and service categories

**Schema Highlights (68 fields):**
- Service location provider (where care delivered)
- Performing provider (who delivered care)
- Claim counts and charges
- Patient counts
- Activity percentages and distributions
- Day-of-week patterns
- Change metrics (% change from prior period)

**Use Cases:**
- Understand which physicians work at which facilities
- Track provider affiliation changes over time
- Analyze facility-physician relationships
- Identify multi-location providers
- Facility utilization by physician
- Shift pattern analysis (day of week activity)
- Strategic alignment assessment (are key physicians affiliated with competitors?)

---

### 6. **Reference/Lookup Tables** (5 tables)
**Tables:**
- `reference_code_diagnosis` (11 fields)
- `reference_code_procedure` (12 fields)
- `reference_geography` (13 fields)
- `reference_metadata` (3 fields)
- `reference_licensed_workbooks` (7 fields)

**Content:**
- **Diagnosis codes**: ICD codes with descriptions and service line mappings
- **Procedure codes**: CPT/HCPCS codes with descriptions and service line mappings
- **Geography**: ZIP to CBSA/MSA/CSA/region/division mappings
- **Metadata**: Data freshness tracking by view
- **Licensed workbooks**: Access control and licensing info

**Use Cases:**
- Code lookup and translation
- Service line classification
- Geographic rollup and analysis
- Data quality validation
- User interface dropdowns and filters
- Report categorization

---

### 7. **Client Configuration** (5 tables)
**Tables:**
- `client_provider_relationship` (10 fields)
- `client_provider_alias` (4 fields)
- `client_custom_service_lines` (6 fields)
- `client_service_area_zip3` / `client_service_area_zip5` (14 fields each)

**Purpose:**
- Define which providers are "in-network" for Aegis
- Create custom provider names/aliases
- Define custom service line groupings
- Define service area boundaries

**Use Cases:**
- Network management
- Custom reporting aligned to business structure
- Service area definition for market analysis
- Provider branding consistency

---

### 8. **Patient Journey Tables** (mentioned in metadata, 30+ views)
**Tables include:**
- `volume_patient_*` variants
- `medicare_volume_patient_*` variants
- Annual grain (2024 data)

**Use Cases:**
- Patient-level longitudinal analysis
- Episode of care construction
- Care pathway mapping
- Cost per episode analysis
- Readmission analysis
- Patient attribution to providers

---

## Key Insights & Recommendations

### Data Freshness
✅ **Current Data**: Most recent commercial data is June 2025 (very recent!)
✅ **Medicare**: December 2024 (typical lag for CMS data)
⚠️ **Note**: Tables show 0 rows because they're likely **views** pointing to data elsewhere, or the actual data resides in a different location/project

### Architecture Notes
The dataset follows a **medallion architecture**:
- `*_base` tables: Raw provider data
- `*_flat` tables: Denormalized for analytics (ready to query)
- `*` tables: Filtered/enhanced versions

**⚠️ Note**: When querying from code, the initial table metadata shows 0 rows because these are **partitioned tables** or **external tables**. The actual data is accessible via SQL queries and is massive (40+ billion rows).

### Actual Data Sizes (Verified)

**Volume Tables:**
- `volume_diagnosis`: **40.8 BILLION rows** (likely 10+ TB)
  - 2025 YTD: 2.9 billion rows
- `volume_procedure`: Similar scale expected

**Pathway Tables:**
- `pathways_provider_overall`: **5.6 BILLION rows** (2025 YTD)
- Full dataset likely 20+ billion rows

**Provider Directories:**
- `hcp_flat`: **7.1 MILLION providers**
- Comprehensive provider universe

**Reference Tables:**
- `reference_code_diagnosis`: **256,733 codes**
- `reference_geography`: **41,684 locations**
- `reference_code_procedure`: Expected similar scale

### Strategic Opportunities

**1. Competitive Intelligence**
- Track competitor provider volumes and market share
- Identify high-performing providers to recruit
- Monitor referral pattern shifts

**2. Network Optimization**
- Fill gaps in provider coverage
- Strengthen weak referral relationships
- Reduce leakage to out-of-network providers

**3. Business Development**
- Identify high-volume referral sources
- Target physicians with desired patient populations
- Design service line growth strategies

**4. Value-Based Care**
- Risk-adjust benchmarks for quality programs
- Identify variation in care patterns
- Support population health initiatives

**5. Market Analytics**
- Geographic expansion planning
- Service line feasibility studies
- Patient origin/destination analysis
- Competitive positioning

---

## Verified Data Access ✅

### Sample Query Results

**Volume Diagnosis:**
- Total records: **40,815,995,180** rows
- 2025 YTD: **2,858,838,235** rows
- Sample fields confirmed: provider NPI, demographics, diagnoses, procedures, geography, service lines

**Referral Pathways:**
- 2025 YTD: **5,607,323,522** pathway records
- Tracks provider-to-provider referral patterns

**Provider Directory:**
- **7,168,147** healthcare providers
- Complete NPI, taxonomy, location, affiliation data

**Reference Tables:**
- **256,733** diagnosis codes with service line mappings
- **41,684** ZIP codes with CBSA/MSA/region mappings

### Example Query
```sql
SELECT 
  billing_provider_name,
  code_description,
  service_line_description,
  COUNT(*) as claim_count
FROM `populi-clients.aegis_access.volume_diagnosis`
WHERE date__month_grain >= '2025-01-01'
  AND service_location_provider_state = 'CA'
GROUP BY 1, 2, 3
ORDER BY claim_count DESC
LIMIT 100
```

### Sample Data Structure
```json
{
  "date__month_grain": "2019-01-01",
  "billing_provider_npi": "1003267196",
  "billing_provider_name": "SUTTER PACIFIC MEDICAL FOUNDATION",
  "patient_age_bracket": "65-84",
  "patient_gender": "Male",
  "code": "I10",
  "code_description": "Essential (primary) hypertension",
  "service_line_description": "Blood Pressure Disorders",
  "payor_group": "Commercial",
  "count": 1
}
```

---

## Technical Specifications

**Dataset**: `populi-clients.aegis_access`
**Total Tables**: 85
**Total Views with Data**: 82 (per reference_metadata)
**Project ID**: `populi-clients`
**Access Method**: Service account credentials
**Credential Location**: `server/credentials/vendor-access.json`

**Data Grain:**
- Volume tables: Monthly
- Pathway tables: Monthly
- Benchmark tables: Quarterly
- Patient tables: Annual
- Provider tables: Current snapshot

**Date Ranges:**
- Commercial: Through June 2025
- Medicare: Through December 2024
- Benchmarks: Through Q1 2025
- Patient: 2024 annual

---

## Summary

This dataset is a **comprehensive healthcare analytics platform** with enterprise-grade capabilities for:
- ✅ Provider network management and optimization
- ✅ Claims volume and market share analysis
- ✅ Referral pathway mapping and leakage prevention
- ✅ Competitive benchmarking
- ✅ Patient journey analytics
- ✅ Service line performance tracking
- ✅ Geographic market analysis

The schema design is sophisticated and production-ready. The tables are structured to support complex healthcare analytics use cases including network strategy, business development, competitive intelligence, and value-based care programs.

**Recommended Priority**: Begin leveraging this data immediately for volume and pathway analysis to gain competitive market insights.

---

## Practical Analysis Examples

### 1. Market Share by Geography
```sql
-- Top providers by volume in a specific market
SELECT 
  billing_provider_name,
  billing_provider_city,
  COUNT(*) as total_claims,
  COUNT(DISTINCT patient_zip3) as patient_reach
FROM `populi-clients.aegis_access.volume_diagnosis`
WHERE billing_provider_state = 'FL'
  AND date__month_grain >= '2025-01-01'
  AND service_category_code = 'MSK'  -- Musculoskeletal
GROUP BY 1, 2
ORDER BY total_claims DESC
LIMIT 50
```

### 2. Referral Leakage Analysis
```sql
-- Where are my providers sending patients?
SELECT 
  outbound_billing_provider_name,
  inbound_billing_provider_name,
  inbound_billing_provider_is_in_network,
  SUM(unique_patient_count) as patients_referred,
  SUM(claim_count) as total_claims
FROM `populi-clients.aegis_access.pathways_provider_overall`
WHERE outbound_billing_provider_is_in_network = true
  AND date__month_grain >= '2025-01-01'
GROUP BY 1, 2, 3
HAVING inbound_billing_provider_is_in_network = false
ORDER BY patients_referred DESC
```

### 3. Service Line Performance
```sql
-- Trending service lines over time
SELECT 
  DATE_TRUNC(date__month_grain, QUARTER) as quarter,
  service_line_description,
  COUNT(*) as claim_volume,
  COUNT(DISTINCT billing_provider_npi) as active_providers,
  COUNT(DISTINCT patient_zip3) as geographic_reach
FROM `populi-clients.aegis_access.volume_diagnosis`
WHERE service_location_provider_is_in_network = true
  AND date__month_grain >= '2024-01-01'
GROUP BY 1, 2
ORDER BY 1 DESC, claim_volume DESC
```

### 4. Provider Recruitment Targets
```sql
-- High-volume providers not in network
SELECT 
  p.npi,
  p.name_full_formatted,
  p.specialty,
  p.city,
  p.state,
  v.total_patient_volume,
  v.service_lines_covered
FROM `populi-clients.aegis_access.hcp_flat` p
JOIN (
  SELECT 
    billing_provider_npi,
    COUNT(DISTINCT patient_zip3) as total_patient_volume,
    COUNT(DISTINCT service_line_code) as service_lines_covered
  FROM `populi-clients.aegis_access.volume_diagnosis`
  WHERE date__month_grain >= '2024-01-01'
  GROUP BY 1
  HAVING total_patient_volume > 1000
) v ON p.npi = v.billing_provider_npi
WHERE p.is_in_network = false
  AND p.state = 'TX'
ORDER BY v.total_patient_volume DESC
```

### 5. Patient Journey Mapping
```sql
-- Trace patient flow through the care continuum
SELECT 
  service_category_description as care_setting,
  COUNT(*) as patient_encounters,
  AVG(unique_patient_count) as avg_patients_per_provider,
  ROUND(AVG(charges_total), 2) as avg_charges
FROM `populi-clients.aegis_access.affiliations_provider_overall`
WHERE date__quarter_grain = '2025-01-01'
  AND service_location_provider_is_in_network = true
GROUP BY 1
ORDER BY patient_encounters DESC
```

---

## Query Performance Tips

Given the massive scale (40+ billion rows):

1. **Always filter by date**: Use `date__month_grain >= '2025-01-01'` to limit scans
2. **Use partition filters**: Date fields are likely partitioned
3. **Limit geography**: Filter by state/CBSA to reduce data volume
4. **Aggregate early**: Use subqueries to aggregate before joining
5. **Use `_lite` tables**: Where available, these are optimized for faster queries
6. **Sample for exploration**: Use `TABLESAMPLE SYSTEM (1 PERCENT)` for initial exploration
7. **Monitor costs**: Each query can scan terabytes - use BigQuery cost controls

Example optimized query:
```sql
-- Good: Filtered and aggregated
SELECT service_line_code, COUNT(*) as cnt
FROM `populi-clients.aegis_access.volume_diagnosis`
WHERE date__month_grain = '2025-06-01'  -- Single month
  AND billing_provider_state = 'CA'     -- Single state
GROUP BY 1

-- Bad: Full table scan (expensive!)
SELECT * FROM `populi-clients.aegis_access.volume_diagnosis`
```

