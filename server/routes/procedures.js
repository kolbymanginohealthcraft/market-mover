import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import myBigQueryClient from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Get procedure volume data for the last 12 months (POST with NPI filtering)
router.post("/procedures-volume", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Fetching procedure volume data...", { npis: npis?.length || 0 });
    
    // Check cache first
    const cachedResult = cache.get("procedures-volume", { npis });
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
      // Filter by specific NPIs
      query = `
        WITH latest_date AS (
          SELECT MAX(date__month_grain) as max_date
          FROM \`aegis_access.volume_procedure\`
          WHERE billing_provider_npi IN UNNEST(@npis)
        )
        SELECT 
          date__month_grain,
          CAST(date__month_grain AS STRING) as date_string,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`, latest_date
        WHERE billing_provider_npi IN UNNEST(@npis)
          AND date__month_grain >= DATE_SUB(latest_date.max_date, INTERVAL 11 MONTH)
        GROUP BY date__month_grain
        ORDER BY date__month_grain DESC
        LIMIT 12
      `;
      params = { npis };
    } else {
      // No NPIs provided, get all data (fallback)
      query = `
        SELECT 
          date__month_grain,
          CAST(date__month_grain AS STRING) as date_string,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`
        GROUP BY date__month_grain
        ORDER BY date__month_grain DESC
        LIMIT 12
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} months of procedure volume data`);
    console.log(`🔍 Sample monthly data:`, rows.slice(0, 3));
    
    // Cache the result
    cache.set("procedures-volume", { npis }, rows);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      debug: {
        npisRequested: npis?.length || 0,
        monthsReturned: rows.length,
        dateFilter: "Last 12 months"
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure volume data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure volume data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get procedure volume data for the last 12 months (GET - backward compatibility)
router.get("/procedures-volume", async (req, res) => {
  try {
    console.log("🔍 Fetching procedure volume data (GET endpoint)...");
    
    const query = `
      SELECT 
        date__month_grain,
        CAST(date__month_grain AS STRING) as date_string,
        SUM(count) as total_count
      FROM \`aegis_access.volume_procedure\`
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 12
    `;
    
    const [rows] = await vendorBigQueryClient.query({ query });
    
    console.log(`✅ Retrieved ${rows.length} months of procedure volume data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure volume data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure volume data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get procedure data by provider
router.post("/procedures-by-provider", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Fetching procedure data by provider...", { npis: npis?.length || 0 });
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          billing_provider_npi,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`
        WHERE billing_provider_npi IN UNNEST(@npis)
          AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY billing_provider_npi
        ORDER BY total_count DESC
      `;
      params = { npis };
    } else {
      query = `
        SELECT 
          billing_provider_npi,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`
        GROUP BY billing_provider_npi
        ORDER BY total_count DESC
        LIMIT 20
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} providers of procedure data`);
    console.log(`🔍 NPIs with data:`, rows.map(r => r.billing_provider_npi));
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      debug: {
        npisRequested: npis?.length || 0,
        npisWithData: rows.length,
        dateFilter: "Last 12 months"
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure data by provider:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure data by provider",
      error: error.message
    });
  }
});

// Get procedure data by service line
router.post("/procedures-by-service-line", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Fetching procedure data by service line...", { npis: npis?.length || 0 });
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          service_line_description,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`
        WHERE billing_provider_npi IN UNNEST(@npis)
          AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY service_line_description
        ORDER BY total_count DESC
      `;
      params = { npis };
    } else {
      query = `
        SELECT 
          service_line_description,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`
        GROUP BY service_line_description
        ORDER BY total_count DESC
        LIMIT 20
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} service lines of procedure data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure data by service line:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure data by service line",
      error: error.message
    });
  }
});

