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
          // First get nearby providers to get all DHCs
          const providersResponse = await fetch(`${req.protocol}://${req.get('host')}/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`);
          const providersResult = await providersResponse.json();
          
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
          
          console.log('🔍 Fetching CCNs for all providers:', allProviderDhcs);
          
          // Now fetch CCNs for all providers
          const response = await fetch(`${req.protocol}://${req.get('host')}/api/related-ccns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: allProviderDhcs })
          });
          const result = await response.json();
          return result.success ? result.data : [];
        });
      } catch (error) {
        errors.ccns = error.message;
      }
    }

    // Fetch NPIs data - need to get NPIs for all providers in the market
    if (dataTypes.includes('npis') && provider.dhc) {
      try {
        results.npis = await fetchWithCache('npis', async () => {
          // First get nearby providers to get all DHCs
          const providersResponse = await fetch(`${req.protocol}://${req.get('host')}/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`);
          const providersResult = await providersResponse.json();
          
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
          
          console.log('🔍 Fetching NPIs for all providers:', allProviderDhcs);
          
          // Now fetch NPIs for all providers
          const response = await fetch(`${req.protocol}://${req.get('host')}/api/related-npis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: allProviderDhcs })
          });
          const result = await response.json();
          return result.success ? result.data : [];
        });
      } catch (error) {
        errors.npis = error.message;
      }
    }

    // Fetch quality measures dates data
    if (dataTypes.includes('qualityMeasuresDates') && results.ccns) {
      try {
        results.qualityMeasuresDates = await fetchWithCache('qualityMeasuresDates', async () => {
          // Get all CCNs to determine available dates
          const allCcns = results.ccns.map(row => row.ccn);
          
          if (allCcns.length === 0) {
            return {};
          }

          // Step 1: Get all measure settings from qm_dictionary first
          const settingsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/qm_dictionary`);
          const settingsResult = await settingsResponse.json();
          
          if (!settingsResult.success) {
            throw new Error('Failed to fetch quality measures settings');
          }

          const measures = settingsResult.data || [];
          
          // Step 2: Get unique settings from the dictionary
          const uniqueSettings = Array.from(new Set(measures.map(m => m.setting).filter(Boolean)));
          
          console.log('✅ Found settings from qm_dictionary:', uniqueSettings);

          let datesBySetting = {};

          // Step 3: For each setting, find the latest date that has data for that setting's measures
          for (const setting of uniqueSettings) {
            // Find measures for this setting
            const settingMeasures = measures.filter(m => m.setting === setting);
            
            if (settingMeasures.length > 0) {
              const settingMeasureCodes = settingMeasures.map(m => m.code);
              
              // Use the existing qm_combined endpoint with specific measures to get setting-specific dates
              const settingDatesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/qm_combined`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  ccns: allCcns,
                  publish_date: 'latest',
                  measures: settingMeasureCodes
                })
              });

              if (settingDatesResponse.ok) {
                const settingDatesResult = await settingDatesResponse.json();
                if (settingDatesResult.success && settingDatesResult.data.availableDates && settingDatesResult.data.availableDates.length > 0) {
                  // Use the latest date that has data for this setting
                  datesBySetting[setting] = settingDatesResult.data.availableDates[0];
                  console.log(`✅ ${setting} latest date:`, settingDatesResult.data.availableDates[0]);
                } else {
                  console.log(`⚠️ ${setting} no dates found, will use fallback`);
                }
              } else {
                console.log(`❌ ${setting} API failed`);
              }
            }
          }

          // Step 4: Add fallback for any settings that didn't get dates
          const settingsWithoutDates = uniqueSettings.filter(setting => !datesBySetting[setting]);
          
          if (settingsWithoutDates.length > 0) {
            console.log('⚠️ Some settings missing dates, using overall latest date for:', settingsWithoutDates);
            // Get overall latest date as fallback
            const fallbackResponse = await fetch(`${req.protocol}://${req.get('host')}/api/qm_combined`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ccns: allCcns,
                publish_date: 'latest'
              })
            });

            if (fallbackResponse.ok) {
              const fallbackResult = await fallbackResponse.json();
              if (fallbackResult.success && fallbackResult.data.availableDates && fallbackResult.data.availableDates.length > 0) {
                const fallbackDate = fallbackResult.data.availableDates[0];
                // Assign fallback date only to settings that don't have dates
                settingsWithoutDates.forEach(setting => {
                  datesBySetting[setting] = fallbackDate;
                });
                console.log(`📅 Using fallback date for missing settings:`, fallbackDate);
              }
            }
          }

          console.log('✅ Quality measures dates fetched:', {
            settings: Object.keys(datesBySetting),
            datesBySetting: datesBySetting
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
