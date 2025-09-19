import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Constants
const MONTHS_LOOKBACK = 12;
const CURRENT_DATE_FUNCTION = 'CURRENT_DATE()';

// Define available table names and their fields - Only volume_procedure
const CLAIMS_TABLES = {
  "volume_procedure": { 
    type: "volume", 
    fields: { 
      npiField: "billing_provider_npi", 
      nameField: "billing_provider_name",
      codeField: "code",
      payorGroupField: "payor_group",
      serviceLineField: "service_line_code",
      serviceLineDescField: "service_line_description",
      chargeField: "charge_total"
    } 
  }
};

// Define available perspectives and their fields - Only billing
const PROVIDER_PERSPECTIVES = {
  "billing": { 
    npiField: "billing_provider_npi", 
    nameField: "billing_provider_name" 
  }
};

// Main claims data endpoint with comprehensive filtering
router.post("/claims-data", async (req, res) => {
  try {
    console.log("🔍 Claims data request received:", JSON.stringify(req.body, null, 2));
    console.log("🔍 Aggregation from frontend:", req.body.aggregation);
    console.log("🔍 Original aggregation from frontend:", req.body.originalAggregation);
    
    const {
      npis,
      tableName,
      filters = {},
      aggregation = "provider",
      originalAggregation,
      limit = 100
    } = req.body;

    console.log("🔍 Parsed request data:", {
      npis: npis?.length || 0, 
      tableName,
      filters,
      aggregation,
      limit
    });

    // Validate inputs
    if (!npis || !Array.isArray(npis) || npis.length === 0) {
      console.log("❌ Validation failed: NPIs array is required and must not be empty");
      return res.status(400).json({
        success: false,
        message: "NPIs array is required and must not be empty"
      });
    }

    if (!CLAIMS_TABLES[tableName]) {
      console.log("❌ Validation failed: Invalid table name", tableName);
      return res.status(400).json({
        success: false,
        message: `Invalid table name. Available tables: ${Object.keys(CLAIMS_TABLES).join(', ')}`
      });
    }

    const tableInfo = CLAIMS_TABLES[tableName];
    const perspectiveFields = PROVIDER_PERSPECTIVES["billing"];
    
    console.log("🔍 Table info:", tableInfo);
    console.log("🔍 Perspective fields:", perspectiveFields);

    // Check cache
    const cacheKey = `claims-data-${tableName}-billing-${aggregation}-${JSON.stringify(filters)}-${npis.sort().join(',')}`;
    console.log("🔍 Cache key:", cacheKey);
    
    // Debug mode - just log more info
    if (req.body.debug === true) {
      console.log("🔍 DEBUG MODE: Request received");
    }
    
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Returning cached result");
      console.log("🔍 Cached aggregation:", aggregation);
      console.log("🔍 Cached filters:", filters);
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    // Build query based on aggregation type
    let query, params;

    console.log("🔍 Building query for aggregation:", aggregation);

    // Helper function to get charge calculation based on table type
    const getChargeCalculation = () => {
      return tableName === 'volume_procedure' ? 'SUM(COALESCE(c.charge_total, 0))' : '0';
    };

    // Helper function to build filter conditions
    const buildFilterConditions = (filters, filterParams) => {
      const filterConditions = [];
      
      if (filters.payorGroup) {
        filterConditions.push(`c.${tableInfo.fields.payorGroupField} = @payorGroup`);
        filterParams.payorGroup = filters.payorGroup;
      }
      
      if (filters.serviceLine) {
        filterConditions.push(`c.${tableInfo.fields.serviceLineField} = @serviceLine`);
        filterParams.serviceLine = filters.serviceLine;
      }
      
      // Breadcrumb drill-down filters
      if (filters.providerNpi) {
        filterConditions.push(`c.billing_provider_npi = @providerNpi`);
        filterParams.providerNpi = filters.providerNpi;
      }
      
      if (filters.performingProviderNpi) {
        filterConditions.push(`c.performing_provider_npi = @performingProviderNpi`);
        filterParams.performingProviderNpi = filters.performingProviderNpi;
      }
      
      if (filters.dateMonth) {
        filterConditions.push(`CAST(c.date__month_grain AS STRING) = @dateMonth`);
        filterParams.dateMonth = filters.dateMonth;
      }
      
      if (filters.state) {
        filterConditions.push(`c.billing_provider_state = @state`);
        filterParams.state = filters.state;
      }
      
      if (filters.county) {
        filterConditions.push(`c.billing_provider_county = @county`);
        filterParams.county = filters.county;
      }
      
      if (filters.patientGender) {
        filterConditions.push(`c.patient_gender = @patientGender`);
        filterParams.patientGender = filters.patientGender;
      }
      
      if (filters.patientAgeBracket) {
        filterConditions.push(`c.patient_age_bracket = @patientAgeBracket`);
        filterParams.patientAgeBracket = filters.patientAgeBracket;
      }
      
      // Add hierarchical filter conditions
      if (filters.serviceCategory) {
        filterConditions.push(`c.service_category_code = @serviceCategory`);
        filterParams.serviceCategory = filters.serviceCategory;
      }
      
      if (filters.subServiceLine) {
        filterConditions.push(`c.subservice_line_code = @subServiceLine`);
        filterParams.subServiceLine = filters.subServiceLine;
      }
      
      if (filters.placeOfService) {
        filterConditions.push(`c.place_of_service_code = @placeOfService`);
        filterParams.placeOfService = filters.placeOfService;
      }
      
      if (filters.siteOfCare) {
        filterConditions.push(`c.site_of_care_summary = @siteOfCare`);
        filterParams.siteOfCare = filters.siteOfCare;
      }
      
      if (filters.billFacilityType) {
        filterConditions.push(`c.bill_facility_type_code = @billFacilityType`);
        filterParams.billFacilityType = filters.billFacilityType;
      }
      
             if (filters.billClassificationType) {
         if (filters.billClassificationDescription) {
           // Use both code and description for more precise filtering when duplicates exist
           filterConditions.push(`c.bill_classification_type_code = @billClassificationType AND c.bill_classification_type = @billClassificationDescription`);
           filterParams.billClassificationType = filters.billClassificationType;
           filterParams.billClassificationDescription = filters.billClassificationDescription;
         } else {
           // Fallback to code-only filtering
           filterConditions.push(`c.bill_classification_type_code = @billClassificationType`);
           filterParams.billClassificationType = filters.billClassificationType;
         }
       }
       
       // Patient geographic filters
       if (filters.patientZip3) {
         filterConditions.push(`c.patient_zip3 = @patientZip3`);
         filterParams.patientZip3 = filters.patientZip3;
       }
       
       if (filters.patientState) {
         filterConditions.push(`c.patient_state = @patientState`);
         filterParams.patientState = filters.patientState;
       }
       
       if (filters.patientUsRegion) {
         filterConditions.push(`c.patient_us_region = @patientUsRegion`);
         filterParams.patientUsRegion = filters.patientUsRegion;
       }
       
       if (filters.patientUsDivision) {
         filterConditions.push(`c.patient_us_division = @patientUsDivision`);
         filterParams.patientUsDivision = filters.patientUsDivision;
       }
       
       // Claim and DRG filters
       if (filters.claimType) {
         filterConditions.push(`c.claim_type_code = @claimType`);
         filterParams.claimType = filters.claimType;
       }
       
       if (filters.drgCode) {
         filterConditions.push(`c.drg_code = @drgCode`);
         filterParams.drgCode = filters.drgCode;
       }
       
       if (filters.drgMdc) {
         filterConditions.push(`c.drg_mdc = @drgMdc`);
         filterParams.drgMdc = filters.drgMdc;
       }
       
       if (filters.drgMedSurg) {
         filterConditions.push(`c.drg_med_surg = @drgMedSurg`);
         filterParams.drgMedSurg = filters.drgMedSurg;
       }
       
       // Bill frequency type filter
       if (filters.billFrequencyType) {
         filterConditions.push(`c.bill_frequency_type_code = @billFrequencyType`);
         filterParams.billFrequencyType = filters.billFrequencyType;
       }
       
       // Procedure/diagnosis code filters
       if (filters.code) {
         filterConditions.push(`c.code = @code`);
         filterParams.code = filters.code;
       }
       
       if (filters.codeSystem) {
         filterConditions.push(`c.code_system = @codeSystem`);
         filterParams.codeSystem = filters.codeSystem;
       }
       
       if (filters.codeSummary) {
         filterConditions.push(`c.code_summary = @codeSummary`);
         filterParams.codeSummary = filters.codeSummary;
       }
       
       if (filters.isSurgery !== undefined) {
         filterConditions.push(`c.is_surgery = @isSurgery`);
         filterParams.isSurgery = filters.isSurgery;
       }
       
       // Revenue code filters
       if (filters.revenueCode) {
         filterConditions.push(`c.revenue_code = @revenueCode`);
         filterParams.revenueCode = filters.revenueCode;
       }
       
       if (filters.revenueCodeGroup) {
         filterConditions.push(`c.revenue_code_group = @revenueCodeGroup`);
         filterParams.revenueCodeGroup = filters.revenueCodeGroup;
       }
      
      return filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : '';
    };

    if (aggregation === "provider") {
      // Build filter conditions using helper function
      const filterParams = { npis, limit };
      const filterClause = buildFilterConditions(filters, filterParams);
      
      // Determine if we're looking at billing or performing providers based on the frontend aggregation
      const isPerformingProvider = originalAggregation === 'performing_provider';
      const providerFields = isPerformingProvider ? {
        npiField: "performing_provider_npi",
        nameField: "performing_provider_name"
      } : perspectiveFields;
      
      console.log("🔍 ===== PROVIDER AGGREGATION DEBUG =====");
      console.log("🔍 Request body aggregation:", req.body.aggregation);
      console.log("🔍 Is performing provider view:", isPerformingProvider);
      console.log("🔍 Provider fields:", providerFields);
      console.log("🔍 Applied filters:", filters);
      console.log("🔍 Filter clause:", filterClause);
      console.log("🔍 Filter params:", filterParams);
      console.log("🔍 Breadcrumb filters detected:", {
        providerNpi: filters.providerNpi,
        serviceLine: filters.serviceLine,
        dateMonth: filters.dateMonth,
        state: filters.state,
        county: filters.county
      });

      // First, get summary stats from ALL providers (no limit)
      const summaryQuery = `
        SELECT 
          SUM(c.count) as grand_total_claims,
          ${getChargeCalculation()} as grand_total_charges,
          COUNT(DISTINCT c.billing_provider_npi) as total_unique_billing_providers,
          COUNT(DISTINCT c.performing_provider_npi) as total_unique_performing_providers
        FROM \`aegis_access.${tableName}\` c
        WHERE c.billing_provider_npi IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
          ${filterClause}
      `;

      // Then, get detailed provider data (limited for display)
      const detailQuery = `
        SELECT 
          c.${isPerformingProvider ? 'performing_provider_npi' : 'billing_provider_npi'} as npi,
          c.${isPerformingProvider ? 'performing_provider_name' : 'billing_provider_name'} as provider_name,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.date__month_grain) as months_with_activity,
          ROUND(SUM(c.count) / COUNT(DISTINCT c.date__month_grain), 0) as avg_monthly_claims,
          MAX(c.date__month_grain) as last_activity_date,
          MAX(c.${isPerformingProvider ? 'performing_provider_taxonomy_classification' : 'billing_provider_taxonomy_classification'}) as taxonomy_classification,
          ${!isPerformingProvider ? 'MAX(c.billing_provider_city) as city,' : ''}
          ${!isPerformingProvider ? 'MAX(c.billing_provider_state) as state' : ''}
        FROM \`aegis_access.${tableName}\` c
        WHERE c.billing_provider_npi IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
          ${filterClause}
          ${isPerformingProvider ? 'AND c.performing_provider_npi IS NOT NULL' : ''}
        GROUP BY c.${isPerformingProvider ? 'performing_provider_npi' : 'billing_provider_npi'}, c.${isPerformingProvider ? 'performing_provider_name' : 'billing_provider_name'}
        ORDER BY total_claims DESC
        LIMIT @limit
      `;

      // Execute both queries
      console.log("🔍 ===== EXECUTING PROVIDER QUERIES =====");
      console.log("🔍 Summary query:", summaryQuery);
      console.log("🔍 Detail query:", detailQuery);
      console.log("🔍 Filter params:", filterParams);
      
      const [summaryResult, detailResult] = await Promise.all([
        vendorBigQueryClient.query({ query: summaryQuery, params: filterParams }),
        vendorBigQueryClient.query({ query: detailQuery, params: filterParams })
      ]);

      const summary = summaryResult[0][0];
      const rows = detailResult[0];

      // Add summary metadata to the response
      const resultWithSummary = {
        data: rows,
        summary: {
          grand_total_claims: summary.grand_total_claims,
          grand_total_charges: summary.grand_total_charges,
          total_unique_billing_providers: summary.total_unique_billing_providers,
          total_unique_performing_providers: summary.total_unique_performing_providers,
          displayed_records: rows.length
        }
      };

      console.log(`✅ Retrieved ${rows.length} records of claims data (showing top ${limit} of ${summary.total_unique_providers} total providers)`);
      console.log(`🔍 Summary stats:`, resultWithSummary.summary);
      console.log(`🔍 Is performing provider view:`, isPerformingProvider);
      console.log(`🔍 Sample data:`, rows.slice(0, 2));

      // Cache the result for 5 minutes
      cache.set(cacheKey, resultWithSummary, 300);

      res.json({
        success: true,
        data: resultWithSummary.data,
        summary: resultWithSummary.summary,
        metadata: {
          tableInfo: CLAIMS_TABLES[tableName],
          aggregation,
          filters,
          npisRequested: npis.length,
          recordsReturned: rows.length,
          cacheKey
        },
        timestamp: new Date().toISOString()
      });

      return; // Exit early since we handled the response
    } else if (aggregation === "service_line") {
      // Build filter conditions using helper function
      const filterParams = { npis, limit };
      const filterClause = buildFilterConditions(filters, filterParams);

      // First, get summary stats from ALL data (no limit)
      const summaryQuery = `
        SELECT 
          SUM(c.count) as grand_total_claims,
          ${getChargeCalculation()} as grand_total_charges,
          COUNT(DISTINCT c.billing_provider_npi) as total_unique_billing_providers,
          COUNT(DISTINCT c.performing_provider_npi) as total_unique_performing_providers
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
          ${filterClause}
      `;

      // Then, get detailed service line data (limited for display)
      const detailQuery = `
        SELECT 
          c.${tableInfo.fields.serviceLineField} as service_line_code,
          c.${tableInfo.fields.serviceLineDescField} as service_line_description,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.billing_provider_npi) as unique_billing_providers,
          COUNT(DISTINCT c.performing_provider_npi) as unique_performing_providers,
          COUNT(DISTINCT c.date__month_grain) as months_with_activity
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
          ${filterClause}
        GROUP BY c.${tableInfo.fields.serviceLineField}, c.${tableInfo.fields.serviceLineDescField}
        ORDER BY total_claims DESC
        LIMIT @limit
      `;

      // Execute both queries
      const [summaryResult, detailResult] = await Promise.all([
        vendorBigQueryClient.query({ query: summaryQuery, params: filterParams }),
        vendorBigQueryClient.query({ query: detailQuery, params: filterParams })
      ]);

      const summary = summaryResult[0][0];
      const rows = detailResult[0];

      // Add summary metadata to the response
      const resultWithSummary = {
        data: rows,
        summary: {
          grand_total_claims: summary.grand_total_claims,
          grand_total_charges: summary.grand_total_charges,
          total_unique_billing_providers: summary.total_unique_billing_providers,
          total_unique_performing_providers: summary.total_unique_performing_providers,
          displayed_records: rows.length
        }
      };

      console.log(`✅ Retrieved ${rows.length} records of service line data (showing top ${limit} of all service lines)`);
      console.log(`🔍 Summary stats:`, resultWithSummary.summary);

      // Cache the result for 5 minutes
      cache.set(cacheKey, resultWithSummary, 300);

      res.json({
        success: true,
        data: resultWithSummary.data,
        summary: resultWithSummary.summary,
        metadata: {
          tableInfo: CLAIMS_TABLES[tableName],
          aggregation,
          filters,
          npisRequested: npis.length,
          recordsReturned: rows.length,
          cacheKey
        },
        timestamp: new Date().toISOString()
      });

      return; // Exit early since we handled the response
    } else if (aggregation === "temporal") {
      // Build filter conditions using helper function
      const filterParams = { npis, limit };
      const filterClause = buildFilterConditions(filters, filterParams);

      // First, get summary stats from ALL data (no limit)
      const summaryQuery = `
        SELECT 
          SUM(c.count) as grand_total_claims,
          ${getChargeCalculation()} as grand_total_charges,
          COUNT(DISTINCT c.billing_provider_npi) as total_unique_billing_providers,
          COUNT(DISTINCT c.performing_provider_npi) as total_unique_performing_providers
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
          ${filterClause}
      `;

      // Then, get detailed temporal data (limited for display)
      const detailQuery = `
        SELECT 
          c.date__month_grain,
          CAST(c.date__month_grain AS STRING) as date_string,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.billing_provider_npi) as unique_billing_providers,
          COUNT(DISTINCT c.performing_provider_npi) as unique_performing_providers
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
          ${filterClause}
        GROUP BY c.date__month_grain
        ORDER BY c.date__month_grain DESC
        LIMIT @limit
      `;

      // Execute both queries
      const [summaryResult, detailResult] = await Promise.all([
        vendorBigQueryClient.query({ query: summaryQuery, params: filterParams }),
        vendorBigQueryClient.query({ query: detailQuery, params: filterParams })
      ]);

      const summary = summaryResult[0][0];
      const rows = detailResult[0];

      // Add summary metadata to the response
      const resultWithSummary = {
        data: rows,
        summary: {
          grand_total_claims: summary.grand_total_claims,
          grand_total_charges: summary.grand_total_charges,
          total_unique_billing_providers: summary.total_unique_billing_providers,
          total_unique_performing_providers: summary.total_unique_performing_providers,
          displayed_records: rows.length
        }
      };

      console.log(`✅ Retrieved ${rows.length} records of temporal data (showing top ${limit} of all time periods)`);
      console.log(`🔍 Summary stats:`, resultWithSummary.summary);

      // Cache the result for 5 minutes
      cache.set(cacheKey, resultWithSummary, 300);

      res.json({
        success: true,
        data: resultWithSummary.data,
        summary: resultWithSummary.summary,
        metadata: {
          tableInfo: CLAIMS_TABLES[tableName],
          aggregation,
          filters,
          npisRequested: npis.length,
          recordsReturned: rows.length,
          cacheKey
        },
        timestamp: new Date().toISOString()
      });

      return; // Exit early since we handled the response
    } else {
      console.log("❌ Invalid aggregation type:", aggregation);
      return res.status(400).json({
        success: false,
        message: `Invalid aggregation type. Available types: provider, service_line, temporal`
      });
    }
    
  } catch (error) {
    console.error("❌ Error fetching claims data:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        name: error.name
      }
    });
  }
});

