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
          AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
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
        FROM \`aegis_access.volume_diagnosis\`
        GROUP BY date__month_grain
        ORDER BY date__month_grain DESC
        LIMIT 12
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
    });
    
    console.log(`✅ Retrieved ${rows.length} months of diagnosis volume data`);
    console.log(`🔍 Sample monthly data:`, rows.slice(0, 3));
    
    // Cache the result
    cache.set("diagnoses-volume", { npis }, rows);
    
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
    
    const query = `
      SELECT 
        date__month_grain,
        CAST(date__month_grain AS STRING) as date_string,
        SUM(count) as total_count
      FROM \`aegis_access.volume_diagnosis\`
      GROUP BY date__month_grain
      ORDER BY date__month_grain DESC
      LIMIT 12
    `;
    
    const [rows] = await vendorBigQueryClient.query({ query });
    
    console.log(`✅ Retrieved ${rows.length} months of diagnosis volume data`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
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
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          billing_provider_npi,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
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
        FROM \`aegis_access.volume_diagnosis\`
        GROUP BY billing_provider_npi
        ORDER BY total_count DESC
        LIMIT 20
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
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
        dateFilter: "Last 12 months"
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
    
    let query;
    let params = {};
    
    if (npis && Array.isArray(npis) && npis.length > 0) {
      query = `
        SELECT 
          service_line_description,
          SUM(count) as total_count
        FROM \`aegis_access.volume_diagnosis\`
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
        FROM \`aegis_access.volume_diagnosis\`
        GROUP BY service_line_description
        ORDER BY total_count DESC
        LIMIT 20
      `;
    }
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: Object.keys(params).length > 0 ? params : undefined
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

export default router; 