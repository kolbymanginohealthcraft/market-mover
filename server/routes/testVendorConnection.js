import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

// Test vendor BigQuery connection
router.get("/test-vendor-connection", async (req, res) => {
  try {
    console.log("🔍 Testing vendor BigQuery connection...");
    
    // Test 1: Check if we can connect and list datasets
    const [datasets] = await vendorBigQueryClient.getDatasets();
    
    console.log("✅ Successfully connected to vendor BigQuery");
    console.log(`📊 Found ${datasets.length} datasets`);
    
    // Test 2: Try a simple query to verify access
    const query = `
      SELECT 
        'vendor_connection_test' as test_type,
        CURRENT_TIMESTAMP() as timestamp,
        COUNT(*) as dataset_count
      FROM \`populi-clients.__TABLES__\`
      LIMIT 1
    `;
    
    const [rows] = await vendorBigQueryClient.query({ query });
    
    res.json({
      success: true,
      message: "Vendor BigQuery connection successful",
      datasets: datasets.length,
      testQuery: rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Vendor BigQuery connection failed:", error);
    
    res.status(500).json({
      success: false,
      message: "Vendor BigQuery connection failed",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        projectId: vendorBigQueryClient.projectId
      }
    });
  }
});

// Test specific dataset access
router.get("/test-vendor-dataset/:datasetName", async (req, res) => {
  const { datasetName } = req.params;
  
  try {
    console.log(`🔍 Testing access to dataset: ${datasetName}`);
    
    const dataset = vendorBigQueryClient.dataset(datasetName);
    const [tables] = await dataset.getTables();
    
    res.json({
      success: true,
      dataset: datasetName,
      tables: tables.length,
      tableNames: tables.map(table => table.id),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ Failed to access dataset ${datasetName}:`, error);
    
    res.status(500).json({
      success: false,
      dataset: datasetName,
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

export default router; 