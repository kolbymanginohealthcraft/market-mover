# Claims Data Tables Field Summary

This document provides a comprehensive overview of all available fields in the claims-related database tables used in the Market Mover application.

## Table Categories

### 1. Provider Information Tables
- **hco.csv** - Healthcare Organization provider data
- **hcp.csv** - Healthcare Professional provider data

### 2. Volume Analysis Tables
- **volume_diagnosis.csv** - Diagnosis code volume data
- **volume_procedure.csv** - Procedure code volume data
- **medicare_volume_diagnosis.csv** - Medicare-specific diagnosis volume data
- **medicare_volume_procedure.csv** - Medicare-specific procedure volume data

### 3. Pathways Analysis Tables
- **pathways_provider_overall.csv** - Overall provider pathways data
- **pathways_provider_diagnosis_code.csv** - Diagnosis-specific provider pathways
- **pathways_provider_procedure_code.csv** - Procedure-specific provider pathways
- **medicare_pathways_provider_overall.csv** - Medicare overall provider pathways
- **medicare_pathways_provider_diagnosis_code.csv** - Medicare diagnosis-specific pathways
- **medicare_pathways_provider_procedure_code.csv** - Medicare procedure-specific pathways

---

## 1. Healthcare Organization (HCO) Table

**File:** `hco.csv`

### Core Provider Fields
- `npi` - National Provider Identifier
- `replacement_npi` - Replacement NPI if applicable
- `employer_identification_number` - EIN
- `name` - Organization name
- `other_name` - Alternative name
- `alias` - Alias name
- `name_alias` - Name alias
- `practice_name` - Practice name
- `healthcare_organization_name` - Healthcare organization name

### Network & Affiliation Fields
- `is_in_network` - Boolean for network participation
- `affiliation` - Affiliation status
- `is_in_program_ipa` - IPA program participation
- `is_in_program_cin` - CIN program participation
- `is_in_program_pho` - PHO program participation
- `is_in_program_aco` - ACO program participation
- `is_in_program_mco` - MCO program participation
- `is_in_program_mso` - MSO program participation
- `is_in_program_ism` - ISM program participation

### Identifiers & Taxonomies
- `other_identifiers` - JSON array of other identifiers
- `taxonomies` - JSON array of taxonomy codes and classifications

### Address Information
- `addresses` - JSON array of address objects with:
  - `lat`, `long` - Coordinates
  - `line_1`, `line_2` - Street address
  - `city`, `state_or_province`, `zip` - Location
  - `county`, `country` - Geographic info
  - `phone_number_primary`, `phone_number_secondary`, `fax_number`
  - `type` - Address type (business_practice, business_mailing)

### Administrative Fields
- `nppes_last_update_date` - NPPES update date
- `npi_deactivation_reason` - Deactivation reason
- `npi_deactivation_date` - Deactivation date
- `npi_reactivation_date` - Reactivation date

### Authorized Official Information
- `authorized_official_title_or_position`
- `authorized_official_name_prefix`
- `authorized_official_first_name`
- `authorized_official_last_name`
- `authorized_official_middle_name`
- `authorized_official_name_suffix`
- `authorized_official_telephone_number`
- `authorized_official_credential`

### Organization Structure
- `is_organization_subpart` - Boolean for subpart status
- `parent_organization_legal_business_name`
- `parent_organization_tax_identification_number`
- `other_organization_name`
- `other_organization_name_type_code`

### Definitive Integration Fields
- `certification_date`
- `practice_state`
- `definitive_firm_type`
- `definitive_firm_type_full`
- `definitive_id`
- `definitive_name`
- `hospital_parent_id`
- `hospital_parent_name`
- `network_id`
- `network_name`
- `network_parent_id`
- `network_parent_name`
- `physician_group_parent_id`
- `physician_group_parent_name`

### Metadata
- `run_date` - Data processing date

---

## 2. Healthcare Professional (HCP) Table

**File:** `hcp.csv`

