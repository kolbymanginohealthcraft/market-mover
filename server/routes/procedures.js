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
        SELECT 
          date__month_grain,
          CAST(date__month_grain AS STRING) as date_string,
          SUM(count) as total_count
        FROM \`aegis_access.volume_procedure\`
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