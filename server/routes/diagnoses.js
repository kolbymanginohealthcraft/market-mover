import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import myBigQueryClient from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Get diagnosis volume data for the last 12 months (POST with NPI filtering)
router.post("/diagnoses-volume", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Fetching diagnosis volume data...", { npis: npis?.length || 0 });
    
    // Check cache first
    const cachedResult = cache.get("diagnoses-volume", { npis });
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    // Get the max_date from reference_metadata
    const metadataQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;
    
    const [metadataRows] = await vendorBigQueryClient.query({ query: metadataQuery });
    
    if (metadataRows.length === 0) {
      throw new Error('No metadata found for volume_diagnosis table');
    }
    
    const maxDate = metadataRows[0].max_date;
    console.log(`📅 Using max_date from metadata: ${maxDate}`);
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      // Filter by specific NPIs
      query = `
        SELECT 
          date__month_grain,
          CAST(date__month_grain AS STRING) as date_string,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
        WHERE billing_provider_npi IN UNNEST(@npis)
          AND date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
          AND date__month_grain <= @maxDate
        GROUP BY date__month_grain
        ORDER BY date__month_grain DESC
        LIMIT 12
      `;
      params = { npis, maxDate };
    } else {
      // No NPIs provided, get all data (fallback)
      query = `
        SELECT 
          date__month_grain,
          CAST(date__month_grain AS STRING) as date_string,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
        WHERE date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
          AND date__month_grain <= @maxDate
        GROUP BY date__month_grain
        ORDER BY date__month_grain DESC
        LIMIT 12
      `;
      params = { maxDate };
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });
    
    console.log(`✅ Retrieved ${rows.length} months of diagnosis volume data`);
    console.log(`🔍 Sample monthly data:`, rows.slice(0, 3));
    
    // Cache the result
    cache.set("diagnoses-volume", { npis }, rows);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      metadata: {
        maxDate: maxDate
      },
      debug: {
        npisRequested: npis?.length || 0,
        monthsReturned: rows.length,
        dateFilter: `Last 12 months (through ${maxDate})`
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis volume data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis volume data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get diagnosis volume data for the last 12 months (GET - backward compatibility)
router.get("/diagnoses-volume", async (req, res) => {
  try {
    console.log("🔍 Fetching diagnosis volume data (GET endpoint)...");
    
    // Get the max_date from reference_metadata
    const metadataQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;
    
    const [metadataRows] = await vendorBigQueryClient.query({ query: metadataQuery });
    
    if (metadataRows.length === 0) {
      throw new Error('No metadata found for volume_diagnosis table');
    }
    
    const maxDate = metadataRows[0].max_date;
    console.log(`📅 Using max_date from metadata: ${maxDate}`);
    
    const query = `
      SELECT 
        date__month_grain,
        CAST(date__month_grain AS STRING) as date_string,
        SUM(count) as total_count
      FROM \`aegis_access.volume_diagnosis\`
      WHERE date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
        AND date__month_grain <= @maxDate
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 12
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { maxDate }
    });
    
    console.log(`✅ Retrieved ${rows.length} months of diagnosis volume data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      metadata: {
        maxDate: maxDate
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis volume data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis volume data",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Diagnostic endpoint to check what data is available
router.get("/diagnoses-debug", async (req, res) => {
  try {
    console.log("🔍 Running diagnostic query for diagnosis data...");
    
    const query = `
      SELECT 
        MIN(date__month_grain) as earliest_month,
        MAX(date__month_grain) as latest_month,
        COUNT(DISTINCT date__month_grain) as total_months,
        SUM(count) as total_diagnoses
      FROM \`aegis_access.volume_diagnosis\`
    `;
    
    const [summaryRows] = await vendorBigQueryClient.query({ query });
    const summary = summaryRows[0];
    
    // Also get the last 20 months to see the pattern
    const recentQuery = `
      SELECT 
        date__month_grain,
        CAST(date__month_grain AS STRING) as date_string,
        SUM(count) as total_count
      FROM \`aegis_access.volume_diagnosis\`
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 20
    `;
    
    const [recentRows] = await vendorBigQueryClient.query({ query: recentQuery });
    
    console.log("📊 Diagnostic results:", summary);
    console.log("📅 Recent months:", recentRows.map(r => r.date_string));
    
    res.json({
      success: true,
      summary: summary,
      recent_months: recentRows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error running diagnostic query:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to run diagnostic query",
      error: error.message
    });
  }
});

// Get diagnosis data by provider
router.post("/diagnoses-by-provider", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Fetching diagnosis data by provider...", { npis: npis?.length || 0 });
    
    // Get the max_date from reference_metadata
    const metadataQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;
    
    const [metadataRows] = await vendorBigQueryClient.query({ query: metadataQuery });
    
    if (metadataRows.length === 0) {
      throw new Error('No metadata found for volume_diagnosis table');
    }
    
    const maxDate = metadataRows[0].max_date;
    console.log(`📅 Using max_date from metadata: ${maxDate}`);
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          billing_provider_npi,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
        WHERE billing_provider_npi IN UNNEST(@npis)
          AND date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
          AND date__month_grain <= @maxDate
        GROUP BY billing_provider_npi
        ORDER BY total_count DESC
      `;
      params = { npis, maxDate };
    } else {
      query = `
        SELECT 
          billing_provider_npi,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
        WHERE date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
          AND date__month_grain <= @maxDate
        GROUP BY billing_provider_npi
        ORDER BY total_count DESC
        LIMIT 20
      `;
      params = { maxDate };
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });
    
    console.log(`✅ Retrieved ${rows.length} providers of diagnosis data`);
    console.log(`🔍 NPIs with data:`, rows.map(r => r.billing_provider_npi));
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      debug: {
        npisRequested: npis?.length || 0,
        npisWithData: rows.length,
        dateFilter: `Last 12 months (through ${maxDate})`
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis data by provider:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis data by provider",
      error: error.message
    });
  }
});

// Get diagnosis data by service line
router.post("/diagnoses-by-service-line", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Fetching diagnosis data by service line...", { npis: npis?.length || 0 });
    
    // Get the max_date from reference_metadata
    const metadataQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;
    
    const [metadataRows] = await vendorBigQueryClient.query({ query: metadataQuery });
    
    if (metadataRows.length === 0) {
      throw new Error('No metadata found for volume_diagnosis table');
    }
    
    const maxDate = metadataRows[0].max_date;
    console.log(`📅 Using max_date from metadata: ${maxDate}`);
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          service_line_description,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
        WHERE billing_provider_npi IN UNNEST(@npis)
          AND date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
          AND date__month_grain <= @maxDate
        GROUP BY service_line_description
        ORDER BY total_count DESC
      `;
      params = { npis, maxDate };
    } else {
      query = `
        SELECT 
          service_line_description,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
        WHERE date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
          AND date__month_grain <= @maxDate
        GROUP BY service_line_description
        ORDER BY total_count DESC
        LIMIT 20
      `;
      params = { maxDate };
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params
    });
    
    console.log(`✅ Retrieved ${rows.length} service lines of diagnosis data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis data by service line:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis data by service line",
      error: error.message
    });
  }
});

// Debug endpoint to check NPI data availability
router.post("/diagnoses-debug-npis", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Debugging NPI data availability...", { npis: npis?.length || 0 });
    
    if (!npis || !Array.isArray(npis) || npis.length === 0) {
      return res.status(400).json({
        success: false,
        message: "NPIs array is required"
      });
    }
    
    // Check what NPIs have any data (without date filter)
    const allDataQuery = `
      SELECT 
        billing_provider_npi,
        COUNT(*) as record_count,
        MIN(date__month_grain) as earliest_date,
        MAX(date__month_grain) as latest_date
      FROM \`aegis_access.volume_diagnosis\`
      WHERE billing_provider_npi IN UNNEST(@npis)
      GROUP BY billing_provider_npi
      ORDER BY record_count DESC
    `;
    
    const [allDataRows] = await vendorBigQueryClient.query({ 
      query: allDataQuery,
      params: { npis }
    });
    
    // Check what NPIs have recent data (with 12-month date filter)
    const recentDataQuery12 = `
      SELECT 
        billing_provider_npi,
        COUNT(*) as record_count,
        MIN(date__month_grain) as earliest_date,
        MAX(date__month_grain) as latest_date
      FROM \`aegis_access.volume_diagnosis\`
      WHERE billing_provider_npi IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY billing_provider_npi
      ORDER BY record_count DESC
    `;
    
    // Check what NPIs have recent data (with 24-month date filter)
    const recentDataQuery24 = `
      SELECT 
        billing_provider_npi,
        COUNT(*) as record_count,
        MIN(date__month_grain) as earliest_date,
        MAX(date__month_grain) as latest_date
      FROM \`aegis_access.volume_diagnosis\`
      WHERE billing_provider_npi IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
      GROUP BY billing_provider_npi
      ORDER BY record_count DESC
    `;
    
    const [recentDataRows12] = await vendorBigQueryClient.query({ 
      query: recentDataQuery12,
      params: { npis }
    });
    
    const [recentDataRows24] = await vendorBigQueryClient.query({ 
      query: recentDataQuery24,
      params: { npis }
    });
    
    console.log(`✅ Debug results: ${allDataRows.length} NPIs with any data, ${recentDataRows12.length} NPIs with 12-month data, ${recentDataRows24.length} NPIs with 24-month data`);
    
    res.json({
      success: true,
      data: {
        requestedNpis: npis,
        allData: allDataRows,
        recentData12Months: recentDataRows12,
        recentData24Months: recentDataRows24,
        summary: {
          totalRequested: npis.length,
          withAnyData: allDataRows.length,
          with12MonthData: recentDataRows12.length,
          with24MonthData: recentDataRows24.length
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error debugging NPI data:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to debug NPI data",
      error: error.message
    });
  }
});

// Debug endpoint to test org_dhc JOIN
router.post("/diagnoses-debug-org-dhc", async (req, res) => {
  try {
    const { npis } = req.body;
    console.log("🔍 Debugging org_dhc JOIN...", { npis: npis?.length || 0 });
    
    if (!npis || !Array.isArray(npis) || npis.length === 0) {
      return res.status(400).json({
        success: false,
        message: "NPIs array is required"
      });
    }
    
    // Test simple query first
    const simpleQuery = `
      SELECT 
        billing_provider_npi,
        COUNT(*) as record_count
      FROM \`aegis_access.volume_diagnosis\`
      WHERE billing_provider_npi IN UNNEST(@npis)
        AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY billing_provider_npi
      LIMIT 5
    `;
    
    const [simpleRows] = await vendorBigQueryClient.query({ 
      query: simpleQuery,
      params: { npis }
    });
    
    // Test org_dhc table structure
    const orgDhcQuery = `
      SELECT 
        npi,
        provider_name,
        network_name
      FROM \`aegis_access.org_dhc\`
      WHERE npi IN UNNEST(@npis)
      LIMIT 5
    `;
    
    const [orgDhcRows] = await vendorBigQueryClient.query({ 
      query: orgDhcQuery,
      params: { npis }
    });
    
    // Test the JOIN
    const joinQuery = `
      SELECT 
        vd.billing_provider_npi,
        od.provider_name,
        od.network_name,
        COUNT(*) as record_count
      FROM \`aegis_access.volume_diagnosis\` vd
      LEFT JOIN \`aegis_access.org_dhc\` od ON vd.billing_provider_npi = od.npi
      WHERE vd.billing_provider_npi IN UNNEST(@npis)
        AND vd.date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
      GROUP BY vd.billing_provider_npi, od.provider_name, od.network_name
      LIMIT 5
    `;
    
    const [joinRows] = await vendorBigQueryClient.query({ 
      query: joinQuery,
      params: { npis }
    });
    
    console.log(`✅ Debug results: ${simpleRows.length} simple rows, ${orgDhcRows.length} org_dhc rows, ${joinRows.length} joined rows`);
    
    res.json({
      success: true,
      data: {
        simpleQuery: simpleRows,
        orgDhcQuery: orgDhcRows,
        joinQuery: joinRows
      }
    });
    
  } catch (error) {
    console.error("❌ Error in org_dhc debug:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to debug org_dhc JOIN",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Cache management endpoint
router.get("/cache-stats", (req, res) => {
  res.json({
    success: true,
    stats: cache.getStats(),
    timestamp: new Date().toISOString()
  });
});

router.post("/cache-clear", (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: "Cache cleared successfully",
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check available tables and org_dhc structure
router.get("/diagnoses-debug-tables", async (req, res) => {
  try {
    console.log("🔍 Checking available tables and org_dhc structure...");
    
    // Test if org_dhc table exists and get its structure
    const tableStructureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM \`aegis_access.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'org_dhc'
      ORDER BY ordinal_position
    `;
    
    try {
      const [tableStructure] = await vendorBigQueryClient.query({ 
        query: tableStructureQuery
      });
      
      console.log(`✅ org_dhc table structure:`, tableStructure);
      
      // Try to get a few sample rows from org_dhc
      const sampleQuery = `
        SELECT *
        FROM \`aegis_access.org_dhc\`
        LIMIT 5
      `;
      
      const [sampleRows] = await vendorBigQueryClient.query({ 
        query: sampleQuery
      });
      
      console.log(`✅ org_dhc sample rows:`, sampleRows);
      
      res.json({
        success: true,
        data: {
          tableExists: true,
          structure: tableStructure,
          sampleRows: sampleRows
        }
      });
      
    } catch (tableError) {
      console.log(`❌ org_dhc table error:`, tableError.message);
      
      // Check what tables are available
      const availableTablesQuery = `
        SELECT table_name
        FROM \`aegis_access.INFORMATION_SCHEMA.TABLES\`
        ORDER BY table_name
      `;
      
      try {
        const [availableTables] = await vendorBigQueryClient.query({ 
          query: availableTablesQuery
        });
        
        console.log(`✅ All available tables:`, availableTables);
        
        // Look for tables that might contain provider info
        const providerTables = availableTables.filter(table => 
          table.table_name.toLowerCase().includes('provider') ||
          table.table_name.toLowerCase().includes('org') ||
          table.table_name.toLowerCase().includes('dhc') ||
          table.table_name.toLowerCase().includes('facility') ||
          table.table_name.toLowerCase().includes('hospital') ||
          table.table_name.toLowerCase().includes('clinic')
        );
        
        console.log(`✅ Potential provider tables:`, providerTables);
        
        res.json({
          success: true,
          data: {
            tableExists: false,
            error: tableError.message,
            allTables: availableTables,
            providerTables: providerTables
          }
        });
      } catch (tablesError) {
        res.json({
          success: true,
          data: {
            tableExists: false,
            error: tableError.message,
            tablesError: tablesError.message
          }
        });
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking tables:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to check tables",
      error: error.message
    });
  }
});

// Get diagnosis reference codes with search and pagination
router.get("/diagnoses-reference", async (req, res) => {
  try {
    const { search = '', limit = 100, offset = 0, category = '', line = '', subservice = '', code_system = '' } = req.query;
    console.log("🔍 Fetching diagnosis reference codes...", { search, limit, offset, category, line, subservice, code_system });
    
    // Check cache first
    const cacheKey = `diagnoses-reference-${search}-${category}-${line}-${subservice}-${code_system}-${limit}-${offset}`;
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
    
    // Code system filter
    if (code_system && code_system.trim().length > 0) {
      whereConditions.push('code_system = @code_system');
      params.code_system = code_system;
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
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Single optimized query with window function for count
    const query = `
      SELECT 
        *,
        COUNT(*) OVER() as total_count
      FROM \`aegis_access.reference_code_diagnosis\`
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
    
    console.log(`✅ Retrieved ${cleanRows.length} diagnosis codes (${totalCount} total) in single query`);
    
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
    console.error("❌ Error fetching diagnosis reference codes:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis reference codes",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get diagnosis hierarchy structure
router.get("/diagnoses-hierarchy", async (req, res) => {
  try {
    console.log("🔍 Fetching diagnosis hierarchy...");
    
    // Check cache first
    const cachedResult = cache.get("diagnoses-hierarchy");
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
        code_system,
        service_category_code,
        service_category_description,
        service_line_code,
        service_line_description,
        subservice_line_code,
        subservice_line_description
      FROM \`aegis_access.reference_code_diagnosis\`
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
    cache.set("diagnoses-hierarchy", rows, 3600000);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis hierarchy:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis hierarchy",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        errors: error.errors
      }
    });
  }
});

// Get diagnosis details for specific codes
router.post("/diagnoses-details", async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    console.log("🔍 Fetching diagnosis details for codes...", { count: codes.length });
    
    const query = `
      SELECT *
      FROM \`aegis_access.reference_code_diagnosis\`
      WHERE code IN UNNEST(@codes)
      ORDER BY code
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { codes }
    });
    
    console.log(`✅ Retrieved details for ${rows.length} diagnosis codes`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis details:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis details",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get diagnosis volume totals for specific codes (last 12 months)
router.post("/diagnoses-volume-by-code", async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    console.log("🔍 Fetching diagnosis volume for codes...", { count: codes.length });
    console.log("📋 Codes requested:", codes.slice(0, 10)); // Log first 10 codes
    
    // First, get the max_date from reference_metadata
    const metadataQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;
    
    const [metadataRows] = await vendorBigQueryClient.query({ query: metadataQuery });
    
    if (metadataRows.length === 0) {
      throw new Error('No metadata found for volume_diagnosis table');
    }
    
    const maxDate = metadataRows[0].max_date;
    console.log(`📅 Using max_date from metadata: ${maxDate}`);
    
    // Now query volume data using the correct date range
    const query = `
      SELECT 
        code,
        SUM(count) as total_volume
      FROM \`aegis_access.volume_diagnosis\`
      WHERE code IN UNNEST(@codes)
        AND date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
        AND date__month_grain <= @maxDate
      GROUP BY code
      ORDER BY total_volume DESC
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { codes, maxDate }
    });
    
    console.log(`✅ Retrieved volume data for ${rows.length} diagnosis codes (period: ${maxDate})`);
    if (rows.length > 0) {
      console.log(`📊 Sample results:`, rows.slice(0, 5));
    } else {
      console.log(`⚠️ NO VOLUME DATA FOUND for any of the ${codes.length} codes`);
    }
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString(),
      metadata: {
        maxDate: maxDate ? (maxDate.value || maxDate) : null
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching diagnosis volume:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch diagnosis volume",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Test endpoint to verify BigQuery clients
router.get("/diagnoses-test-clients", async (req, res) => {
  try {
    console.log("🔍 Testing BigQuery clients...");
    
    // Test vendor client
    const vendorTestQuery = `
      SELECT COUNT(*) as count
      FROM \`aegis_access.volume_diagnosis\`
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
      FROM \`aegis_access.org_dhc\`
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

// Test endpoint to check code overlap between reference and volume tables
router.get("/diagnoses-test-code-overlap", async (req, res) => {
  try {
    console.log("🔍 Testing code overlap between reference_code_diagnosis and volume_diagnosis...");
    
    // Get the max_date from reference_metadata
    const metadataQuery = `
      SELECT max_date
      FROM \`aegis_access.reference_metadata\`
      WHERE view_name = 'volume_diagnosis'
      LIMIT 1
    `;
    
    const [metadataRows] = await vendorBigQueryClient.query({ query: metadataQuery });
    
    if (metadataRows.length === 0) {
      throw new Error('No metadata found for volume_diagnosis table');
    }
    
    const maxDate = metadataRows[0].max_date;
    console.log(`📅 Using max_date from metadata: ${maxDate}`);
    
    // Get sample codes from reference_code_diagnosis
    const referenceCodesQuery = `
      SELECT code
      FROM \`aegis_access.reference_code_diagnosis\`
      LIMIT 100
    `;
    
    const [referenceCodes] = await vendorBigQueryClient.query({ query: referenceCodesQuery });
    console.log(`📋 Got ${referenceCodes.length} codes from reference_code_diagnosis`);
    
    // Sample first 10 codes for detailed checking
    const sampleCodes = referenceCodes.slice(0, 10).map(r => r.code);
    console.log(`🔍 Sample codes:`, sampleCodes);
    
    // Check if these codes exist in volume_diagnosis within our timeframe
    const volumeCheckQuery = `
      SELECT 
        code,
        COUNT(*) as row_count,
        SUM(count) as total_volume,
        MIN(date__month_grain) as earliest_date,
        MAX(date__month_grain) as latest_date
      FROM \`aegis_access.volume_diagnosis\`
      WHERE code IN UNNEST(@codes)
        AND date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
        AND date__month_grain <= @maxDate
      GROUP BY code
      ORDER BY total_volume DESC
    `;
    
    const [volumeMatches] = await vendorBigQueryClient.query({ 
      query: volumeCheckQuery,
      params: { codes: sampleCodes, maxDate }
    });
    
    console.log(`✅ Found ${volumeMatches.length} matching codes in volume_diagnosis`);
    
    // Also check: What codes ARE in the volume table?
    const volumeCodesQuery = `
      SELECT 
        code,
        SUM(count) as total_volume
      FROM \`aegis_access.volume_diagnosis\`
      WHERE date__month_grain >= DATE_SUB(@maxDate, INTERVAL 11 MONTH)
        AND date__month_grain <= @maxDate
      GROUP BY code
      ORDER BY total_volume DESC
      LIMIT 20
    `;
    
    const [topVolumeCodes] = await vendorBigQueryClient.query({ 
      query: volumeCodesQuery,
      params: { maxDate }
    });
    
    console.log(`📊 Top codes in volume_diagnosis:`, topVolumeCodes.slice(0, 5));
    
    // Check if any of the top volume codes exist in reference table
    const topCodes = topVolumeCodes.map(v => v.code);
    const reverseCheckQuery = `
      SELECT code
      FROM \`aegis_access.reference_code_diagnosis\`
      WHERE code IN UNNEST(@codes)
    `;
    
    const [reverseMatches] = await vendorBigQueryClient.query({ 
      query: reverseCheckQuery,
      params: { codes: topCodes }
    });
    
    res.json({
      success: true,
      metadata: {
        maxDate: maxDate ? maxDate.value || maxDate : null,
        dateRange: `12 months ending ${maxDate ? (maxDate.value || maxDate) : 'unknown'}`
      },
      test1_reference_to_volume: {
        sampleCodesFromReference: sampleCodes,
        matchesFoundInVolume: volumeMatches.length,
        matchedCodes: volumeMatches
      },
      test2_volume_to_reference: {
        topCodesInVolume: topVolumeCodes,
        foundInReference: reverseMatches.length,
        matchedCodes: reverseMatches.map(r => r.code)
      },
      summary: {
        referenceSampleSize: sampleCodes.length,
        volumeMatchesForReferenceCodes: volumeMatches.length,
        topVolumeCodesChecked: topCodes.length,
        topVolumeCodesInReference: reverseMatches.length,
        conclusion: reverseMatches.length > 0 
          ? `✅ Found ${reverseMatches.length} codes that exist in BOTH tables`
          : `❌ NO OVERLAP - The codes in reference_code_diagnosis do not match the codes in volume_diagnosis`
      }
    });
    
  } catch (error) {
    console.error("❌ Error testing code overlap:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to test code overlap",
      error: error.message
    });
  }
});

export default router; 