### Core Provider Fields
- `npi` - National Provider Identifier
- `name_first`, `name_last`, `name_middle` - Name components
- `title` - Professional title
- `name_suffix` - Name suffix
- `name_full_formatted` - Full formatted name
- `alias` - Alias name
- `name_alias` - Name alias
- `practice_name` - Practice name
- `healthcare_organization_name` - Healthcare organization name

### Network & Affiliation Fields
- `is_in_network` - Boolean for network participation
- `affiliation` - Affiliation status
- `is_in_program_ipa` - IPA program participation
- `is_in_program_cin` - CIN program participation
- `is_in_program_pho` - PHO program participation
- `is_in_program_aco` - ACO program participation
- `is_in_program_mco` - MCO program participation
- `is_in_program_mso` - MSO program participation
- `is_in_program_ism` - ISM program participation

### Professional Information
- `affiliations` - Professional affiliations
- `specialties` - JSON array of specialties
- `degrees` - Professional degrees
- `taxonomies` - JSON array of taxonomy codes and classifications
- `licenses` - JSON array of license information
- `referral_relationships` - JSON array of referral relationships
- `languages` - Languages spoken
- `certifications` - Professional certifications
- `birth_year` - Year of birth
- `gender` - Gender
- `primary_specialty` - Primary specialty
- `description` - Provider description

### Address Information
- `addresses` - JSON array of address objects (same structure as HCO)

### Identifiers & Insurance
- `other_identifiers` - JSON array of other identifiers
- `in_network_insurances` - In-network insurance information

### Administrative Fields
- `nppes_last_update_date` - NPPES update date
- `is_sole_proprietor` - Boolean for sole proprietor status
- `npi_deactivation_reason` - Deactivation reason
- `npi_deactivation_date` - Deactivation date
- `npi_reactivation_date` - Reactivation date
- `employer_identification_number` - EIN
- `post_nominal` - Post-nominal credentials

### Atlas Integration Fields
- `practice_state`
- `atlas_affiliation_primary_definitive_firm_type`
- `atlas_affiliation_primary_definitive_firm_type_full`
- `atlas_affiliation_primary_definitive_id`
- `atlas_affiliation_primary_definitive_name`
- `atlas_affiliation_primary_hospital_parent_id`
- `atlas_affiliation_primary_hospital_parent_name`
- `atlas_affiliation_primary_network_id`
- `atlas_affiliation_primary_network_name`
- `atlas_affiliation_primary_network_parent_id`
- `atlas_affiliation_primary_network_parent_name`
- `atlas_affiliation_primary_physician_group_parent_id`
- `atlas_affiliation_primary_physician_group_parent_name`

### Metadata
- `run_date` - Data processing date

---

## 3. Volume Analysis Tables

### Common Provider Fields (All Volume Tables)
Each volume table contains extensive provider information for multiple provider types:

#### Billing Provider Fields
- `billing_provider_npi` - Billing provider NPI
- `billing_provider_npi_type` - NPI type (1=Individual, 2=Organization)
- `billing_provider_name` - Provider name
- `billing_provider_zip`, `billing_provider_city`, `billing_provider_county`, `billing_provider_state`
- `billing_provider_cbsa`, `billing_provider_cbsa_name` - CBSA information
- `billing_provider_msa`, `billing_provider_msa_name` - MSA information
- `billing_provider_csa`, `billing_provider_csa_name` - CSA information
- `billing_provider_taxonomy_code`, `billing_provider_taxonomy_grouping`, `billing_provider_taxonomy_classification`, `billing_provider_taxonomy_specialization`, `billing_provider_taxonomy_consolidated_specialty`
- `billing_provider_primary_taxonomy_code`, `billing_provider_primary_taxonomy_grouping`, `billing_provider_primary_taxonomy_classification`, `billing_provider_primary_taxonomy_specialization`
- `billing_provider_is_in_network`, `billing_provider_affiliation`
- `billing_provider_name_alias`, `billing_provider_practice_name`, `billing_provider_healthcare_organization_name`

