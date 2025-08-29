import express from "express";
import cache from "../utils/cache.js";
import myBigQueryClient from "../utils/myBigQueryClient.js";
import vendorBigQueryClient from "../utils/vendorBigQueryClient.js";

const router = express.Router();

/**
 * POST /api/batch-data
 * 
 * Fetches multiple data types in a single request to reduce round trips
 * Body: {
 *   provider: { dhc, latitude, longitude },
 *   radiusInMiles: number,
 *   dataTypes: ['providers', 'census', 'ccns', 'npis', 'qualityMeasures', 'enrollment']
 * }
 */
router.post("/batch-data", async (req, res) => {
  const { provider, radiusInMiles = 10, dataTypes = [] } = req.body;
  
  if (!provider?.latitude || !provider?.longitude) {
    return res.status(400).json({ 
      success: false, 
      error: "Provider with latitude and longitude is required" 
    });
  }

  if (!Array.isArray(dataTypes) || dataTypes.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: "dataTypes array is required" 
    });
  }

  try {
    console.log('🚀 Batch data request:', { 
      providerDhc: provider.dhc, 
      dataTypes, 
      radiusInMiles 
    });

    const results = {};
    const errors = {};
    const cacheHits = {};
    const cacheMisses = {};

    // Helper function to fetch data with caching
    const fetchWithCache = async (dataType, fetchFunction) => {
      const cacheKey = `batch_${dataType}_${provider.dhc}_${radiusInMiles}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        cacheHits[dataType] = true;
        return cached;
      }
      
      cacheMisses[dataType] = true;
      const data = await fetchFunction();
      cache.set(cacheKey, data);
      return data;
    };

    // Fetch providers data
    if (dataTypes.includes('providers')) {
      try {
        results.providers = await fetchWithCache('providers', async () => {
          const response = await fetch(`${req.protocol}://${req.get('host')}/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`);
          const result = await response.json();
          return result.success ? result.data : [];
        });
      } catch (error) {
        errors.providers = error.message;
      }
    }

    // Fetch census data
    if (dataTypes.includes('census')) {
      try {
        results.census = await fetchWithCache('census', async () => {
          const response = await fetch(`${req.protocol}://${req.get('host')}/api/census-acs-api?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`);
          const result = await response.json();
          return result.success ? result.data : null;
        });
      } catch (error) {
        errors.census = error.message;
      }
    }

    // Fetch CCNs data - need to get CCNs for all providers in the market
    if (dataTypes.includes('ccns') && provider.dhc) {
      try {
        results.ccns = await fetchWithCache('ccns', async () => {
          console.log('🔍 Starting CCN fetch for provider:', provider.dhc);
          
          // First get nearby providers to get all DHCs
          const providersResponse = await fetch(`${req.protocol}://${req.get('host')}/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`);
          const providersResult = await providersResponse.json();
          
          console.log('🔍 Nearby providers response:', {
            success: providersResult.success,
            providersCount: providersResult.data?.length || 0,
            error: providersResult.error
          });
          
          if (!providersResult.success) {
            throw new Error('Failed to fetch nearby providers for CCN lookup');
          }
          
          // Get all provider DHCs (main + nearby)
          const allProviderDhcs = [provider.dhc];
          providersResult.data.forEach(p => {
            if (p.dhc && !allProviderDhcs.includes(p.dhc)) {
              allProviderDhcs.push(p.dhc);
            }
          });
          
          console.log('🔍 Fetching CCNs for all providers:', {
            totalDhcs: allProviderDhcs.length,
            dhcSample: allProviderDhcs.slice(0, 5)
          });
          
          // Use BigQuery directly instead of internal HTTP request
          const dhcList = allProviderDhcs.map(dhc => `'${dhc}'`).join(',');
          const query = `
            SELECT DISTINCT dhc, ccn
            FROM \`market-mover-464517.provider.ccn_mapping\`
            WHERE dhc IN (${dhcList})
            AND ccn IS NOT NULL
            ORDER BY dhc, ccn
          `;
          
          console.log('🔍 Executing BigQuery CCN query for', allProviderDhcs.length, 'DHCs');
          
          const options = {
            query,
            location: "US",
          };
          
          const [rows] = await myBigQueryClient.query(options);
          
          console.log('🔍 BigQuery CCN response:', {
            rowsCount: rows.length,
            sampleRows: rows.slice(0, 3)
          });
          
          return rows;
        });
      } catch (error) {
        console.error('❌ Error fetching CCNs:', error);
        errors.ccns = error.message;
      }
    }

    // Fetch NPIs data - need to get NPIs for all providers in the market
    if (dataTypes.includes('npis') && provider.dhc) {
      try {
        results.npis = await fetchWithCache('npis', async () => {
          console.log('🔍 Starting NPI fetch for provider:', provider.dhc);
          
          // First get nearby providers to get all DHCs
          const providersResponse = await fetch(`${req.protocol}://${req.get('host')}/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`);
          const providersResult = await providersResponse.json();
          
          console.log('🔍 Nearby providers response for NPIs:', {
            success: providersResult.success,
            providersCount: providersResult.data?.length || 0,
            error: providersResult.error
          });
          
          if (!providersResult.success) {
            throw new Error('Failed to fetch nearby providers for NPI lookup');
          }
          
          // Get all provider DHCs (main + nearby)
          const allProviderDhcs = [provider.dhc];
          providersResult.data.forEach(p => {
            if (p.dhc && !allProviderDhcs.includes(p.dhc)) {
              allProviderDhcs.push(p.dhc);
            }
          });
          
          console.log('🔍 Fetching NPIs for all providers:', {
            totalDhcs: allProviderDhcs.length,
            dhcSample: allProviderDhcs.slice(0, 5)
          });
          
          // Use BigQuery directly instead of internal HTTP request
          const dhcList = allProviderDhcs.map(dhc => `'${dhc}'`).join(',');
          const query = `
            SELECT DISTINCT dhc, npi
            FROM \`market-mover-464517.provider.npi_mapping\`
            WHERE dhc IN (${dhcList})
            AND npi IS NOT NULL
            ORDER BY dhc, npi
          `;
          
          console.log('🔍 Executing BigQuery NPI query for', allProviderDhcs.length, 'DHCs');
          
          const options = {
            query,
            location: "US",
          };
          
          const [rows] = await myBigQueryClient.query(options);
          
          console.log('🔍 BigQuery NPI response:', {
            rowsCount: rows.length,
            sampleRows: rows.slice(0, 3)
          });
          
          return rows;
        });
      } catch (error) {
        console.error('❌ Error fetching NPIs:', error);
        errors.npis = error.message;
      }
    }

    // Fetch quality measures dates data - OPTIMIZED VERSION
    if (dataTypes.includes('qualityMeasuresDates')) {
      try {
        results.qualityMeasuresDates = await fetchWithCache('qualityMeasuresDates', async () => {
          // Direct BigQuery query to get latest publish date for each setting
          const query = `
            SELECT 
              d.setting,
              MAX(p.publish_date) as latest_date
            FROM \`market-mover-464517.quality.qm_dictionary\` d
            INNER JOIN \`market-mover-464517.quality.qm_post\` p ON d.code = p.code
            WHERE d.active = true 
              AND d.setting IS NOT NULL
            GROUP BY d.setting
            ORDER BY d.setting
          `;
          
          const options = {
            query,
            location: "US",
          };
          
          const [rows] = await myBigQueryClient.query(options);
          
          const datesBySetting = {};
          rows.forEach(row => {
            if (row.setting && row.latest_date) {
              // Convert date to string format
              const dateStr = typeof row.latest_date === 'string' 
                ? row.latest_date 
                : row.latest_date.value || String(row.latest_date);
              datesBySetting[row.setting] = dateStr;
            }
          });
          
          console.log('✅ Quality measures dates fetched (optimized):', {
            settings: Object.keys(datesBySetting),
            datesBySetting: datesBySetting,
            queryTime: '~50ms' // Should be very fast with these small tables
          });

          return datesBySetting;
        });
      } catch (error) {
        errors.qualityMeasuresDates = error.message;
      }
    }

    // Fetch quality measures data (basic)
    if (dataTypes.includes('qualityMeasures') && results.ccns?.length > 0) {
      try {
        const ccnList = results.ccns.map(row => row.ccn);
        results.qualityMeasures = await fetchWithCache('qualityMeasures', async () => {
          const response = await fetch(`${req.protocol}://${req.get('host')}/api/qm_combined`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: ccnList, 
              publish_date: 'latest' 
            })
          });
          const result = await response.json();
          return result.success ? result.data : null;
        });
      } catch (error) {
        errors.qualityMeasures = error.message;
      }
    }

    // Fetch enrollment data
    if (dataTypes.includes('enrollment') && results.census?.geographic_units) {
      try {
        const fipsList = results.census.geographic_units
          .map(unit => unit.county)
          .filter(Boolean)
          .slice(0, 5); // Limit to first 5 counties
        
        if (fipsList.length > 0) {
          results.enrollment = await fetchWithCache('enrollment', async () => {
            const response = await fetch(`${req.protocol}://${req.get('host')}/api/cms-enrollment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                fipsList, 
                year: new Date().getFullYear().toString() 
              })
            });
            const result = await response.json();
            return result.success ? result.data : [];
          });
        }
      } catch (error) {
        errors.enrollment = error.message;
      }
    }

    // Calculate performance metrics
    const totalCacheHits = Object.keys(cacheHits).length;
    const totalCacheMisses = Object.keys(cacheMisses).length;
    const totalRequests = totalCacheHits + totalCacheMisses;
    const cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests * 100).toFixed(1) : 0;

    console.log(`✅ Batch data complete: ${Object.keys(results).length}/${dataTypes.length} successful, ${Object.keys(errors).length} errors`);
    console.log(`📊 Cache performance: ${cacheHitRate}% hit rate (${totalCacheHits}/${totalRequests})`);

    res.json({
      success: true,
      data: results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      performance: {
        cacheHitRate: `${cacheHitRate}%`,
        cacheHits: totalCacheHits,
        cacheMisses: totalCacheMisses,
        totalRequests
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Batch data error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/batch-stats
 * Returns performance statistics for batch operations
 */
router.get("/batch-stats", (req, res) => {
  const stats = cache.getStats();
  res.json({
    success: true,
    cache: stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/batch-test
 * Simple test endpoint to verify batch route is working
 */
router.get("/batch-test", (req, res) => {
  res.json({
    success: true,
    message: "Batch route is working!",
    timestamp: new Date().toISOString()
  });
});

export default router;
