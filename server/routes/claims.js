import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Define available table names and their fields
const CLAIMS_TABLES = {
  "volume_diagnosis": { 
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
  },
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

// Define available perspectives and their fields
const PROVIDER_PERSPECTIVES = {
  "billing": { 
    npiField: "billing_provider_npi", 
    nameField: "billing_provider_name" 
  },
  "performing": { 
    npiField: "performing_provider_npi", 
    nameField: "performing_provider_name" 
  }
};

// Main claims data endpoint with comprehensive filtering
router.post("/claims-data", async (req, res) => {
  try {
    console.log("🔍 Claims data request received:", JSON.stringify(req.body, null, 2));
    
    const {
      npis,
      tableName,
      perspective = "billing",
      filters = {},
      aggregation = "provider",
      limit = 100
    } = req.body;

    console.log("🔍 Parsed request data:", {
      npis: npis?.length || 0, 
      tableName,
      perspective,
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

    if (!PROVIDER_PERSPECTIVES[perspective]) {
      console.log("❌ Validation failed: Invalid perspective", perspective);
      return res.status(400).json({
        success: false,
        message: `Invalid perspective. Available perspectives: ${Object.keys(PROVIDER_PERSPECTIVES).join(', ')}`
      });
    }

    const tableInfo = CLAIMS_TABLES[tableName];
    const perspectiveFields = PROVIDER_PERSPECTIVES[perspective];
    
    console.log("🔍 Table info:", tableInfo);
    console.log("🔍 Perspective fields:", perspectiveFields);

    // Check cache
    const cacheKey = `claims-data-${tableName}-${perspective}-${aggregation}-${JSON.stringify(filters)}-${npis.sort().join(',')}`;
    console.log("🔍 Cache key:", cacheKey);
    
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Returning cached result");
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
        filterConditions.push(`c.bill_classification_type_code = @billClassificationType`);
        filterParams.billClassificationType = filters.billClassificationType;
      }
      
      return filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : '';
    };

    if (aggregation === "provider") {
      // Build filter conditions using helper function
      const filterParams = { npis, limit };
      const filterClause = buildFilterConditions(filters, filterParams);
      
      console.log("🔍 Applied filters:", filters);
      console.log("🔍 Filter clause:", filterClause);
      console.log("🔍 Filter params:", filterParams);

      // First, get summary stats from ALL providers (no limit)
      const summaryQuery = `
        SELECT 
          SUM(c.count) as grand_total_claims,
          ${getChargeCalculation()} as grand_total_charges,
          COUNT(DISTINCT c.${perspectiveFields.npiField}) as total_unique_providers
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          ${filterClause}
      `;

      // Then, get detailed provider data (limited for display)
      const detailQuery = `
        SELECT 
          c.${perspectiveFields.npiField} as npi,
          c.${perspectiveFields.nameField} as provider_name,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.date__month_grain) as months_with_activity,
          ROUND(SUM(c.count) / COUNT(DISTINCT c.date__month_grain), 0) as avg_monthly_claims,
          MAX(c.date__month_grain) as last_activity_date,
          MAX(CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_taxonomy_classification 
                   WHEN c.${perspectiveFields.npiField} = c.performing_provider_npi THEN c.performing_provider_taxonomy_classification
                   ELSE NULL END) as taxonomy_classification,
          MAX(CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_city 
                   ELSE NULL END) as city,
          MAX(CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_state 
                   ELSE NULL END) as state
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          ${filterClause}
        GROUP BY c.${perspectiveFields.npiField}, c.${perspectiveFields.nameField}
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
          total_unique_providers: summary.total_unique_providers,
          displayed_records: rows.length
        }
      };

      console.log(`✅ Retrieved ${rows.length} records of claims data (showing top ${limit} of ${summary.total_unique_providers} total providers)`);
      console.log(`🔍 Summary stats:`, resultWithSummary.summary);
      console.log(`🔍 Sample data:`, rows.slice(0, 2));

      // Cache the result for 5 minutes
      cache.set(cacheKey, resultWithSummary, 300);

      res.json({
        success: true,
        data: resultWithSummary.data,
        summary: resultWithSummary.summary,
        metadata: {
          tableInfo: CLAIMS_TABLES[tableName],
          perspective,
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
      // Build filter conditions
      const filterConditions = [];
      const filterParams = { npis, limit };
      
      if (filters.payorGroup) {
        filterConditions.push(`c.${tableInfo.fields.payorGroupField} = @payorGroup`);
        filterParams.payorGroup = filters.payorGroup;
      }
      
      if (filters.serviceLine) {
        filterConditions.push(`c.${tableInfo.fields.serviceLineField} = @serviceLine`);
        filterParams.serviceLine = filters.serviceLine;
      }
      
      if (filters.patientGender) {
        filterConditions.push(`c.patient_gender = @patientGender`);
        filterParams.patientGender = filters.patientGender;
      }
      
      if (filters.patientAgeBracket) {
        filterConditions.push(`c.patient_age_bracket = @patientAgeBracket`);
        filterParams.patientAgeBracket = filters.patientAgeBracket;
      }
      
      const filterClause = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : '';

      // Aggregate by service line
      query = `
        SELECT 
          c.${tableInfo.fields.serviceLineField} as service_line_code,
          c.${tableInfo.fields.serviceLineDescField} as service_line_description,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.${perspectiveFields.npiField}) as unique_providers,
          COUNT(DISTINCT c.date__month_grain) as months_with_activity
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          ${filterClause}
        GROUP BY c.${tableInfo.fields.serviceLineField}, c.${tableInfo.fields.serviceLineDescField}
        ORDER BY total_claims DESC
        LIMIT @limit
      `;
      params = filterParams;
    } else if (aggregation === "temporal") {
      // Build filter conditions
      const filterConditions = [];
      const filterParams = { npis, limit };
      
      if (filters.payorGroup) {
        filterConditions.push(`c.${tableInfo.fields.payorGroupField} = @payorGroup`);
        filterParams.payorGroup = filters.payorGroup;
      }
      
      if (filters.serviceLine) {
        filterConditions.push(`c.${tableInfo.fields.serviceLineField} = @serviceLine`);
        filterParams.serviceLine = filters.serviceLine;
      }
      
      if (filters.patientGender) {
        filterConditions.push(`c.patient_gender = @patientGender`);
        filterParams.patientGender = filters.patientGender;
      }
      
      if (filters.patientAgeBracket) {
        filterConditions.push(`c.patient_age_bracket = @patientAgeBracket`);
        filterParams.patientAgeBracket = filters.patientAgeBracket;
      }
      
      const filterClause = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : '';

      // Aggregate by time period
      query = `
        SELECT 
          c.date__month_grain,
          CAST(c.date__month_grain AS STRING) as date_string,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.${perspectiveFields.npiField}) as unique_providers
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          ${filterClause}
        GROUP BY c.date__month_grain
        ORDER BY c.date__month_grain DESC
        LIMIT @limit
      `;
      params = filterParams;
    } else if (aggregation === "geographic") {
      // Build filter conditions
      const filterConditions = [];
      const filterParams = { npis, limit };
      
      if (filters.payorGroup) {
        filterConditions.push(`c.${tableInfo.fields.payorGroupField} = @payorGroup`);
        filterParams.payorGroup = filters.payorGroup;
      }
      
      if (filters.serviceLine) {
        filterConditions.push(`c.${tableInfo.fields.serviceLineField} = @serviceLine`);
        filterParams.serviceLine = filters.serviceLine;
      }
      
      if (filters.patientGender) {
        filterConditions.push(`c.patient_gender = @patientGender`);
        filterParams.patientGender = filters.patientGender;
      }
      
      if (filters.patientAgeBracket) {
        filterConditions.push(`c.patient_age_bracket = @patientAgeBracket`);
        filterParams.patientAgeBracket = filters.patientAgeBracket;
      }
      
      const filterClause = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : '';

      // Aggregate by geographic location using embedded provider location data
      // Note: Only billing providers have location data, performing providers don't
      query = `
        SELECT 
          MAX(CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_state 
                   ELSE NULL END) as state,
          MAX(CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_county 
                   ELSE NULL END) as county,
          MAX(CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_cbsa_name 
                   ELSE NULL END) as cbsa_name,
          COUNT(DISTINCT c.${perspectiveFields.npiField}) as unique_providers,
          SUM(c.count) as total_claims,
          ${getChargeCalculation()} as total_charges,
          COUNT(DISTINCT c.date__month_grain) as months_with_activity,
          ROUND(SUM(c.count) / COUNT(DISTINCT c.date__month_grain), 0) as avg_monthly_claims
        FROM \`aegis_access.${tableName}\` c
        WHERE c.${perspectiveFields.npiField} IN UNNEST(@npis)
          AND c.date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
          ${filterClause}
        GROUP BY 
          CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_state 
               ELSE NULL END,
          CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_county 
               ELSE NULL END,
          CASE WHEN c.${perspectiveFields.npiField} = c.billing_provider_npi THEN c.billing_provider_cbsa_name 
               ELSE NULL END
        ORDER BY total_claims DESC
        LIMIT @limit
      `;
      params = filterParams;
    } else {
      console.log("❌ Invalid aggregation type:", aggregation);
      return res.status(400).json({
        success: false,
        message: `Invalid aggregation type. Available types: provider, service_line, temporal, geographic`
      });
    }

    console.log("🔍 Final query:", query);
    console.log("🔍 Query params:", params);

    console.log("🔍 About to execute BigQuery query...");
    const [rows] = await vendorBigQueryClient.query({ query, params });

    console.log(`✅ Retrieved ${rows.length} records of claims data`);
    console.log(`🔍 Sample data:`, rows.slice(0, 2));

    // Cache the result for 5 minutes
    cache.set(cacheKey, rows, 300);
    
    res.json({
      success: true,
      data: rows,
      metadata: {
        tableInfo: CLAIMS_TABLES[tableName],
        perspective,
        aggregation,
        filters,
        npisRequested: npis.length,
        recordsReturned: rows.length,
        cacheKey
      },
      timestamp: new Date().toISOString()
    });
    
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
      tableName,
      perspective = "billing"
    } = req.body;

    console.log("🔍 Parsed filters request data:", {
      npis: npis?.length || 0, 
      tableName,
      perspective
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

    if (!PROVIDER_PERSPECTIVES[perspective]) {
      console.log("❌ Validation failed: Invalid perspective", perspective);
      return res.status(400).json({
      success: false,
        message: `Invalid perspective. Available perspectives: ${Object.keys(PROVIDER_PERSPECTIVES).join(', ')}`
      });
    }

    const tableInfo = CLAIMS_TABLES[tableName];
    const perspectiveFields = PROVIDER_PERSPECTIVES[perspective];
    
    console.log("🔍 Table info:", tableInfo);
    console.log("🔍 Perspective fields:", perspectiveFields);

    // Check cache
    const cacheKey = `claims-filters-${tableName}-${perspective}-${npis.sort().join(',')}`;
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
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND ${tableInfo.fields.payorGroupField} IS NOT NULL
      ORDER BY ${tableInfo.fields.payorGroupField}
    `;

    // Get available service lines
    const serviceLineQuery = `
      SELECT DISTINCT 
        ${tableInfo.fields.serviceLineField} as service_line_code,
        ${tableInfo.fields.serviceLineDescField} as service_line_description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND ${tableInfo.fields.serviceLineField} IS NOT NULL
      ORDER BY ${tableInfo.fields.serviceLineDescField}
    `;

    // Get available service categories
    const serviceCategoryQuery = `
      SELECT DISTINCT 
        service_category_code as code,
        service_category_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND service_category_code IS NOT NULL
      ORDER BY service_category_description
    `;

    // Get available sub-service lines
    const subServiceLineQuery = `
      SELECT DISTINCT 
        subservice_line_code as code,
        subservice_line_description as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND subservice_line_code IS NOT NULL
      ORDER BY subservice_line_description
    `;

    // Get available places of service (only for volume_procedure)
    const placeOfServiceQuery = tableName === 'volume_procedure' ? `
      SELECT DISTINCT 
        place_of_service_code as code,
        place_of_service as description
      FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
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
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
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
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
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
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
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
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND patient_gender IS NOT NULL
      ORDER BY patient_gender
    `;

    const patientAgeQuery = `
      SELECT DISTINCT patient_age_bracket
        FROM \`aegis_access.${tableName}\`
      WHERE ${perspectiveFields.npiField} IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND patient_age_bracket IS NOT NULL
      ORDER BY patient_age_bracket
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
      placeOfServiceQuery ? vendorBigQueryClient.query({ query: placeOfServiceQuery, params }) : Promise.resolve([[]]),
      siteOfCareQuery ? vendorBigQueryClient.query({ query: siteOfCareQuery, params }) : Promise.resolve([[]]),
      vendorBigQueryClient.query({ query: billFacilityTypeQuery, params }),
      vendorBigQueryClient.query({ query: billClassificationTypeQuery, params }),
      vendorBigQueryClient.query({ query: patientGenderQuery, params }),
      vendorBigQueryClient.query({ query: patientAgeQuery, params }),
      vendorBigQueryClient.query({ query: dateRangeQuery, params })
    ];

    const [
      payorGroups, 
      serviceLines, 
      serviceCategories,
      subServiceLines,
      placeOfService,
      siteOfCare,
      billFacilityType,
      billClassificationType,
      patientGenders, 
      patientAges, 
      dateRange
    ] = await Promise.all(queries);

    // Extract the rows from each result
    filters.payorGroups = payorGroups[0].map(row => row.payor_group);
    filters.serviceLines = serviceLines[0].map(row => ({
      code: row.service_line_code,
      description: row.service_line_description
    }));
    filters.serviceCategories = serviceCategories[0].map(row => ({
      code: row.code,
      description: row.description
    }));
    filters.subServiceLines = subServiceLines[0].map(row => ({
      code: row.code,
      description: row.description
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
      dateRange: filters.dateRange
    });

    // Debug: Log sample filter data
    if (filters.siteOfCare.length > 0) {
      console.log("🔍 Sample site of care filters:", filters.siteOfCare.slice(0, 5));
    }
    if (filters.billClassificationType.length > 0) {
      console.log("🔍 Sample bill classification filters:", filters.billClassificationType.slice(0, 5));
    }

    // Cache the result for 5 minutes
    cache.set(cacheKey, filters, 300);
    
    res.json({
      success: true,
      data: filters,
      metadata: {
        tableInfo: CLAIMS_TABLES[tableName],
        perspective,
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