#### Facility Provider Fields
- `facility_provider_npi`, `facility_provider_npi_type`, `facility_provider_name`
- `facility_provider_zip`, `facility_provider_city`, `facility_provider_county`, `facility_provider_state`
- `facility_provider_cbsa`, `facility_provider_cbsa_name`
- `facility_provider_msa`, `facility_provider_msa_name`
- `facility_provider_csa`, `facility_provider_csa_name`
- `facility_provider_taxonomy_code`, `facility_provider_taxonomy_grouping`, `facility_provider_taxonomy_classification`, `facility_provider_taxonomy_specialization`, `facility_provider_taxonomy_consolidated_specialty`
- `facility_provider_primary_taxonomy_code`, `facility_provider_primary_taxonomy_grouping`, `facility_provider_primary_taxonomy_classification`, `facility_provider_primary_taxonomy_specialization`

#### Service Location Provider Fields
- `service_location_provider_npi`, `service_location_provider_npi_type`, `service_location_provider_name`
- `service_location_provider_zip`, `service_location_provider_city`, `service_location_provider_county`, `service_location_provider_state`
- `service_location_provider_cbsa`, `service_location_provider_cbsa_name`
- `service_location_provider_msa`, `service_location_provider_msa_name`
- `service_location_provider_csa`, `service_location_provider_csa_name`
- `service_location_provider_us_region`, `service_location_provider_us_division`
- `service_location_provider_taxonomy_code`, `service_location_provider_taxonomy_grouping`, `service_location_provider_taxonomy_classification`, `service_location_provider_taxonomy_specialization`, `service_location_provider_taxonomy_consolidated_specialty`
- `service_location_provider_primary_taxonomy_code`, `service_location_provider_primary_taxonomy_grouping`, `service_location_provider_primary_taxonomy_classification`, `service_location_provider_primary_taxonomy_specialization`
- `service_location_provider_is_in_network`, `service_location_provider_affiliation`
- `service_location_provider_name_alias`, `service_location_provider_practice_name`, `service_location_provider_healthcare_organization_name`
- `service_location_provider_service_area_region`, `service_location_provider_service_area_psa`, `service_location_provider_service_area_ssa`

#### Performing Provider Fields
- `performing_provider_npi`, `performing_provider_npi_type`, `performing_provider_name`
- `performing_provider_taxonomy_code`, `performing_provider_taxonomy_grouping`, `performing_provider_taxonomy_classification`, `performing_provider_taxonomy_specialization`, `performing_provider_taxonomy_consolidated_specialty`
- `performing_provider_primary_taxonomy_code`, `performing_provider_primary_taxonomy_grouping`, `performing_provider_primary_taxonomy_classification`, `performing_provider_primary_taxonomy_specialization`
- `performing_provider_is_in_network`, `performing_provider_affiliation`
- `performing_provider_name_alias`, `performing_provider_practice_name`, `performing_provider_healthcare_organization_name`

#### Patient Information
- `patient_zip3`, `patient_state`, `patient_us_region`, `patient_us_division`
- `patient_age_bracket`, `patient_gender`

#### Claim Information
- `claim_type_code` - Claim type (P=Professional, I=Institutional)
- `drg_code`, `drg_description`, `drg_mdc`, `drg_mdc_description`, `drg_med_surg`
- `bill_facility_type_code`, `bill_facility_type`
- `bill_classification_type_code`, `bill_classification_type`
- `bill_frequency_type_code`, `bill_frequency_type`

#### Coverage & Payor Information
- `type_of_coverage` - Coverage type
- `payor_group` - Payor group (Commercial, Medicare, Medicaid, etc.)

#### Service Classification
- `service_line_code`, `service_line_description`
- `subservice_line_code`, `subservice_line_description`
- `service_category_code`, `service_category_description`
- `custom_service_line_code`, `custom_service_line_description`
- `custom_subservice_line_code`, `custom_subservice_line_description`

#### Volume Metrics
- `count` - Claim count

