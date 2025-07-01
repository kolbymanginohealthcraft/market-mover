import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
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
          AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
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
        dateFilter: "Last 24 months"
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
          AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
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
          AND date__month_grain >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
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

export default router; 