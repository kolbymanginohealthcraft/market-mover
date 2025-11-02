import express from "express";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Get taxonomy reference codes with search and pagination
// Optimized for small dataset (853 rows) - loads all data and filters in memory
router.get("/taxonomies-reference", async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0, grouping = '', classification = '', specialization = '' } = req.query;

    // Cache the full dataset - load all 853 rows once and filter in memory
    const baseCacheKey = 'taxonomies_all';
    let allTaxonomies = cache.get(baseCacheKey);
    
    if (!allTaxonomies) {
      console.log('📊 Cache miss - fetching all taxonomies from BigQuery...');
      
      // Fetch ALL taxonomies at once (only 853 rows)
      // Note: 'grouping' is a reserved keyword, must be quoted
      const query = `
        SELECT 
          code,
          \`grouping\`,
          classification,
          specialization,
          definition,
          notes
        FROM \`bigquery-public-data.nppes.healthcare_provider_taxonomy_code_set\`
        ORDER BY code
      `;
      
      const [rows] = await vendorBigQueryClient.query({ query });
      allTaxonomies = rows;
      
      // Cache for 1 hour (taxonomies don't change frequently)
      cache.set(baseCacheKey, allTaxonomies, 3600000);
      console.log(`✅ Cached ${allTaxonomies.length} taxonomies`);
    } else {
      console.log(`📦 Serving ${allTaxonomies.length} taxonomies from cache`);
    }

    // Filter in memory (very fast for 853 rows)
    let filtered = allTaxonomies;

    // Search filter
    if (search && search.trim().length > 0) {
      const searchLower = search.trim().toLowerCase();
      filtered = filtered.filter(tax => 
        tax.code?.toLowerCase().includes(searchLower) ||
        tax.grouping?.toLowerCase().includes(searchLower) ||
        tax.classification?.toLowerCase().includes(searchLower) ||
        tax.specialization?.toLowerCase().includes(searchLower) ||
        tax.definition?.toLowerCase().includes(searchLower)
      );
    }

    // Grouping filter
    if (grouping && grouping.trim().length > 0) {
      filtered = filtered.filter(tax => tax.grouping === grouping);
    }

    // Classification filter
    if (classification && classification.trim().length > 0) {
      filtered = filtered.filter(tax => tax.classification === classification);
    }

    // Specialization filter
    if (specialization && specialization.trim().length > 0) {
      filtered = filtered.filter(tax => tax.specialization === specialization);
    }

    const totalCount = filtered.length;

    // Apply pagination in memory
    const offsetNum = parseInt(offset);
    const limitNum = parseInt(limit);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    console.log(`✅ Returning ${paginated.length} of ${totalCount} taxonomies`);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: (offsetNum + paginated.length) < totalCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching taxonomy reference codes:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch taxonomy reference codes",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Get taxonomy hierarchy structure
router.get("/taxonomies-hierarchy", async (req, res) => {
  try {
    console.log("🔍 Fetching taxonomy hierarchy...");
    
    // Check cache first
    const cachedResult = cache.get("taxonomies-hierarchy");
    if (cachedResult) {
      console.log("✅ Returning cached hierarchy");
      return res.json({
        success: true,
        data: cachedResult,
        timestamp: new Date().toISOString(),
        cached: true
      });
    }
    
    // Use cached full dataset if available, otherwise fetch
    const baseCacheKey = 'taxonomies_all';
    let allTaxonomies = cache.get(baseCacheKey);
    
    if (!allTaxonomies) {
      // If cache miss, fetch all (will be cached for future requests)
      // Note: 'grouping' is a reserved keyword, must be quoted
      const query = `
        SELECT 
          code,
          \`grouping\`,
          classification,
          specialization,
          definition,
          notes
        FROM \`bigquery-public-data.nppes.healthcare_provider_taxonomy_code_set\`
        ORDER BY code
      `;
      
      const [queryRows] = await vendorBigQueryClient.query({ query });
      allTaxonomies = queryRows;
      cache.set(baseCacheKey, allTaxonomies, 3600000);
    }
    
    // Build distinct hierarchy from cached data
    const hierarchyMap = new Map();
    allTaxonomies.forEach(tax => {
      if (tax.grouping && tax.classification) {
        const key = `${tax.grouping}|${tax.classification}|${tax.specialization || ''}`;
        if (!hierarchyMap.has(key)) {
          hierarchyMap.set(key, {
            grouping: tax.grouping,
            classification: tax.classification,
            specialization: tax.specialization || null
          });
        }
      }
    });
    
    const rows = Array.from(hierarchyMap.values()).sort((a, b) => {
      if (a.grouping !== b.grouping) return a.grouping.localeCompare(b.grouping);
      if (a.classification !== b.classification) return a.classification.localeCompare(b.classification);
      const aSpec = a.specialization || '';
      const bSpec = b.specialization || '';
      return aSpec.localeCompare(bSpec);
    });
    
    console.log(`✅ Retrieved ${rows.length} unique hierarchy combinations from cached data`);
    
    // Cache hierarchy for 1 hour (doesn't change often)
    cache.set("taxonomies-hierarchy", rows, 3600000);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching taxonomy hierarchy:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch taxonomy hierarchy",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        errors: error.errors
      }
    });
  }
});