// Get available filters for claims data
router.post("/claims-filters", async (req, res) => {
  try {
    console.log("🔍 Claims filters request received:", JSON.stringify(req.body, null, 2));
    
    const {
      npis,
      tableName
    } = req.body;

    console.log("🔍 Parsed filters request data:", {
      npis: npis?.length || 0, 
      tableName
    });
    
    // Validate inputs
    if (!npis || !Array.isArray(npis) || npis.length === 0) {
      console.log("❌ Validation failed: NPIs array is required and must not be empty");
      return res.status(400).json({
        success: false,
        message: "NPIs array is required and must not be empty"
      });
    }

    if (!CLAIMS_TABLES[tableName]) {
      console.log("❌ Validation failed: Invalid table name", tableName);
      return res.status(400).json({
        success: false,
        message: `Invalid table name. Available tables: ${Object.keys(CLAIMS_TABLES).join(', ')}`
      });
    }

    const tableInfo = CLAIMS_TABLES[tableName];
    const perspectiveFields = PROVIDER_PERSPECTIVES["billing"];
    
    console.log("🔍 Table info:", tableInfo);
    console.log("🔍 Perspective fields:", perspectiveFields);

    // Check cache
    const cacheKey = `claims-filters-${tableName}-billing-${npis.sort().join(',')}`;
    console.log("🔍 Cache key:", cacheKey);
    
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Returning cached filters result");
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    // Build queries to get available filter values
    const filters = {};

    // Get available payor groups
    const payorQuery = `
      SELECT DISTINCT ${tableInfo.fields.payorGroupField} as payor_group
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND ${tableInfo.fields.payorGroupField} IS NOT NULL
      ORDER BY ${tableInfo.fields.payorGroupField}
    `;

    // Get available service categories (top level)
    const serviceCategoryQuery = `
      SELECT DISTINCT 
        service_category_code as code,
        service_category_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND service_category_code IS NOT NULL
      ORDER BY service_category_description
    `;

    // Get available service lines with their parent category
    const serviceLineQuery = `
      SELECT DISTINCT 
        service_category_code as parent_code,
        service_category_description as parent_description,
        ${tableInfo.fields.serviceLineField} as service_line_code,
        ${tableInfo.fields.serviceLineDescField} as service_line_description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND ${tableInfo.fields.serviceLineField} IS NOT NULL
        AND service_category_code IS NOT NULL
      ORDER BY service_category_description, ${tableInfo.fields.serviceLineDescField}
    `;

    // Get available sub-service lines with their parent service line
    const subServiceLineQuery = `
      SELECT DISTINCT 
        service_category_code as grandparent_code,
        service_category_description as grandparent_description,
        ${tableInfo.fields.serviceLineField} as parent_code,
        ${tableInfo.fields.serviceLineDescField} as parent_description,
        subservice_line_code as code,
        subservice_line_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND subservice_line_code IS NOT NULL
        AND ${tableInfo.fields.serviceLineField} IS NOT NULL
        AND service_category_code IS NOT NULL
      ORDER BY service_category_description, ${tableInfo.fields.serviceLineDescField}, subservice_line_description
    `;

    // Get available codes with their full hierarchy
    const codeQuery = `
      SELECT DISTINCT 
        service_category_code as level1_code,
        service_category_description as level1_description,
        ${tableInfo.fields.serviceLineField} as level2_code,
        ${tableInfo.fields.serviceLineDescField} as level2_description,
        subservice_line_code as level3_code,
        subservice_line_description as level3_description,
        code as code,
        code_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND code IS NOT NULL
        AND code != ''
        AND code_description IS NOT NULL
        AND code_description != ''
        AND ${tableInfo.fields.serviceLineField} IS NOT NULL
        AND service_category_code IS NOT NULL
      ORDER BY service_category_description, ${tableInfo.fields.serviceLineDescField}, subservice_line_description, code_description
    `;

    // Get available places of service (only for volume_procedure)
    const placeOfServiceQuery = tableName === 'volume_procedure' ? `
      SELECT DISTINCT 
        place_of_service_code as code,
        place_of_service as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND place_of_service_code IS NOT NULL
        AND place_of_service IS NOT NULL
        AND place_of_service_code != ''
        AND place_of_service != ''
      ORDER BY place_of_service
    ` : null;

    // Get available sites of care (only for volume_procedure)
    const siteOfCareQuery = tableName === 'volume_procedure' ? `
      SELECT DISTINCT 
        site_of_care_summary as code,
        site_of_care_classification as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND site_of_care_summary IS NOT NULL
        AND site_of_care_classification IS NOT NULL
        AND site_of_care_summary != ''
        AND site_of_care_classification != ''
      ORDER BY site_of_care_classification
    ` : null;

    // Get available bill facility types
    const billFacilityTypeQuery = `
      SELECT DISTINCT 
        bill_facility_type_code as code,
        bill_facility_type as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND bill_facility_type_code IS NOT NULL
      ORDER BY bill_facility_type
    `;

    // Get available bill classification types
    const billClassificationTypeQuery = `
      SELECT DISTINCT 
        bill_classification_type_code as code,
        bill_classification_type as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND bill_classification_type_code IS NOT NULL
        AND bill_classification_type IS NOT NULL
        AND bill_classification_type_code != ''
        AND bill_classification_type != ''
      ORDER BY bill_classification_type
    `;

    // Get available patient demographics
    const patientGenderQuery = `
      SELECT DISTINCT patient_gender
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND patient_gender IS NOT NULL
      ORDER BY patient_gender
    `;

    const patientAgeQuery = `
      SELECT DISTINCT patient_age_bracket
        FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND patient_age_bracket IS NOT NULL
      ORDER BY patient_age_bracket
    `;

    // Get available patient geographic data (hierarchical)
    const patientUsRegionQuery = `
      SELECT DISTINCT patient_us_region
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND patient_us_region IS NOT NULL
        AND patient_us_region != ''
      ORDER BY patient_us_region
    `;

    const patientUsDivisionQuery = `
      SELECT DISTINCT 
        patient_us_region as parent_code,
        patient_us_division as code,
        patient_us_division as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND patient_us_division IS NOT NULL
        AND patient_us_division != ''
        AND patient_us_region IS NOT NULL
      ORDER BY patient_us_region, patient_us_division
    `;

    const patientStateQuery = `
      SELECT DISTINCT 
        patient_us_region as grandparent_code,
        patient_us_division as parent_code,
        patient_state as code,
        patient_state as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND patient_state IS NOT NULL
        AND patient_state != ''
        AND patient_us_division IS NOT NULL
        AND patient_us_region IS NOT NULL
      ORDER BY patient_us_region, patient_us_division, patient_state
    `;

    const patientZip3Query = `
      SELECT DISTINCT 
        patient_us_region as level1_code,
        patient_us_division as level2_code,
        patient_state as level3_code,
        patient_zip3 as code,
        patient_zip3 as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND patient_zip3 IS NOT NULL
        AND patient_zip3 != ''
        AND patient_state IS NOT NULL
        AND patient_us_division IS NOT NULL
        AND patient_us_region IS NOT NULL
      ORDER BY patient_us_region, patient_us_division, patient_state, patient_zip3
    `;

    // Get available claim and DRG data
    const claimTypeQuery = `
      SELECT DISTINCT claim_type_code
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND claim_type_code IS NOT NULL
        AND claim_type_code != ''
      ORDER BY claim_type_code
    `;

    // Get available DRG data (hierarchical)
    const drgMdcQuery = `
      SELECT DISTINCT 
        drg_mdc as code,
        drg_mdc_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND drg_mdc IS NOT NULL
        AND drg_mdc != ''
      ORDER BY drg_mdc_description
    `;

    const drgCodeQuery = `
      SELECT DISTINCT 
        drg_mdc as parent_code,
        drg_mdc_description as parent_description,
        drg_code as code,
        drg_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND drg_code IS NOT NULL
        AND drg_code != ''
        AND drg_mdc IS NOT NULL
      ORDER BY drg_mdc_description, drg_description
    `;

    const drgMedSurgQuery = `
      SELECT DISTINCT drg_med_surg
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND drg_med_surg IS NOT NULL
        AND drg_med_surg != ''
      ORDER BY drg_med_surg
    `;

    // Get available bill frequency types
    const billFrequencyTypeQuery = `
      SELECT DISTINCT 
        bill_frequency_type_code as code,
        bill_frequency_type as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND bill_frequency_type_code IS NOT NULL
        AND bill_frequency_type_code != ''
      ORDER BY bill_frequency_type
    `;

    // Get available procedure/diagnosis codes (non-hierarchical)
    const codeNonHierarchicalQuery = `
      SELECT DISTINCT 
        code as code,
        code_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND code IS NOT NULL
        AND code != ''
        AND code_description IS NOT NULL
        AND code_description != ''
      ORDER BY code_description
    `;

    const codeSystemQuery = `
      SELECT DISTINCT code_system
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND code_system IS NOT NULL
        AND code_system != ''
      ORDER BY code_system
    `;

    const codeSummaryQuery = `
      SELECT DISTINCT code_summary
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND code_summary IS NOT NULL
        AND code_summary != ''
      ORDER BY code_summary
    `;

    // Get available surgery flag
    const isSurgeryQuery = `
      SELECT DISTINCT is_surgery
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND is_surgery IS NOT NULL
      ORDER BY is_surgery
    `;

    // Get available revenue codes
    const revenueCodeQuery = `
      SELECT DISTINCT 
        revenue_code as code,
        revenue_code_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND revenue_code IS NOT NULL
        AND revenue_code != ''
        AND revenue_code_description IS NOT NULL
        AND revenue_code_description != ''
      ORDER BY revenue_code_description
    `;

    const revenueCodeGroupQuery = `
      SELECT DISTINCT revenue_code_group
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(${CURRENT_DATE_FUNCTION}, INTERVAL ${MONTHS_LOOKBACK} MONTH)
        AND revenue_code_group IS NOT NULL
        AND revenue_code_group != ''
      ORDER BY revenue_code_group
    `;

    // Get available date range
    const dateRangeQuery = `
        SELECT 
        MIN(date__month_grain) as earliest_date,
        MAX(date__month_grain) as latest_date
        FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
    `;

    const params = { npis };

    console.log("🔍 Executing filter queries...");

    // Execute all filter queries in parallel
    const queries = [
      vendorBigQueryClient.query({ query: payorQuery, params }),
      vendorBigQueryClient.query({ query: serviceLineQuery, params }),
      vendorBigQueryClient.query({ query: serviceCategoryQuery, params }),
      vendorBigQueryClient.query({ query: subServiceLineQuery, params }),
      vendorBigQueryClient.query({ query: codeQuery, params }),
      placeOfServiceQuery ? vendorBigQueryClient.query({ query: placeOfServiceQuery, params }) : Promise.resolve([[]]),
      siteOfCareQuery ? vendorBigQueryClient.query({ query: siteOfCareQuery, params }) : Promise.resolve([[]]),
      vendorBigQueryClient.query({ query: billFacilityTypeQuery, params }),
      vendorBigQueryClient.query({ query: billClassificationTypeQuery, params }),
      vendorBigQueryClient.query({ query: patientGenderQuery, params }),
      vendorBigQueryClient.query({ query: patientAgeQuery, params }),
      vendorBigQueryClient.query({ query: patientZip3Query, params }),
      vendorBigQueryClient.query({ query: patientStateQuery, params }),
      vendorBigQueryClient.query({ query: patientUsRegionQuery, params }),
      vendorBigQueryClient.query({ query: patientUsDivisionQuery, params }),
      vendorBigQueryClient.query({ query: claimTypeQuery, params }),
      vendorBigQueryClient.query({ query: drgCodeQuery, params }),
      vendorBigQueryClient.query({ query: drgMdcQuery, params }),
      vendorBigQueryClient.query({ query: drgMedSurgQuery, params }),
      vendorBigQueryClient.query({ query: billFrequencyTypeQuery, params }),
      vendorBigQueryClient.query({ query: codeNonHierarchicalQuery, params }),
      vendorBigQueryClient.query({ query: codeSystemQuery, params }),
      vendorBigQueryClient.query({ query: codeSummaryQuery, params }),
      vendorBigQueryClient.query({ query: isSurgeryQuery, params }),
      vendorBigQueryClient.query({ query: revenueCodeQuery, params }),
      vendorBigQueryClient.query({ query: revenueCodeGroupQuery, params }),
      vendorBigQueryClient.query({ query: dateRangeQuery, params })
    ];

    const [
      payorGroups, 
      serviceLines, 
      serviceCategories,
      subServiceLines,
      hierarchicalCodes,
      placeOfService,
      siteOfCare,
      billFacilityType,
      billClassificationType,
      patientGenders, 
      patientAges,
      patientZip3s,
      patientStates,
      patientUsRegions,
      patientUsDivisions,
      claimTypes,
      drgCodes,
      drgMdcs,
      drgMedSurgs,
      billFrequencyTypes,
      codes,
      codeSystems,
      codeSummaries,
      isSurgeries,
      revenueCodes,
      revenueCodeGroups,
      dateRange
    ] = await Promise.all(queries);

    // Extract the rows from each result
    filters.payorGroups = payorGroups[0].map(row => row.payor_group);
    
    // Service hierarchy data
    filters.serviceCategories = serviceCategories[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    
    filters.serviceLines = serviceLines[0].map(row => ({
      code: row.service_line_code,
      description: row.service_line_description,
      parentCode: row.parent_code,
      parentDescription: row.parent_description
    }));
    
    filters.subServiceLines = subServiceLines[0].map(row => ({
      code: row.code,
      description: row.description,
      parentCode: row.parent_code,
      parentDescription: row.parent_description,
      grandparentCode: row.grandparent_code,
      grandparentDescription: row.grandparent_description
    }));
    
    filters.codes = hierarchicalCodes[0].map(row => ({
      code: row.code,
      description: row.description,
      level1Code: row.level1_code,
      level1Description: row.level1_description,
      level2Code: row.level2_code,
      level2Description: row.level2_description,
      level3Code: row.level3_code,
      level3Description: row.level3_description
    }));
    
    filters.placeOfService = placeOfServiceQuery ? placeOfService[0].map(row => ({
      code: row.code,
      description: row.description
    })) : [];
    filters.siteOfCare = siteOfCareQuery ? siteOfCare[0].map(row => ({
      code: row.code,
      description: row.description
    })) : [];
    filters.billFacilityType = billFacilityType[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    filters.billClassificationType = billClassificationType[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    filters.patientGenders = patientGenders[0].map(row => row.patient_gender);
    filters.patientAgeBrackets = patientAges[0].map(row => row.patient_age_bracket);
    
    // Patient geographic hierarchy data
    filters.patientUsRegions = patientUsRegions[0].map(row => row.patient_us_region);
    
    filters.patientUsDivisions = patientUsDivisions[0].map(row => ({
      code: row.code,
      description: row.description,
      parentCode: row.parent_code
    }));
    
    filters.patientStates = patientStates[0].map(row => ({
      code: row.code,
      description: row.description,
      parentCode: row.parent_code,
      grandparentCode: row.grandparent_code
    }));
    
    filters.patientZip3s = patientZip3s[0].map(row => ({
      code: row.code,
      description: row.description,
      level1Code: row.level1_code,
      level2Code: row.level2_code,
      level3Code: row.level3_code
    }));
    
    // Claim and DRG hierarchy data
    filters.claimTypes = claimTypes[0].map(row => row.claim_type_code);
    
    filters.drgMdcs = drgMdcs[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    
    filters.drgCodes = drgCodes[0].map(row => ({
      code: row.code,
      description: row.description,
      parentCode: row.parent_code,
      parentDescription: row.parent_description
    }));
    
    filters.drgMedSurgs = drgMedSurgs[0].map(row => row.drg_med_surg);
    
    // Bill frequency types
    filters.billFrequencyTypes = billFrequencyTypes[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    
    // Procedure/diagnosis codes (non-hierarchical)
    filters.codeSystems = codeSystems[0].map(row => row.code_system);
    filters.codeSummaries = codeSummaries[0].map(row => row.code_summary);
    filters.isSurgeries = isSurgeries[0].map(row => row.is_surgery);
    
    // Revenue codes
    filters.revenueCodes = revenueCodes[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    filters.revenueCodeGroups = revenueCodeGroups[0].map(row => row.revenue_code_group);
    
    filters.dateRange = {
      earliest: dateRange[0][0].earliest_date,
      latest: dateRange[0][0].latest_date
    };

    console.log("✅ Retrieved filter data:", {
      payorGroups: filters.payorGroups.length,
      serviceLines: filters.serviceLines.length,
      serviceCategories: filters.serviceCategories.length,
      subServiceLines: filters.subServiceLines.length,
      placeOfService: filters.placeOfService.length,
      siteOfCare: filters.siteOfCare.length,
      billFacilityType: filters.billFacilityType.length,
      billClassificationType: filters.billClassificationType.length,
      patientGenders: filters.patientGenders.length,
      patientAgeBrackets: filters.patientAgeBrackets.length,
      patientZip3s: filters.patientZip3s.length,
      patientStates: filters.patientStates.length,
      patientUsRegions: filters.patientUsRegions.length,
      patientUsDivisions: filters.patientUsDivisions.length,
      claimTypes: filters.claimTypes.length,
      drgCodes: filters.drgCodes.length,
      drgMdcs: filters.drgMdcs.length,
      drgMedSurgs: filters.drgMedSurgs.length,
      billFrequencyTypes: filters.billFrequencyTypes.length,
      codes: filters.codes.length,
      codeSystems: filters.codeSystems.length,
      codeSummaries: filters.codeSummaries.length,
      isSurgeries: filters.isSurgeries.length,
      revenueCodes: filters.revenueCodes.length,
      revenueCodeGroups: filters.revenueCodeGroups.length,
      dateRange: filters.dateRange
    });

    // Debug: Log sample filter data
    if (filters.siteOfCare.length > 0) {
      console.log("🔍 Sample site of care filters:", filters.siteOfCare.slice(0, 5));
    }
    if (filters.billClassificationType.length > 0) {
      console.log("🔍 Sample bill classification filters:", filters.billClassificationType.slice(0, 5));
      // Check for duplicate codes
      const codes = filters.billClassificationType.map(f => f.code);
      const uniqueCodes = [...new Set(codes)];
      if (codes.length !== uniqueCodes.length) {
        console.log("⚠️ WARNING: Duplicate bill classification codes found!");
        const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
        console.log("Duplicate codes:", [...new Set(duplicates)]);
        filters.billClassificationType.forEach(f => {
          if (duplicates.includes(f.code)) {
            console.log(`Code ${f.code}: "${f.description}"`);
          }
        });
      }
    }

    // Cache the result for 5 minutes
    cache.set(cacheKey, filters, 300);
    
    res.json({
      success: true,
      data: filters,
      metadata: {
        tableInfo: CLAIMS_TABLES[tableName],
        npisRequested: npis.length,
        cacheKey
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching claims filters:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims filters",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        name: error.name
      }
    });
  }
});

export default router; 
