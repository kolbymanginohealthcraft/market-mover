import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiUrl } from '../utils/api';

// Simple cache for API responses
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear cache on module load to ensure fresh data
apiCache.clear();

// Function to clear the client-side cache
export function clearClientCache() {
  apiCache.clear();
  console.log('🧹 Client-side cache cleared');
}

function getCacheKey(endpoint, params = {}) {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function getCachedData(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export default function useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate = null, qualityMeasuresDates = null, currentMeasureSetting = null) {
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [matrixMeasures, setMatrixMeasures] = useState([]);
  const [matrixData, setMatrixData] = useState({});
  const [matrixMarketAverages, setMatrixMarketAverages] = useState({});
  const [matrixNationalAverages, setMatrixNationalAverages] = useState({});
  const [matrixError, setMatrixError] = useState(null);
  const [allMatrixProviders, setAllMatrixProviders] = useState([]);
  const [matrixProviderIdToCcns, setMatrixProviderIdToCcns] = useState({});
  const [availableProviderTypes, setAvailableProviderTypes] = useState([]);
  const [availablePublishDates, setAvailablePublishDates] = useState([]);
  const [currentPublishDate, setCurrentPublishDate] = useState(null);

  // Debug logging for production troubleshooting
  useEffect(() => {
    console.log('🔍 useQualityMeasures Debug - Input params:', {
      hasProvider: !!provider,
      providerDhc: provider?.dhc,
      nearbyProvidersCount: nearbyProviders?.length || 0,
      nearbyDhcCcnsCount: nearbyDhcCcns?.length || 0,
      selectedPublishDate,
      hasQualityMeasuresDates: !!qualityMeasuresDates,
      qualityMeasuresDatesKeys: qualityMeasuresDates ? Object.keys(qualityMeasuresDates) : [],
      currentMeasureSetting
    });
  }, [provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate, qualityMeasuresDates, currentMeasureSetting]);

  // Memoize dependencies to prevent infinite re-renders
  const memoizedNearbyProviders = useMemo(() => nearbyProviders, [JSON.stringify(nearbyProviders)]);
  const memoizedNearbyDhcCcns = useMemo(() => nearbyDhcCcns, [JSON.stringify(nearbyDhcCcns)]);

       // Effect to update current publish date when measure setting changes
  useEffect(() => {
    if (qualityMeasuresDates && Object.keys(qualityMeasuresDates).length > 0 && currentMeasureSetting) {
      if (qualityMeasuresDates[currentMeasureSetting]) {
        const settingSpecificDate = qualityMeasuresDates[currentMeasureSetting];
        console.log('📅 Updating publish date for setting:', currentMeasureSetting, 'to:', settingSpecificDate);
        setCurrentPublishDate(settingSpecificDate);
        // Clear cache when measure setting changes to ensure fresh data
        apiCache.clear();
      } else {
        // Fallback to the most recent available date if the setting doesn't have a specific date
        const allDates = Object.values(qualityMeasuresDates).sort().reverse();
        console.log('📅 Setting not found, using fallback date:', allDates[0]);
        setCurrentPublishDate(allDates[0]);
        // Clear cache when measure setting changes to ensure fresh data
        apiCache.clear();
      }
    }
  }, [qualityMeasuresDates, currentMeasureSetting]);

  useEffect(() => {
    async function fetchMatrixData() {
      console.log('🔍 fetchMatrixData called with:', {
        hasProvider: !!provider,
        providerDhc: provider?.dhc,
        nearbyProvidersCount: memoizedNearbyProviders?.length || 0,
        nearbyDhcCcnsCount: memoizedNearbyDhcCcns?.length || 0
      });

      // Check if we have CCNs even without a real provider
      const hasCcns = memoizedNearbyDhcCcns && memoizedNearbyDhcCcns.length > 0;
      const isPlaceholderProvider = provider && provider.dhc === 'ccn-only';
      
      if (!provider && !hasCcns) {
        console.log('⚠️ No provider and no CCNs provided, clearing all data');
        setMatrixLoading(false);
        setMatrixMeasures([]);
        setMatrixData({});
        setMatrixMarketAverages({});
        setMatrixNationalAverages({});
        setMatrixError(null);
        setAllMatrixProviders([]);
        setMatrixProviderIdToCcns({});
        setAvailableProviderTypes([]);
        setAvailablePublishDates([]);
        setCurrentPublishDate(null);
        return;
      }
      
      // Cache is cleared when measure setting changes, so we don't need to clear it here
      
      setMatrixLoading(true);
      setMatrixError(null);
      
      try {
        // 1. Build all unique providers: main + all unique nearby (by dhc)
        // Skip placeholder providers in the provider list
        let allProviders = [];
        if (provider && !isPlaceholderProvider) {
          allProviders = [provider, ...memoizedNearbyProviders];
        } else {
          allProviders = [...memoizedNearbyProviders];
        }
        allProviders = allProviders.filter((p, idx, arr) => p && arr.findIndex(x => x.dhc === p.dhc) === idx);

        // 2. Build provider.dhc -> [ccn, ...] mapping from nearbyDhcCcns
        const providerDhcToCcns = {};
        
        console.log('🔍 Building CCN mapping from nearbyDhcCcns:', {
          nearbyDhcCcnsLength: memoizedNearbyDhcCcns?.length || 0,
          nearbyDhcCcns: memoizedNearbyDhcCcns,
          providerDhc: provider?.dhc,
          isPlaceholderProvider
        });
        
        (memoizedNearbyDhcCcns || []).forEach(row => {
          if (!providerDhcToCcns[row.dhc]) providerDhcToCcns[row.dhc] = [];
          // Ensure CCN is a string
          const ccnString = String(row.ccn);
          providerDhcToCcns[row.dhc].push(ccnString);
        });
        
        console.log('🔍 CCN mapping after processing nearbyDhcCcns:', providerDhcToCcns);
        
        // 3. If the main provider is not in nearbyDhcCcns, fetch its CCNs (only for numeric DHCs and not placeholder)
        if (provider && !isPlaceholderProvider && !providerDhcToCcns[provider.dhc] && !isNaN(parseInt(provider.dhc))) {
          console.log('🔍 Main provider not in nearbyDhcCcns, fetching CCNs for:', provider.dhc);
          const ccnResponse = await fetch(apiUrl('/api/related-ccns'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: [provider.dhc] })
          });
          if (!ccnResponse.ok) throw new Error('Failed to fetch main provider CCNs');
          const ccnResult = await ccnResponse.json();
          if (!ccnResult.success) throw new Error(ccnResult.error);
          ccnResult.data.forEach(row => {
            if (!providerDhcToCcns[row.dhc]) providerDhcToCcns[row.dhc] = [];
            providerDhcToCcns[row.dhc].push(row.ccn);
          });
          console.log('🔍 CCN mapping after fetching main provider CCNs:', providerDhcToCcns);
        }



        // 4. Only include providers with at least one CCN (or if we have CCNs from placeholder providers)
        const providersBeforeFilter = allProviders.length;
        if (isPlaceholderProvider || !provider) {
          // When using placeholder provider or no provider, we still want to process CCNs
          // Don't filter providers, but ensure we have CCNs
          console.log('🔍 Using CCN-only mode, skipping provider filtering');
        } else {
          allProviders = allProviders.filter(p => providerDhcToCcns[p.dhc] && providerDhcToCcns[p.dhc].length > 0);
        }
        
        console.log('🔍 Provider filtering results:', {
          providersBeforeFilter,
          providersAfterFilter: allProviders.length,
          allProviders: allProviders.map(p => ({ dhc: p.dhc, name: p.name })),
          providerDhcToCcns: providerDhcToCcns,
          isPlaceholderProvider
        });
        
        // 4b. Get unique measure settings for dropdown (instead of provider types)
        // This will be populated after we fetch the measures data

                 // 5. Get all CCNs for the combined request
         const allCcns = Object.values(providerDhcToCcns).flat();
         
         console.log('🔍 CCNs for quality measures:', {
           totalCcns: allCcns.length,
           ccnList: allCcns,
           providerDhcToCcns: providerDhcToCcns,
           allProviders: allProviders.map(p => ({ dhc: p.dhc, name: p.name }))
         });
        
        // 5b. Check if we have any CCNs before proceeding
        if (allCcns.length === 0) {
          console.log('⚠️ No CCNs found for any providers, skipping quality measures fetch');
          setMatrixError("No quality measure data available for providers in this market. This may be because the selected provider and nearby providers don't have CCNs in our database.");
          setMatrixLoading(false);
          return;
        }
        
        // 6. Use quality measures dates if provided, otherwise fetch them
        let availableDates = [];
        let publish_date;
        
        if (qualityMeasuresDates && Object.keys(qualityMeasuresDates).length > 0) {
          // Use the provided quality measures dates
          console.log('📅 Using provided quality measures dates:', qualityMeasuresDates);
          
          // Get all available dates from the quality measures dates object
          availableDates = Array.from(new Set(Object.values(qualityMeasuresDates))).sort().reverse();
          
          // Determine which publish date to use based on the current measure setting
          if (currentMeasureSetting && qualityMeasuresDates[currentMeasureSetting]) {
            publish_date = qualityMeasuresDates[currentMeasureSetting];
            console.log('📅 Using setting-specific date for', currentMeasureSetting, ':', publish_date);
          } else {
            // Fallback to the most recent available date
            publish_date = availableDates[0];
            console.log('📅 Setting not found, using fallback date:', publish_date);
          }
        } else {
          // Fallback: fetch available dates dynamically
          const datesResponse = await fetch(apiUrl('/api/qm_combined'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: allCcns, 
              publish_date: 'latest' 
            })
          });
          
          if (!datesResponse.ok) throw new Error('Failed to fetch available dates');
          const datesResult = await datesResponse.json();
          if (!datesResult.success) throw new Error(datesResult.error);
          
          availableDates = datesResult.data.availableDates || [];
          if (availableDates.length === 0) {
            setMatrixError("No quality measure data available for any publish date");
            setMatrixLoading(false);
            return;
          }
          
          // Determine which publish date to use
          if (selectedPublishDate && availableDates.includes(selectedPublishDate)) {
            publish_date = selectedPublishDate;
          } else {
            // Always use the most recent available date (availableDates is sorted chronologically)
            publish_date = availableDates[0];
          }
        }
        
        // 8. Check cache for combined data with the determined date and measure setting
        const cacheKey = getCacheKey('qm_combined', { 
          ccns: allCcns, 
          publish_date,
          measureSetting: currentMeasureSetting 
        });
        const cachedData = getCachedData(cacheKey);
        
        let combinedData;
        if (cachedData) {
          combinedData = cachedData;
        } else {
          // 9. Fetch all data in a single API call with the determined date
          console.log('🔍 Fetching quality measures data for', allCcns.length, 'CCNs with date:', publish_date);
          
          console.log('🔍 Making API call to /api/qm_combined with:', {
            ccnsCount: allCcns.length,
            publish_date,
            sampleCcns: allCcns.slice(0, 5)
          });

          const combinedResponse = await fetch(apiUrl('/api/qm_combined'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: allCcns, 
              publish_date 
            })
          });
          
          console.log('🔍 API response status:', combinedResponse.status, combinedResponse.statusText);
          
          if (!combinedResponse.ok) {
            const errorText = await combinedResponse.text();
            console.error('❌ API call failed:', errorText);
            throw new Error(`Failed to fetch combined quality measure data: ${combinedResponse.status} ${combinedResponse.statusText}`);
          }
          
          const combinedResult = await combinedResponse.json();
          console.log('🔍 API response data keys:', Object.keys(combinedResult));
          
          if (!combinedResult.success) {
            console.error('❌ API returned error:', combinedResult.error);
            throw new Error(combinedResult.error || 'Unknown API error');
          }
          
          combinedData = combinedResult.data;
          
          // Cache the result
          setCachedData(cacheKey, combinedData);
        }

        const { measures, providerData, nationalAverages } = combinedData;
        
        // 10. Set available publish dates and current publish date
        setAvailablePublishDates(availableDates);
        setCurrentPublishDate(publish_date);

        // 11. Check if we have valid data
        if (measures.length === 0) {
          console.log("⚠️ No quality measures found");
          // Clear the cache to prevent caching empty results
          apiCache.delete(cacheKey);
          setMatrixError("No quality measures available");
          setMatrixLoading(false);
          return;
        }
        


        // 10b. Get unique measure settings for dropdown
        const uniqueSettings = Array.from(new Set(measures.map(m => m.setting).filter(Boolean)));
        
        // If no settings found, try to infer from measure codes or use defaults
        if (uniqueSettings.length === 0) {
          // Try to infer settings from measure codes (common patterns)
          const inferredSettings = [];
          measures.forEach(m => {
            if (m.code && m.code.includes('HOSPITAL')) inferredSettings.push('Hospital');
            else if (m.code && m.code.includes('SNF')) inferredSettings.push('SNF');
            else if (m.code && m.code.includes('HH')) inferredSettings.push('HH');
            else if (m.code && m.code.includes('HOSPICE')) inferredSettings.push('Hospice');
            else if (m.code && m.code.includes('IRF')) inferredSettings.push('IRF');
            else if (m.code && m.code.includes('LTCH')) inferredSettings.push('LTCH');
            else if (m.code && m.code.includes('CAH')) inferredSettings.push('Hospital');
            else if (m.code && m.code.includes('OPPS')) inferredSettings.push('Outpatient');
            else inferredSettings.push('Other');
          });
          const uniqueInferred = Array.from(new Set(inferredSettings));
          setAvailableProviderTypes(uniqueInferred);
        } else {
          setAvailableProviderTypes(uniqueSettings);
        }

        // 11. Calculate market averages from the provider data
        let marketAverages = {};
        if (memoizedNearbyDhcCcns.length > 0) {
          const marketCcns = memoizedNearbyDhcCcns.map(row => row.ccn).filter(Boolean);
          const marketRows = providerData.filter(d => marketCcns.includes(d.ccn));
          
          // Aggregate in JS
          const marketAgg = {};
          marketRows.forEach(row => {
            if (!marketAgg[row.code]) {
              marketAgg[row.code] = { scoreSum: 0, percSum: 0, count: 0 };
            }
            marketAgg[row.code].scoreSum += row.score || 0;
            marketAgg[row.code].percSum += row.percentile_column || 0;
            marketAgg[row.code].count += 1;
          });
          Object.entries(marketAgg).forEach(([code, agg]) => {
            marketAverages[code] = {
              score: agg.count ? agg.scoreSum / agg.count : null,
              percentile: agg.count ? agg.percSum / agg.count : null,
            };
          });
        }

        // 12. Organize data for ProviderComparisonMatrix
        let dataByDhc = {};
        let providersWithData = 0;
        
        // Process all providers (real and placeholder)
        allProviders.forEach(p => {
          const ccns = providerDhcToCcns[p.dhc] || [];
          dataByDhc[p.dhc] = {};
          let providerHasData = false;
          measures.forEach(m => {
            // Aggregate quality measure data for all CCNs for this provider and measure
            const foundData = providerData.filter(d => ccns.includes(d.ccn) && d.code === m.code);
            if (foundData.length > 0) {
              providerHasData = true;
              // Average if multiple CCNs
              const avgScore = foundData.reduce((sum, d) => sum + (d.score || 0), 0) / foundData.length;
              const avgPercentile = foundData.reduce((sum, d) => sum + (d.percentile_column || 0), 0) / foundData.length;
              dataByDhc[p.dhc][m.code] = {
                score: avgScore,
                percentile: avgPercentile,
              };
            }
          });
          if (providerHasData) providersWithData++;
        });
        
        // Also process placeholder DHCs (like 'ccn-only') that aren't in allProviders
        // These are for manually entered CCNs
        Object.keys(providerDhcToCcns).forEach(dhc => {
          // Skip if already processed in allProviders
          if (allProviders.some(p => p.dhc === dhc)) return;
          
          // Only process placeholder DHCs
          if (dhc === 'ccn-only') {
            const ccns = providerDhcToCcns[dhc] || [];
            dataByDhc[dhc] = {};
            let providerHasData = false;
            measures.forEach(m => {
              // Aggregate quality measure data for all CCNs for this placeholder DHC and measure
              const foundData = providerData.filter(d => ccns.includes(d.ccn) && d.code === m.code);
              if (foundData.length > 0) {
                providerHasData = true;
                // Average if multiple CCNs
                const avgScore = foundData.reduce((sum, d) => sum + (d.score || 0), 0) / foundData.length;
                const avgPercentile = foundData.reduce((sum, d) => sum + (d.percentile_column || 0), 0) / foundData.length;
                dataByDhc[dhc][m.code] = {
                  score: avgScore,
                  percentile: avgPercentile,
                };
              }
            });
            if (providerHasData) providersWithData++;
          }
        });
        


        setMatrixMeasures(measures);
        setMatrixData(dataByDhc);
        setMatrixMarketAverages(marketAverages);
        setMatrixNationalAverages(nationalAverages);
        setMatrixLoading(false);

        // Save allProviders and providerDhcToCcns for filtering in render
        // Also include placeholder providers for manually entered CCNs
        const allProvidersWithPlaceholders = [...allProviders];
        if (isPlaceholderProvider && provider) {
          // Add the placeholder provider if it has data
          if (dataByDhc[provider.dhc] && Object.keys(dataByDhc[provider.dhc]).length > 0) {
            allProvidersWithPlaceholders.push(provider);
          }
        }
        // Also add any placeholder DHCs that have data
        Object.keys(providerDhcToCcns).forEach(dhc => {
          if (dhc === 'ccn-only' && 
              !allProvidersWithPlaceholders.some(p => p.dhc === dhc) &&
              dataByDhc[dhc] && Object.keys(dataByDhc[dhc]).length > 0) {
            allProvidersWithPlaceholders.push({
              dhc: dhc,
              name: 'CCN Selection',
              latitude: null,
              longitude: null
            });
          }
        });
        
        setAllMatrixProviders(allProvidersWithPlaceholders);
        setMatrixProviderIdToCcns(providerDhcToCcns);
      } catch (err) {
        console.error('❌ Error in fetchMatrixData:', err);
        console.error('❌ Error stack:', err.stack);
        console.error('❌ Error details:', {
          message: err.message,
          name: err.name,
          cause: err.cause
        });
        
        setMatrixError(err.message || 'Error loading matrix data');
        setMatrixLoading(false);
        
        // Set fallback data to prevent complete failure
        setMatrixMeasures([]);
        setMatrixData({});
        setMatrixMarketAverages({});
        setMatrixNationalAverages({});
        setAllMatrixProviders([]);
        setMatrixProviderIdToCcns({});
        setAvailableProviderTypes([]);
        setAvailablePublishDates([]);
        setCurrentPublishDate(null);
      }
    }
    fetchMatrixData();
  }, [provider, memoizedNearbyProviders, memoizedNearbyDhcCcns, selectedPublishDate, qualityMeasuresDates, currentMeasureSetting]);

  // Function to clear cache and force refresh
  const clearCache = useCallback(() => {
    apiCache.clear();
    console.log('🧹 Cache cleared, forcing refresh');
  }, []);

  return {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    matrixProviderIdToCcns,
    availableProviderTypes,
    availablePublishDates,
    currentPublishDate,
    clearCache
  };
} 