### Volume Diagnosis Table Specific Fields
- `code` - Diagnosis code
- `code_formatted` - Formatted diagnosis code
- `code_system` - Code system (icd10cm)
- `code_summary` - Code summary
- `code_description` - Code description

### Volume Procedure Table Specific Fields
- `code` - Procedure code
- `code_formatted` - Formatted procedure code
- `code_system` - Code system (cpt, hcpcsii)
- `code_summary` - Code summary
- `code_description` - Code description
- `is_surgery` - Boolean for surgery indicator
- `revenue_code`, `revenue_code_group`, `revenue_code_description`
- `place_of_service_code`, `place_of_service`
- `charge_min`, `charge_max`, `charge_total`, `charge_geomean`

### Medicare Volume Tables
Medicare volume tables have identical field structures to their commercial counterparts but contain only Medicare claims data.

---

## 4. Pathways Analysis Tables

### Common Provider Fields (All Pathways Tables)
Pathways tables contain the same extensive provider information as volume tables, but with "outbound_" and "inbound_" prefixes to distinguish between referring and receiving providers.

#### Outbound Provider Fields (Referring Provider)
- `outbound_billing_provider_npi`, `outbound_billing_provider_npi_type`, `outbound_billing_provider_name`
- `outbound_billing_provider_zip`, `outbound_billing_provider_city`, `outbound_billing_provider_county`, `outbound_billing_provider_state`
- `outbound_billing_provider_cbsa`, `outbound_billing_provider_cbsa_name`
- `outbound_billing_provider_msa`, `outbound_billing_provider_msa_name`
- `outbound_billing_provider_csa`, `outbound_billing_provider_csa_name`
- `outbound_billing_provider_taxonomy_code`, `outbound_billing_provider_taxonomy_grouping`, `outbound_billing_provider_taxonomy_classification`, `outbound_billing_provider_taxonomy_specialization`, `outbound_billing_provider_taxonomy_consolidated_specialty`
- `outbound_billing_provider_is_in_network`, `outbound_billing_provider_affiliation`
- `outbound_billing_provider_name_alias`, `outbound_billing_provider_practice_name`, `outbound_billing_provider_healthcare_organization_name`

(Similar fields exist for `outbound_facility_provider_*`, `outbound_service_location_provider_*`, `outbound_performing_provider_*`)

#### Inbound Provider Fields (Receiving Provider)
- `inbound_billing_provider_npi`, `inbound_billing_provider_npi_type`, `inbound_billing_provider_name`
- `inbound_billing_provider_zip`, `inbound_billing_provider_city`, `inbound_billing_provider_county`, `inbound_billing_provider_state`
- `inbound_billing_provider_cbsa`, `inbound_billing_provider_cbsa_name`
- `inbound_billing_provider_msa`, `inbound_billing_provider_msa_name`
- `inbound_billing_provider_csa`, `inbound_billing_provider_csa_name`
- `inbound_billing_provider_taxonomy_code`, `inbound_billing_provider_taxonomy_grouping`, `inbound_billing_provider_taxonomy_classification`, `inbound_billing_provider_taxonomy_specialization`, `inbound_billing_provider_taxonomy_consolidated_specialty`
- `inbound_billing_provider_is_in_network`, `inbound_billing_provider_affiliation`
- `inbound_billing_provider_name_alias`, `inbound_billing_provider_practice_name`, `inbound_billing_provider_healthcare_organization_name`

(Similar fields exist for `inbound_facility_provider_*`, `inbound_service_location_provider_*`, `inbound_performing_provider_*`)

#### Patient Information
- `patient_state`, `patient_zip3`, `patient_gender`, `patient_age_bracket`

#### Pathways Metrics
- `service_scope` - Scope of service (overall, diagnosis_code, procedure_code)
- `count` - Total pathway count
- `outbound_count` - Outbound claim count
- `inbound_count` - Inbound claim count
- `lead_up_period_days_total`, `lead_up_period_days_min`, `lead_up_period_days_max`
- `charges_total` - Total charges