// Get taxonomy details for specific codes
router.post("/taxonomies-details", async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    console.log("🔍 Fetching taxonomy details for codes...", { count: codes.length });
    
    const query = `
      SELECT *
      FROM \`bigquery-public-data.nppes.healthcare_provider_taxonomy_code_set\`
      WHERE code IN UNNEST(@codes)
      ORDER BY code
    `;
    
    const [rows] = await vendorBigQueryClient.query({ 
      query,
      params: { codes }
    });
    
    console.log(`✅ Retrieved details for ${rows.length} taxonomy codes`);
    
    res.json({
      success: true,
      data: rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error fetching taxonomy details:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch taxonomy details",
      error: error.message,
      details: {
        code: error.code,
        status: error.status
      }
    });
  }
});

// Debug endpoint to check table schema and sample data
router.get("/taxonomies-debug", async (req, res) => {
  try {
    console.log("🔍 Debugging taxonomy table...");
    
    // First, try to get a sample row to see the structure
    const sampleQuery = `
      SELECT *
      FROM \`bigquery-public-data.nppes.healthcare_provider_taxonomy_code_set\`
      LIMIT 1
    `;
    
    let sampleResult;
    try {
      const [sampleRows] = await vendorBigQueryClient.query({ query: sampleQuery });
      if (sampleRows && sampleRows.length > 0) {
        sampleResult = {
          success: true,
          columns: Object.keys(sampleRows[0]),
          sampleRow: sampleRows[0]
        };
        console.log("✅ Sample query successful");
        console.log("📋 Columns found:", Object.keys(sampleRows[0]));
      } else {
        sampleResult = { success: false, error: "No rows returned" };
      }
    } catch (sampleError) {
      sampleResult = { 
        success: false, 
        error: sampleError.message,
        details: sampleError.details
      };
      console.error("❌ Sample query failed:", sampleError);
    }
    
    // Try to get schema from INFORMATION_SCHEMA (might not work for public datasets)
    let schemaResult;
    try {
      const schemaQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM \`bigquery-public-data.nppes.INFORMATION_SCHEMA.COLUMNS\`
        WHERE table_name = 'healthcare_provider_taxonomy_code_set'
        ORDER BY ordinal_position
      `;
      
      const [schemaRows] = await vendorBigQueryClient.query({ query: schemaQuery });
      schemaResult = { success: true, columns: schemaRows };
      console.log("✅ Schema query successful");
    } catch (schemaError) {
      schemaResult = { 
        success: false, 
        error: schemaError.message,
        note: "INFORMATION_SCHEMA might not be accessible for public datasets"
      };
      console.log("⚠️ Schema query failed (expected for public datasets):", schemaError.message);
    }
    
    res.json({
      success: true,
      sample: sampleResult,
      schema: schemaResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error in debug endpoint:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to debug taxonomy table",
      error: error.message,
      details: error.details
    });
  }
});

export default router;