// Get procedure reference codes with search and pagination
router.get("/procedures-reference", async (req, res) => {
  try {
    const { search = '', limit = 100, offset = 0, category = '', line = '', subservice = '', is_surgery = '' } = req.query;
    console.log("🔍 Fetching procedure reference codes...", { search, limit, offset, category, line, subservice, is_surgery });
    
    // Check cache first
    const cacheKey = `procedures-reference-${search}-${category}-${line}-${subservice}-${is_surgery}-${limit}-${offset}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Returning cached results");
      return res.json({
        success: true,
        data: cachedResult.data,
        pagination: cachedResult.pagination,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    // Build WHERE clause - optimized for BigQuery
    const whereConditions = [];
    let params = {};
    
    // Search filter
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim().toUpperCase();
      whereConditions.push(`(
        UPPER(code) LIKE @codeSearch
        OR UPPER(code_summary) LIKE @textSearch
        OR UPPER(service_line_description) LIKE @textSearch
        OR UPPER(code_description) LIKE @textSearch
      )`);
      params.codeSearch = `${searchTerm}%`;
      params.textSearch = `%${searchTerm}%`;
    }
    
    // Category filter
    if (category && category.trim().length > 0) {
      whereConditions.push('service_category_code = @category');
      params.category = category;
    }
    
    // Service line filter
    if (line && line.trim().length > 0) {
      whereConditions.push('service_line_code = @line');
      params.line = line;
    }
    
    // Subservice filter
    if (subservice && subservice.trim().length > 0) {
      whereConditions.push('subservice_line_code = @subservice');
      params.subservice = subservice;
    }
    
    // Is surgery filter
    if (is_surgery && is_surgery.trim().length > 0) {
      whereConditions.push('is_surgery = @is_surgery');
      params.is_surgery = is_surgery === 'true';
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Single optimized query with window function for count
    const query = `
      SELECT 
        *,
        COUNT(*) OVER() as total_count
      FROM \`aegis_access.reference_code_procedure\`
      ${whereClause}
      ORDER BY code
      LIMIT @limit
      OFFSET @offset
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { ...params, limit: parseInt(limit), offset: parseInt(offset) }
    });
    
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    
    // Remove total_count from each row
    const cleanRows = rows.map(row => {
      const { total_count, ...rest } = row;
      return rest;
    });
    
    console.log(`✅ Retrieved ${cleanRows.length} procedure codes (${totalCount} total) in single query`);
    
    const result = {
      data: cleanRows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + cleanRows.length) < totalCount
      }
    };
    
    // Cache the result for 5 minutes
    cache.set(cacheKey, result, 300000);
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure reference codes:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure reference codes",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get procedure hierarchy structure
router.get("/procedures-hierarchy", async (req, res) => {
  try {
    console.log("🔍 Fetching procedure hierarchy...");
    
    // Check cache first
    const cachedResult = cache.get("procedures-hierarchy");
    if (cachedResult) {
      console.log("✅ Returning cached hierarchy");
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    // Simplified query - just get distinct values
    const query = `
      SELECT DISTINCT
        service_category_code,
        service_category_description,
        service_line_code,
        service_line_description,
        subservice_line_code,
        subservice_line_description
      FROM \`aegis_access.reference_code_procedure\`
      WHERE service_category_code IS NOT NULL
        AND service_line_code IS NOT NULL
        AND subservice_line_code IS NOT NULL
      ORDER BY service_category_description, service_line_description, subservice_line_description
      LIMIT 10000
    `;
    
    console.log("📊 Executing hierarchy query...");
    
    const [rows] = await vendorBigQueryClient.query({ query });
    
    console.log(`✅ Retrieved ${rows.length} unique hierarchy combinations`);
    
    if (rows.length > 0) {
      console.log("📋 Sample row:", JSON.stringify(rows[0], null, 2));
    }
    
    // Cache for 1 hour (hierarchy doesn't change often)
    cache.set("procedures-hierarchy", rows, 3600000);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure hierarchy:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure hierarchy",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        errors: error.errors
      }
    });
  }
});

