# HCO and HCP Directory Table Columns

This document contains all columns from the tables used to populate the HCO and HCP directories.

Generated: 2025-10-31T14:12:08.697Z

---

## HCO Directory Table: `aegis_access.hco_flat`

**Total Columns:** 98

| Column Name | Data Type | Nullable |
|------------|-----------|----------|
| npi | STRING | YES |
| replacement_npi | STRING | YES |
| employer_identification_number | STRING | YES |
| name | STRING | YES |
| other_name | STRING | YES |
| alias | STRING | YES |
| name_alias | STRING | YES |
| practice_name | STRING | YES |
| healthcare_organization_name | STRING | YES |
| is_in_network | BOOL | YES |
| affiliation | STRING | YES |
| is_in_program_ipa | BOOL | YES |
| is_in_program_cin | BOOL | YES |
| is_in_program_pho | BOOL | YES |
| is_in_program_aco | BOOL | YES |
| is_in_program_mco | BOOL | YES |
| is_in_program_mso | BOOL | YES |
| is_in_program_ism | BOOL | YES |
| primary_other_identifier | STRING | YES |
| primary_other_identifier_type_code | STRING | YES |
| primary_other_identifier_state | STRING | YES |
| primary_other_identifier_issuer | STRING | YES |
| primary_other_identifier_sequence | INT64 | YES |
| primary_taxonomy_code | STRING | YES |
| primary_taxonomy_primary_switch | STRING | YES |
| primary_taxonomy_grouping | STRING | YES |
| primary_taxonomy_classification | STRING | YES |
| primary_taxonomy_specialization | STRING | YES |
| primary_taxonomy_group_code | STRING | YES |
| primary_taxonomy_group_detail | STRING | YES |
| primary_taxonomy_sequence | INT64 | YES |
| primary_taxonomy_license_number | STRING | YES |
| primary_taxonomy_license_state | STRING | YES |
| primary_taxonomy_consolidated_specialty | STRING | YES |
| primary_address_lat | FLOAT64 | YES |
| primary_address_long | FLOAT64 | YES |
| primary_address_line_1 | STRING | YES |
| primary_address_line_2 | STRING | YES |
| primary_address_city | STRING | YES |
| primary_address_state_or_province | STRING | YES |
| primary_address_zip | STRING | YES |
| primary_address_zip5 | STRING | YES |
| primary_address_name | STRING | YES |
| primary_address_county | STRING | YES |
| primary_address_country | STRING | YES |
| primary_address_phone_number_primary | STRING | YES |
| primary_address_phone_number_secondary | STRING | YES |
| primary_address_fax_number | STRING | YES |
| primary_address_type | STRING | YES |
| primary_address_raw | STRING | YES |
| primary_address_service_area_region | STRING | YES |
| primary_address_service_area_psa | STRING | YES |
| primary_address_service_area_ssa | STRING | YES |
| nppes_last_update_date | DATE | YES |
| npi_deactivation_reason | STRING | YES |
| npi_deactivation_date | DATE | YES |
| npi_reactivation_date | DATE | YES |
| authorized_official_title_or_position | STRING | YES |
| authorized_official_name_prefix | STRING | YES |
| authorized_official_first_name | STRING | YES |
| authorized_official_last_name | STRING | YES |
| authorized_official_middle_name | STRING | YES |
| authorized_official_name_suffix | STRING | YES |
| authorized_official_telephone_number | STRING | YES |
| is_organization_subpart | BOOL | YES |
| parent_organization_legal_business_name | STRING | YES |
| parent_organization_tax_identification_number | STRING | YES |
| other_organization_name | STRING | YES |
| other_organization_name_type_code | STRING | YES |
| authorized_official_credential | STRING | YES |
| certification_date | STRING | YES |
| practice_state | STRING | YES |
| definitive_firm_type | STRING | YES |
| definitive_firm_type_full | STRING | YES |
| definitive_id | INT64 | YES |
| definitive_name | STRING | YES |
| hospital_parent_id | INT64 | YES |
| hospital_parent_name | STRING | YES |
| network_id | INT64 | YES |
| network_name | STRING | YES |
| network_parent_id | INT64 | YES |
| network_parent_name | STRING | YES |
| physician_group_parent_id | INT64 | YES |
| physician_group_parent_name | STRING | YES |
| atlas_definitive_id | INT64 | YES |
| atlas_definitive_name | STRING | YES |
| atlas_definitive_firm_type | STRING | YES |
| atlas_definitive_firm_type_full | STRING | YES |
| atlas_hospital_parent_id | INT64 | YES |
| atlas_hospital_parent_name | STRING | YES |
| atlas_physician_group_parent_id | INT64 | YES |
| atlas_physician_group_parent_name | STRING | YES |
| atlas_network_id | INT64 | YES |
| atlas_network_name | STRING | YES |
| atlas_network_parent_id | INT64 | YES |
| atlas_network_parent_name | STRING | YES |
| atlas_definitive_id_primary_npi | BOOL | YES |
| run_date | DATE | YES |

