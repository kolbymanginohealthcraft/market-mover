import express from "express";
import myBigQuery from "../utils/myBigQueryClient.js";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * POST /api/supplier/search-providers
 * 
 * Search for providers by service line and other criteria
 * 
 * Body parameters:
 *   - serviceLine: Service line to search for (required)
 *   - state: State filter (optional)
 *   - providerType: Provider type filter (optional)
 *   - searchQuery: Text search (optional)
 * 
 * Returns: Array of providers matching the criteria
 */
router.post("/search-providers", async (req, res) => {
  const { serviceLine, state, providerType, searchQuery } = req.body;

  if (!serviceLine) {
    return res.status(400).json({
      success: false,
      error: "Service line is required"
    });
  }

  try {
    // Check cache first
    const cacheKey = {
      serviceLine,
      state,
      providerType,
      searchQuery
    };
    
    const cachedResult = cache.get("supplier-search", cacheKey);
    if (cachedResult) {
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Build the base query for provider search
    let query = `
      SELECT 
        dhc,
        name,
        type,
        street,
        city,
        state,
        zip,
        phone,
        network,
        latitude,
        longitude
      FROM \`market-mover-464517.providers.org_dhc\`
      WHERE 1=1
    `;

    const params = {};

    // Add service line filter (this would need to be enhanced with actual service line data)
    if (serviceLine) {
      // For now, we'll do a basic text search on provider name and type
      // In a real implementation, you'd have a service line mapping table
      query += ` AND (
        LOWER(name) LIKE LOWER(@serviceLine) OR
        LOWER(type) LIKE LOWER(@serviceLine)
      )`;
      params.serviceLine = `%${serviceLine}%`;
    }

    // Add state filter
    if (state) {
      query += ` AND state = @state`;
      params.state = state;
    }

    // Add provider type filter
    if (providerType) {
      query += ` AND LOWER(type) LIKE LOWER(@providerType)`;
      params.providerType = `%${providerType}%`;
    }

    // Add text search
    if (searchQuery) {
      query += ` AND (
        LOWER(name) LIKE LOWER(@searchQuery) OR
        LOWER(network) LIKE LOWER(@searchQuery) OR
        LOWER(city) LIKE LOWER(@searchQuery) OR
        LOWER(street) LIKE LOWER(@searchQuery)
      )`;
      params.searchQuery = `%${searchQuery}%`;
    }

    query += ` ORDER BY name LIMIT 100`;

    const [rows] = await myBigQuery.query({
      query,
      location: "US",
      params
    });

    // Enhance results with volume data if available
    const enhancedResults = await enhanceWithVolumeData(rows, serviceLine);

    // Cache the results for 30 minutes
    cache.set("supplier-search", cacheKey, enhancedResults, 30 * 60 * 1000);

    res.json({
      success: true,
      data: enhancedResults,
      debug: {
        totalResults: enhancedResults.length,
        serviceLine,
        state,
        providerType,
        searchQuery
      }
    });

  } catch (err) {
    console.error("❌ Supplier search error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/supplier/service-lines
 * 
 * Get available service lines for supplier mode
 */
router.get("/service-lines", async (req, res) => {
  try {
    // In a real implementation, this would come from a service line mapping table
    const serviceLines = [
      'Cardiology',
      'Orthopedics',
      'Oncology',
      'Neurology',
      'Gastroenterology',
      'Dermatology',
      'Urology',
      'Ophthalmology',
      'ENT',
      'General Surgery',
      'Internal Medicine',
      'Family Medicine',
      'Pediatrics',
      'Obstetrics & Gynecology',
      'Psychiatry',
      'Physical Therapy',
      'Occupational Therapy',
      'Speech Therapy',
      'Laboratory Services',
      'Radiology'
    ];

    res.json({
      success: true,
      data: serviceLines
    });

  } catch (err) {
    console.error("❌ Service lines error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/supplier/provider-types
 * 
 * Get available provider types for supplier mode
 */
router.get("/provider-types", async (req, res) => {
  try {
    const providerTypes = [
      'Hospital',
      'Physician Practice',
      'Ambulatory Surgery Center',
      'Diagnostic Laboratory',
      'Imaging Center',
      'Rehabilitation Center',
      'Urgent Care',
      'Specialty Clinic'
    ];

    res.json({
      success: true,
      data: providerTypes
    });

  } catch (err) {
    console.error("❌ Provider types error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * Helper function to enhance provider results with volume data
 */
async function enhanceWithVolumeData(providers, serviceLine) {
  if (!providers || providers.length === 0) {
    return providers;
  }

  try {
    // Get NPIs for these providers
    const dhcIds = providers.map(p => p.dhc);
    
    const npisResponse = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/related-npis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dhc_ids: dhcIds })
    });

    if (!npisResponse.ok) {
      console.warn("⚠️ Could not fetch NPIs for volume data");
      return providers;
    }

    const npisResult = await npisResponse.json();
    if (!npisResult.success) {
      return providers;
    }

    const npis = npisResult.data.map(row => row.npi);
    
    if (npis.length === 0) {
      return providers;
    }

    // Get volume data for these NPIs
    const volumeResponse = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/procedures-by-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npis })
    });

    if (!volumeResponse.ok) {
      return providers;
    }

    const volumeResult = await volumeResponse.json();
    if (!volumeResult.success) {
      return providers;
    }

    // Create a map of NPI to volume
    const volumeMap = {};
    volumeResult.data.forEach(item => {
      volumeMap[item.billing_provider_npi] = item.total_count;
    });

    // Enhance providers with volume data
    return providers.map(provider => {
      // Find NPIs for this provider
      const providerNpis = npisResult.data
        .filter(row => row.dhc === provider.dhc)
        .map(row => row.npi);

      // Calculate total volume for this provider
      const totalVolume = providerNpis.reduce((sum, npi) => {
        return sum + (volumeMap[npi] || 0);
      }, 0);

      return {
        ...provider,
        volume: totalVolume,
        marketShare: totalVolume > 0 ? `${Math.round(Math.random() * 20 + 5)}%` : null // Mock data
      };
    });

  } catch (error) {
    console.error("❌ Error enhancing with volume data:", error);
    return providers;
  }
}

export default router; 