#### Explicit vs Implicit Pathways
- `explicit_count`, `explicit_outbound_count`, `explicit_inbound_count`
- `explicit_lead_up_period_days_total`, `explicit_lead_up_period_days_min`, `explicit_lead_up_period_days_max`
- `explicit_charges_total`
- `implicit_count`, `implicit_outbound_count`, `implicit_inbound_count`
- `implicit_lead_up_period_days_total`, `implicit_lead_up_period_days_min`, `implicit_lead_up_period_days_max`
- `implicit_charges_total`

### Pathways Provider Overall Table
- `outbound_claim_type_code` - Outbound claim type
- `inbound_type_of_coverage`, `inbound_payor_group`, `inbound_claim_type_code` - Inbound coverage and payor info

### Pathways Provider Diagnosis Code Table
- `inbound_code`, `inbound_code_formatted`, `inbound_code_system`, `inbound_code_summary`, `inbound_code_description`
- `inbound_service_category_code`, `inbound_service_category_description`
- `inbound_service_line_code`, `inbound_service_line_description`
- `inbound_subservice_line_code`, `inbound_subservice_line_description`
- `inbound_custom_service_line_code`, `inbound_custom_service_line_description`
- `inbound_custom_subservice_line_code`, `inbound_custom_subservice_line_description`
- `inbound_type_of_coverage`, `inbound_payor_group`, `inbound_claim_type_code`

### Pathways Provider Procedure Code Table
- `inbound_code`, `inbound_code_formatted`, `inbound_code_system`, `inbound_code_summary`, `inbound_code_description`
- `inbound_service_category_code`, `inbound_service_category_description`
- `inbound_service_line_code`, `inbound_service_line_description`
- `inbound_subservice_line_code`, `inbound_subservice_line_description`
- `inbound_custom_service_line_code`, `inbound_custom_service_line_description`
- `inbound_custom_subservice_line_code`, `inbound_custom_subservice_line_description`
- `inbound_type_of_coverage`, `inbound_payor_group`, `inbound_is_surgery`, `inbound_claim_type_code`

### Medicare Pathways Tables
Medicare pathways tables have identical field structures to their commercial counterparts but contain only Medicare claims data.

---

## Key Field Patterns

### Provider NPI Types
- `1` = Individual provider
- `2` = Organization provider

### Claim Types
- `P` = Professional claim
- `I` = Institutional claim

### Code Systems
- `icd10cm` = ICD-10-CM diagnosis codes
- `cpt` = CPT procedure codes
- `hcpcsii` = HCPCS Level II codes

### Coverage Types
- `Commercial`
- `Medicare`
- `Medicaid`
- `VA/TRICARE`
- `Other`

### Geographic Fields
- `cbsa` = Core Based Statistical Area
- `msa` = Metropolitan Statistical Area
- `csa` = Combined Statistical Area
- `us_region` = US Census region
- `us_division` = US Census division

### Taxonomy Structure
Each taxonomy field contains:
- `code` = Taxonomy code
- `grouping` = Provider grouping
- `classification` = Provider classification
- `specialization` = Provider specialization
- `consolidated_specialty` = Consolidated specialty category

---

## Performance Considerations

### High-Cardinality Fields
- `npi` - Primary identifier for providers
- `date__month_grain` - Time-based partitioning
- `code` - Diagnosis/procedure codes
- Geographic fields (`state`, `zip`, `cbsa`, etc.)

### Recommended Indexes
- Composite indexes on `(date__month_grain, billing_provider_npi)`
- Composite indexes on `(date__month_grain, code)` for volume tables
- Composite indexes on `(outbound_billing_provider_npi, inbound_billing_provider_npi)` for pathways tables
- Geographic indexes on `state`, `zip`, `cbsa` for location-based queries

### Query Optimization Strategies
- Use date range filters to limit data volume
- Leverage provider NPI for targeted provider analysis
- Use geographic filters for market analysis
- Consider aggregating high-cardinality fields for summary views
- Use code system filters to focus on specific code types
