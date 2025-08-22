import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import myBigQueryClient from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Helper function to determine table name based on claim type and data type
function getTableName(claimType, dataType) {
  if (claimType === "rendered") {
    return dataType === "diagnosis" ? "volume_diagnosis" : "volume_procedure";
  } else if (claimType === "referred") {
    if (dataType === "overall") return "pathways_provider_overall";
    if (dataType === "procedure") return "pathways_provider_procedure_code";
    if (dataType === "diagnosis") return "pathways_provider_diagnosis_code";
  }
  return null;
}

// Helper function to get field names based on table type
function getFieldNames(tableName) {
  if (tableName.startsWith("pathways")) {
    return {
      dateField: "date__month_grain",
      billingProviderField: "outbound_billing_provider_npi",
      performingProviderField: "outbound_performing_provider_npi",
      codeField: "inbound_code",
      payorGroupField: "inbound_payor_group",
      patientGenderField: "patient_gender",
      patientAgeBracketField: "patient_age_bracket",
      countField: "inbound_count",
      chargeField: "charges_total"
    };
  } else {
    return {
      dateField: "date__month_grain",
      billingProviderField: "billing_provider_npi",
      performingProviderField: "performing_provider_npi",
      codeField: "code",
      payorGroupField: "payor_group",
      patientGenderField: "patient_gender",
      patientAgeBracketField: "patient_age_bracket",
      countField: "count",
      chargeField: "charge_total"
    };
  }
}

// Get claims volume data for the last 12 months
router.post("/claims-volume", async (req, res) => {
  try {
    const { npis, claimType, dataType } = req.body;
    console.log("🔍 Fetching claims volume data...", { 
      npis: npis?.length || 0, 
      claimType, 
      dataType 
    });
    
    const tableName = getTableName(claimType, dataType);
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim type or data type combination"
      });
    }
    
    const fields = getFieldNames(tableName);
    
    // Check cache first
    const cacheKey = `claims-volume-${claimType}-${dataType}`;
    const cachedResult = cache.get(cacheKey, { npis });
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      // Filter by specific NPIs - get the most recent 12 months from available data
      query = `
        WITH latest_date AS (
          SELECT MAX(${fields.dateField}) as max_date
          FROM \`aegis_access.${tableName}\`
          WHERE ${fields.billingProviderField} IN UNNEST(@npis)
        )
        SELECT 
          ${fields.dateField},
          CAST(${fields.dateField} AS STRING) as date_string,
          SUM(${fields.countField}) as total_count
        FROM \`aegis_access.${tableName}\`, latest_date
        WHERE ${fields.billingProviderField} IN UNNEST(@npis)
          AND ${fields.dateField} >= DATE_SUB(latest_date.max_date, INTERVAL 11 MONTH)
        GROUP BY ${fields.dateField}
        ORDER BY ${fields.dateField} DESC
        LIMIT 12
      `;
      params = { npis };
    } else {
      // No NPIs provided, get all data (fallback) - get the most recent 12 months from available data
      query = `
        WITH latest_date AS (
          SELECT MAX(${fields.dateField}) as max_date
          FROM \`aegis_access.${tableName}\`
        )
        SELECT 
          ${fields.dateField},
          CAST(${fields.dateField} AS STRING) as date_string,
          SUM(${fields.countField}) as total_count
        FROM \`aegis_access.${tableName}\`, latest_date
        WHERE ${fields.dateField} >= DATE_SUB(latest_date.max_date, INTERVAL 11 MONTH)
        GROUP BY ${fields.dateField}
        ORDER BY ${fields.dateField} DESC
        LIMIT 12
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} months of claims volume data`);
    console.log(`🔍 Sample monthly data:`, rows.slice(0, 3));
    
    // Cache the result
    cache.set(cacheKey, { npis }, rows);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      debug: {
        npisRequested: npis?.length || 0,
        monthsReturned: rows.length,
        dateFilter: "Last 12 months",
        tableName,
        claimType,
        dataType
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching claims volume data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims volume data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get claims data by provider
router.post("/claims-by-provider", async (req, res) => {
  try {
    const { npis, claimType, dataType } = req.body;
    console.log("🔍 Fetching claims data by provider...", { 
      npis: npis?.length || 0, 
      claimType, 
      dataType 
    });
    
    const tableName = getTableName(claimType, dataType);
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim type or data type combination"
      });
    }
    
    const fields = getFieldNames(tableName);
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          ${fields.billingProviderField},
          SUM(${fields.countField}) as total_count
        FROM \`aegis_access.${tableName}\`
        WHERE ${fields.billingProviderField} IN UNNEST(@npis)
          AND ${fields.dateField} >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY ${fields.billingProviderField}
        ORDER BY total_count DESC
      `;
      params = { npis };
    } else {
      query = `
        SELECT 
          ${fields.billingProviderField},
          SUM(${fields.countField}) as total_count
        FROM \`aegis_access.${tableName}\`
        GROUP BY ${fields.billingProviderField}
        ORDER BY total_count DESC
        LIMIT 20
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} providers of claims data`);
    console.log(`🔍 NPIs with data:`, rows.map(r => r[fields.billingProviderField]));
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      debug: {
        npisRequested: npis?.length || 0,
        npisWithData: rows.length,
        dateFilter: "Last 12 months",
        tableName,
        claimType,
        dataType
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching claims data by provider:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims data by provider",
      error: error.message
    });
  }
});

// Get claims data by service line
router.post("/claims-by-service-line", async (req, res) => {
  try {
    const { npis, claimType, dataType } = req.body;
    console.log("🔍 Fetching claims data by service line...", { 
      npis: npis?.length || 0, 
      claimType, 
      dataType 
    });
    
    const tableName = getTableName(claimType, dataType);
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim type or data type combination"
      });
    }
    
    const fields = getFieldNames(tableName);
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          service_line_description,
          SUM(${fields.countField}) as total_count
        FROM \`aegis_access.${tableName}\`
        WHERE ${fields.billingProviderField} IN UNNEST(@npis)
          AND ${fields.dateField} >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY service_line_description
        ORDER BY total_count DESC
      `;
      params = { npis };
    } else {
      query = `
        SELECT 
          service_line_description,
          SUM(${fields.countField}) as total_count
        FROM \`aegis_access.${tableName}\`
        GROUP BY service_line_description
        ORDER BY total_count DESC
        LIMIT 20
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} service lines of claims data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      debug: {
        npisRequested: npis?.length || 0,
        serviceLinesReturned: rows.length,
        dateFilter: "Last 12 months",
        tableName,
        claimType,
        dataType
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching claims data by service line:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims data by service line",
      error: error.message
    });
  }
});

export default router; 