---

## HCP Directory Table: `aegis_access.hcp_flat`

**Total Columns:** 83

| Column Name | Data Type | Nullable |
|------------|-----------|----------|
| npi | STRING | YES |
| name_first | STRING | YES |
| name_last | STRING | YES |
| name_middle | STRING | YES |
| title | STRING | YES |
| name_suffix | STRING | YES |
| name_full_formatted | STRING | YES |
| alias | STRING | YES |
| name_alias | STRING | YES |
| practice_name | STRING | YES |
| healthcare_organization_name | STRING | YES |
| is_in_network | BOOL | YES |
| affiliation | STRING | YES |
| is_in_program_ipa | BOOL | YES |
| is_in_program_cin | BOOL | YES |
| is_in_program_pho | BOOL | YES |
| is_in_program_aco | BOOL | YES |
| is_in_program_mco | BOOL | YES |
| is_in_program_mso | BOOL | YES |
| is_in_program_ism | BOOL | YES |
| primary_taxonomy_code | STRING | YES |
| primary_taxonomy_primary_switch | STRING | YES |
| primary_taxonomy_grouping | STRING | YES |
| primary_taxonomy_classification | STRING | YES |
| primary_taxonomy_specialization | STRING | YES |
| primary_taxonomy_group_code | STRING | YES |
| primary_taxonomy_group_detail | STRING | YES |
| primary_taxonomy_sequence | INT64 | YES |
| primary_taxonomy_license_number | STRING | YES |
| primary_taxonomy_license_state | STRING | YES |
| primary_taxonomy_consolidated_specialty | STRING | YES |
| primary_license_number | STRING | YES |
| primary_license_state | STRING | YES |
| primary_license_sequence | INT64 | YES |
| primary_address_lat | FLOAT64 | YES |
| primary_address_long | FLOAT64 | YES |
| primary_address_line_1 | STRING | YES |
| primary_address_line_2 | STRING | YES |
| primary_address_city | STRING | YES |
| primary_address_state_or_province | STRING | YES |
| primary_address_zip | STRING | YES |
| primary_address_zip5 | STRING | YES |
| primary_address_name | STRING | YES |
| primary_address_county | STRING | YES |
| primary_address_country | STRING | YES |
| primary_address_phone_number_primary | STRING | YES |
| primary_address_phone_number_secondary | STRING | YES |
| primary_address_fax_number | STRING | YES |
| primary_address_type | STRING | YES |
| primary_address_raw | STRING | YES |
| primary_address_service_area_region | STRING | YES |
| primary_address_service_area_psa | STRING | YES |
| primary_address_service_area_ssa | STRING | YES |
| birth_year | INT64 | YES |
| gender | STRING | YES |
| primary_specialty | STRING | YES |
| description | STRING | YES |
| primary_other_identifier | STRING | YES |
| primary_other_identifier_type_code | STRING | YES |
| primary_other_identifier_state | STRING | YES |
| primary_other_identifier_issuer | STRING | YES |
| primary_other_identifier_sequence | INT64 | YES |
| nppes_last_update_date | DATE | YES |
| is_sole_proprietor | BOOL | YES |
| npi_deactivation_reason | STRING | YES |
| npi_deactivation_date | DATE | YES |
| npi_reactivation_date | DATE | YES |
| employer_identification_number | STRING | YES |
| post_nominal | STRING | YES |
| practice_state | STRING | YES |
| atlas_affiliation_primary_definitive_firm_type | STRING | YES |
| atlas_affiliation_primary_definitive_firm_type_full | STRING | YES |
| atlas_affiliation_primary_definitive_id | INT64 | YES |
| atlas_affiliation_primary_definitive_name | STRING | YES |
| atlas_affiliation_primary_hospital_parent_id | INT64 | YES |
| atlas_affiliation_primary_hospital_parent_name | STRING | YES |
| atlas_affiliation_primary_network_id | INT64 | YES |
| atlas_affiliation_primary_network_name | STRING | YES |
| atlas_affiliation_primary_network_parent_id | INT64 | YES |
| atlas_affiliation_primary_network_parent_name | STRING | YES |
| atlas_affiliation_primary_physician_group_parent_id | INT64 | YES |
| atlas_affiliation_primary_physician_group_parent_name | STRING | YES |
| run_date | DATE | YES |
