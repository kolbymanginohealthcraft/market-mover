import express from "express";
import myBigQueryClient from "../utils/myBigQueryClient.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Get all KPIs from qm_dictionary
router.get("/kpis-reference", async (req, res) => {
  try {
    const {
      search = '',
      limit = 50,
      offset = 0,
      setting = '',
      source = ''
    } = req.query;

    console.log('🔍 Fetching KPIs reference...', { search, limit, offset, setting, source });

    // Simplified cache key - cache the full dataset, filter in memory
    const baseCacheKey = 'kpis_all_active';
    let allKpis = cache.get(baseCacheKey, {});
    
    if (!allKpis) {
      console.log('📊 Cache miss - fetching from BigQuery...');
      
      // Fetch all active KPIs once and cache them
      const query = `
        SELECT 
          code,
          label,
          direction,
          description,
          name,
          active,
          sort_order,
          setting,
          source
        FROM \`market-mover-464517.quality.qm_dictionary\`
        WHERE active = true
        ORDER BY sort_order, code
      `;

      const [rows] = await myBigQueryClient.query({
        query,
        location: "US"
      });

      allKpis = rows;
      
      // Cache for 1 hour (KPIs don't change frequently)
      cache.set(baseCacheKey, {}, allKpis, 3600000);
      console.log(`✅ Cached ${allKpis.length} KPIs`);
    } else {
      console.log(`📦 Serving ${allKpis.length} KPIs from cache`);
    }

    // Filter in memory (very fast)
    let filtered = allKpis;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(kpi => 
        kpi.code?.toLowerCase().includes(searchLower) ||
        kpi.label?.toLowerCase().includes(searchLower) ||
        kpi.description?.toLowerCase().includes(searchLower) ||
        kpi.name?.toLowerCase().includes(searchLower)
      );
    }

    if (setting && setting !== 'all') {
      filtered = filtered.filter(kpi => kpi.setting === setting);
    }

    if (source && source !== 'all') {
      filtered = filtered.filter(kpi => kpi.source === source);
    }

    const totalCount = filtered.length;

    // Apply pagination in memory
    const offsetNum = parseInt(offset);
    const limitNum = parseInt(limit);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

    console.log(`✅ Returning ${paginated.length} of ${totalCount} KPIs`);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum
      }
    });

  } catch (error) {
    console.error("❌ Error fetching KPIs reference:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KPIs reference",
      error: error.message
    });
  }
});

// Get details for specific KPI codes
router.post("/kpis-details", async (req, res) => {
  try {
    const { codes } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "codes array is required"
      });
    }

    console.log(`🔍 Fetching KPI details for ${codes.length} codes...`);

    // Use the same cached dataset as kpis-reference
    const baseCacheKey = 'kpis_all_active';
    let allKpis = cache.get(baseCacheKey, {});
    
    if (!allKpis) {
      console.log('📊 Cache miss - fetching from BigQuery...');
      
      const query = `
        SELECT 
          code,
          label,
          direction,
          description,
          name,
          active,
          sort_order,
          setting,
          source
        FROM \`market-mover-464517.quality.qm_dictionary\`
        WHERE active = true
        ORDER BY sort_order, code
      `;

      const [rows] = await myBigQueryClient.query({
        query,
        location: "US"
      });

      allKpis = rows;
      cache.set(baseCacheKey, {}, allKpis, 3600000);
      console.log(`✅ Cached ${allKpis.length} KPIs`);
    } else {
      console.log(`📦 Using cached KPIs data`);
    }

    // Filter in memory
    const codesSet = new Set(codes);
    const filtered = allKpis.filter(kpi => codesSet.has(kpi.code));

    console.log(`✅ Returning details for ${filtered.length} KPIs`);

    res.status(200).json({
      success: true,
      data: filtered
    });

  } catch (error) {
    console.error("❌ Error fetching KPIs details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KPIs details",
      error: error.message
    });
  }
});

// Get available filter options (settings and sources)
router.get("/kpis-filters", async (req, res) => {
  try {
    console.log('🔍 Fetching KPI filter options...');
    
    // Use the same cached dataset
    const baseCacheKey = 'kpis_all_active';
    let allKpis = cache.get(baseCacheKey, {});
    
    if (!allKpis) {
      console.log('📊 Cache miss - fetching from BigQuery...');
      
      const query = `
        SELECT 
          code,
          label,
          direction,
          description,
          name,
          active,
          sort_order,
          setting,
          source
        FROM \`market-mover-464517.quality.qm_dictionary\`
        WHERE active = true
        ORDER BY sort_order, code
      `;

      const [rows] = await myBigQueryClient.query({
        query,
        location: "US"
      });

      allKpis = rows;
      cache.set(baseCacheKey, {}, allKpis, 3600000);
      console.log(`✅ Cached ${allKpis.length} KPIs`);
    } else {
      console.log(`📦 Using cached KPIs data`);
    }

    // Extract unique settings and sources from cached data
    const settings = [...new Set(allKpis.map(r => r.setting).filter(Boolean))].sort();
    const sources = [...new Set(allKpis.map(r => r.source).filter(Boolean))].sort();

    console.log(`✅ Returning ${settings.length} settings and ${sources.length} sources`);

    res.status(200).json({
      success: true,
      data: {
        settings,
        sources
      }
    });

  } catch (error) {
    console.error("❌ Error fetching KPIs filters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KPIs filters",
      error: error.message
    });
  }
});

export default router;

