import express from "express";
import vendorBigQuery from "../utils/vendorBigQueryClient.js";
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
      
      const [rows] = await vendorBigQuery.query({ query });
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
      
      const [queryRows] = await vendorBigQuery.query({ query });
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
    
    const [rows] = await vendorBigQuery.query({ 
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

// Analyze taxonomy codes to determine predominant NPI type (HCO vs HCP)
router.get("/taxonomies-npi-type-analysis", async (req, res) => {
  try {
    const { 
      minCount = 1, 
      minConfidence = 0.0,
      sortBy = 'code',
      limit = 10000 
    } = req.query;

    console.log("🔍 Analyzing taxonomy codes for NPI type classification...", {
      minCount: parseInt(minCount),
      minConfidence: parseFloat(minConfidence),
      sortBy,
      limit: parseInt(limit)
    });

    const cacheKey = `taxonomy-npi-analysis-${minCount}-${minConfidence}-${sortBy}-${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log("✅ Returning cached taxonomy NPI type analysis");
      return res.json({
        success: true,
        ...cached,
        cached: true
      });
    }

    const hcoQuery = `
      SELECT
        primary_taxonomy_code as taxonomy_code,
        COUNT(*) as hco_count
      FROM \`aegis_access.hco_flat\`
      WHERE npi_deactivation_date IS NULL
        AND primary_taxonomy_code IS NOT NULL
      GROUP BY primary_taxonomy_code
    `;

    const hcpQuery = `
      SELECT
        primary_taxonomy_code as taxonomy_code,
        COUNT(*) as hcp_count
      FROM \`aegis_access.hcp_flat\`
      WHERE npi_deactivation_date IS NULL
        AND primary_taxonomy_code IS NOT NULL
      GROUP BY primary_taxonomy_code
    `;

    console.log('📊 Executing separate HCO and HCP queries...');
    
    const [hcoResults, hcpResults] = await Promise.all([
      vendorBigQuery.query({ query: hcoQuery }),
      vendorBigQuery.query({ query: hcpQuery })
    ]);

    const hcoMap = new Map();
    hcoResults[0].forEach(row => {
      hcoMap.set(row.taxonomy_code, row.hco_count);
    });

    const hcpMap = new Map();
    hcpResults[0].forEach(row => {
      hcpMap.set(row.taxonomy_code, row.hcp_count);
    });

    const allTaxonomyCodes = new Set([...hcoMap.keys(), ...hcpMap.keys()]);
    
    const combinedResults = Array.from(allTaxonomyCodes).map(code => {
      const hcoCount = hcoMap.get(code) || 0;
      const hcpCount = hcpMap.get(code) || 0;
      const totalCount = hcoCount + hcpCount;
      
      let predominantType = 'TIE';
      if (hcoCount > hcpCount) {
        predominantType = 'HCO';
      } else if (hcpCount > hcoCount) {
        predominantType = 'HCP';
      }
      
      const confidence = totalCount > 0 
        ? Math.max(hcoCount, hcpCount) / totalCount 
        : 0;
      
      const hcoPercentage = totalCount > 0 ? hcoCount / totalCount : 0;
      const hcpPercentage = totalCount > 0 ? hcpCount / totalCount : 0;
      
      const absoluteMargin = Math.abs(hcoCount - hcpCount);
      const percentageMargin = totalCount > 0 ? Math.abs(hcoPercentage - hcpPercentage) : 0;
      
      return {
        taxonomy_code: code,
        hco_count: hcoCount,
        hcp_count: hcpCount,
        total_count: totalCount,
        predominant_type: predominantType,
        confidence: Math.round(confidence * 10000) / 10000,
        hco_percentage: Math.round(hcoPercentage * 10000) / 10000,
        hcp_percentage: Math.round(hcpPercentage * 10000) / 10000,
        landslide_margin: {
          absolute: absoluteMargin,
          percentage: Math.round(percentageMargin * 10000) / 10000,
          description: percentageMargin >= 0.9 ? 'Landslide' : 
                       percentageMargin >= 0.7 ? 'Strong' : 
                       percentageMargin >= 0.5 ? 'Moderate' : 
                       percentageMargin >= 0.3 ? 'Weak' : 'Very Weak'
        }
      };
    });

    let filteredResults = combinedResults.filter(r => 
      r.total_count >= parseInt(minCount) && 
      r.confidence >= parseFloat(minConfidence)
    );

    if (sortBy === 'confidence') {
      filteredResults.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return b.total_count - a.total_count;
      });
    } else if (sortBy === 'count') {
      filteredResults.sort((a, b) => {
        if (b.total_count !== a.total_count) return b.total_count - a.total_count;
        return b.confidence - a.confidence;
      });
    } else if (sortBy === 'code') {
      filteredResults.sort((a, b) => a.taxonomy_code.localeCompare(b.taxonomy_code));
    }

    const results = filteredResults.slice(0, parseInt(limit));

    const summary = {
      total_taxonomy_codes: combinedResults.length,
      total_analyzed: results.length,
      hco_predominant: combinedResults.filter(r => r.predominant_type === 'HCO').length,
      hcp_predominant: combinedResults.filter(r => r.predominant_type === 'HCP').length,
      ties: combinedResults.filter(r => r.predominant_type === 'TIE').length,
      landslide_margin: combinedResults.filter(r => r.landslide_margin.percentage >= 0.9).length,
      strong_margin: combinedResults.filter(r => r.landslide_margin.percentage >= 0.7 && r.landslide_margin.percentage < 0.9).length,
      moderate_margin: combinedResults.filter(r => r.landslide_margin.percentage >= 0.5 && r.landslide_margin.percentage < 0.7).length,
      weak_margin: combinedResults.filter(r => r.landslide_margin.percentage < 0.5).length
    };

    console.log(`✅ Analysis complete: ${results.length} taxonomy codes analyzed`);
    console.log(`   HCO predominant: ${summary.hco_predominant}, HCP predominant: ${summary.hcp_predominant}, Ties: ${summary.ties}`);

    const response = {
      success: true,
      summary,
      data: results,
      filters: {
        minCount: parseInt(minCount),
        minConfidence: parseFloat(minConfidence),
        sortBy,
        limit: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response, 3600000);

    res.json(response);
    
  } catch (error) {
    console.error("❌ Error analyzing taxonomy NPI types:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to analyze taxonomy NPI types",
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        errors: error.errors
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
      const [sampleRows] = await vendorBigQuery.query({ query: sampleQuery });
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
      
      const [schemaRows] = await vendorBigQuery.query({ query: schemaQuery });
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