// Get procedure details for specific codes
router.post("/procedures-details", async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    console.log("🔍 Fetching procedure details for codes...", { count: codes.length });
    
    const query = `
      SELECT *
      FROM \`aegis_access.reference_code_procedure\`
      WHERE code IN UNNEST(@codes)
      ORDER BY code
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { codes }
    });
    
    console.log(`✅ Retrieved details for ${rows.length} procedure codes`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure details:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure details",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get procedure volume totals for specific codes (last 12 months)
router.post("/procedures-volume-by-code", async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    console.log("🔍 Fetching procedure volume for codes...", { count: codes.length });
    
    const query = `
      SELECT 
        code,
        SUM(count) as total_volume,
        AVG(charge_total) as avg_charge
      FROM \`aegis_access.volume_procedure\`
      WHERE code IN UNNEST(@codes)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY code
      ORDER BY total_volume DESC
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { codes }
    });
    
    console.log(`✅ Retrieved volume data for ${rows.length} procedure codes`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching procedure volume:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch procedure volume",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Test endpoint to verify reference_code_procedure table
router.get("/procedures-test-reference-table", async (req, res) => {
  try {
    console.log("🔍 Testing reference_code_procedure table...");
    
    // First, try to get the schema
    const schemaQuery = `
      SELECT column_name, data_type
      FROM \`aegis_access.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'reference_code_procedure'
      LIMIT 100
    `;
    
    let schemaResult;
    try {
      const [schemaRows] = await vendorBigQueryClient.query({ query: schemaQuery });
      schemaResult = { success: true, columns: schemaRows };
      console.log("✅ Schema query successful:", schemaRows);
    } catch (schemaError) {
      schemaResult = { success: false, error: schemaError.message };
      console.log("❌ Schema query failed:", schemaError.message);
    }
    
    // Try to get sample data
    const sampleQuery = `
      SELECT *
      FROM \`aegis_access.reference_code_procedure\`
      LIMIT 5
    `;
    
    let sampleResult;
    try {
      const [sampleRows] = await vendorBigQueryClient.query({ query: sampleQuery });
      sampleResult = { success: true, rows: sampleRows, count: sampleRows.length };
      console.log("✅ Sample query successful:", sampleRows.length, "rows");
    } catch (sampleError) {
      sampleResult = { success: false, error: sampleError.message };
      console.log("❌ Sample query failed:", sampleError.message);
    }
    
    res.json({
      success: true,
      schema: schemaResult,
      sample: sampleResult
    });
    
  } catch (error) {
    console.error("❌ Error testing reference table:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to test reference table",
      error: error.message
    });
  }
});

// Test endpoint to verify BigQuery clients
router.get("/procedures-test-clients", async (req, res) => {
  try {
    console.log("🔍 Testing BigQuery clients for procedures...");
    
    // Test vendor client
    const vendorTestQuery = `
      SELECT COUNT(*) as count
      FROM \`aegis_access.volume_procedure\`
      LIMIT 1
    `;
    
    let vendorTestResult;
    try {
      const [vendorRows] = await vendorBigQueryClient.query({ 
        query: vendorTestQuery
      });
      vendorTestResult = { success: true, count: vendorRows[0]?.count };
      console.log("✅ Vendor client test successful");
    } catch (vendorError) {
      vendorTestResult = { success: false, error: vendorError.message };
      console.log("❌ Vendor client test failed:", vendorError.message);
    }
    
    // Test my client
    const myTestQuery = `
      SELECT COUNT(*) as count
      FROM \`market-mover-464517.providers.org_dhc\`
      LIMIT 1
    `;
    
    let myTestResult;
    try {
      const [myRows] = await myBigQueryClient.query({ 
        query: myTestQuery
      });
      myTestResult = { success: true, count: myRows[0]?.count };
      console.log("✅ My client test successful");
    } catch (myError) {
      myTestResult = { success: false, error: myError.message };
      console.log("❌ My client test failed:", myError.message);
    }
    
    res.json({
      success: true,
      data: {
        vendorClient: vendorTestResult,
        myClient: myTestResult
      }
    });
    
  } catch (error) {
    console.error("❌ Error testing clients:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to test BigQuery clients",
      error: error.message
    });
  }
});

export default router; 