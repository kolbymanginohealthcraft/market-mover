import express from "express";
import fetch from "node-fetch";
import cache from "../utils/cache.js";

const router = express.Router();



// Function to get the current dataset ID from CMS
async function getCurrentDatasetId() {
  try {
    // Check cache first
    const cachedId = cache.get('dataset-id', { type: 'hospital-service-area' });
    if (cachedId) {
      console.log("📋 Using cached dataset ID:", cachedId);
      return cachedId;
    }

    // For now, use the hardcoded dataset ID from the user's example
    // This is the Hospital Service Area dataset ID that rotates yearly
    const datasetId = "8708ca8b-8636-44ed-8303-724cbfaf78ad";
    
    // Cache the dataset ID
    cache.set('dataset-id', { type: 'hospital-service-area' }, datasetId);
    
    console.log("✅ Using hardcoded dataset ID:", datasetId);
    return datasetId;
  } catch (error) {
    console.error("❌ Error getting dataset ID:", error);
    throw error;
  }
}

// Main endpoint for fetching catchment data
router.post("/catchment-data", async (req, res) => {
  try {
    console.log("🔍 Catchment data request received:", JSON.stringify(req.body, null, 2));
    
    const {
      ccn,
      marketId,
      filters = {}
    } = req.body;

    console.log("🔍 Parsed request data:", {
      ccn,
      marketId,
      filters
    });

    // Validate inputs
    if (!ccn && !marketId) {
      console.log("❌ Validation failed: Either CCN or marketId is required");
      return res.status(400).json({
        success: false,
        message: "Either CCN or marketId is required"
      });
    }

    // Get the current dataset ID
    const datasetId = await getCurrentDatasetId();
    
    // Filter by CCNs directly in the API call using query parameters
    let data = [];
    
    if (ccn) {
      const ccnArray = Array.isArray(ccn) ? ccn : [ccn];
      console.log(`🔍 Filtering by ${ccnArray.length} CCNs using GET method with URL parameters`);
      
      // Process CCNs in smaller batches to avoid URL length limits
      const batchSize = 25; // Reduced batch size to avoid hitting CMS 1000 record limit
      let allData = [];
      
      for (let i = 0; i < ccnArray.length; i += batchSize) {
        const batch = ccnArray.slice(i, i + batchSize);
        console.log(`🔍 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ccnArray.length/batchSize)} with ${batch.length} CCNs`);
        
        // Use the working CMS API filter syntax from your example
        const ccnFilters = batch.map(ccn => `filter[condition][value][]=${ccn}`).join('&');
        const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${datasetId}/data?filter[condition][path]=MEDICARE_PROV_NUM&filter[condition][operator]=IN&${ccnFilters}&limit=0`;
        
        console.log(`🔍 Fetching batch data: ${apiUrl.substring(0, 100)}...`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch data from CMS: ${response.status}`);
        }
        
        const batchData = await response.json();
        console.log(`📊 Received ${batchData.length} records from batch ${Math.floor(i/batchSize) + 1}`);
        
        allData = allData.concat(batchData);
      }
      
      data = allData;
      console.log(`📊 Total records received: ${data.length}`);
      
      // Debug: Log the first few records to see the data structure
      if (data.length > 0) {
        console.log("🔍 Sample data structure:", JSON.stringify(data[0], null, 2));
        console.log("🔍 Available fields:", Object.keys(data[0]));
        
        // Debug: Show some sample CCNs from the data
        const sampleCcns = data.slice(0, 5).map(row => row.MEDICARE_PROV_NUM);
        console.log(`🔍 Sample CCNs in data: ${sampleCcns.join(', ')}`);
        
        // Debug: Show some sample ZIP codes to verify location
        const sampleZips = data.slice(0, 5).map(row => row.ZIP_CD_OF_RESIDENCE);
        console.log(`🔍 Sample ZIP codes in data: ${sampleZips.join(', ')}`);
      }
    } else {
      // If no CCNs provided, fetch a small sample to understand the data structure
      const apiUrl = `https://data.cms.gov/data-api/v1/dataset/${datasetId}/data?limit=10`;
      console.log("🔍 Fetching sample data to understand structure");
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from CMS: ${response.status}`);
      }
      
      data = await response.json();
      console.log(`📊 Received ${data.length} sample records`);
    }

    // Filter by year if specified
    if (filters.year) {
      // Note: The CMS data doesn't include year in the current format
      // This would need to be implemented when year-specific datasets are available
      console.log("📅 Year filtering not yet implemented for this dataset");
    }

    // Sort by total cases (descending) and limit results
    data.sort((a, b) => {
      const casesA = parseInt(a.TOTAL_CASES) || 0;
      const casesB = parseInt(b.TOTAL_CASES) || 0;
      return casesB - casesA;
    });

    // Apply limit (but allow higher limits for complete data)
    const limit = filters.limit || 1000; // Increased default limit
    data = data.slice(0, limit);

    // Filter out rows with suppressed data (marked with "*")
    data = data.filter(row => 
      row.TOTAL_CASES !== "*" && 
      row.TOTAL_DAYS_OF_CARE !== "*" && 
      row.TOTAL_CHARGES !== "*"
    );

    console.log(`✅ Returning ${data.length} filtered records`);

    res.json({
      success: true,
      data: data,
      metadata: {
        totalRecords: data.length,
        datasetId: datasetId,
        filters: filters,
        source: "CMS Hospital Service Area"
      }
    });

  } catch (error) {
    console.error("❌ Error in catchment-data endpoint:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
});

// Health check endpoint for the catchment service
router.get("/catchment-health", async (req, res) => {
  try {
    const datasetId = await getCurrentDatasetId();
    res.json({
      success: true,
      status: "healthy",
      datasetId: datasetId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
