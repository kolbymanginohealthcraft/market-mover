import { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '../utils/api';

// Simple cache for API responses
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

export default function useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate = null) {
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

  useEffect(() => {
    async function fetchMatrixData() {
      if (!provider) {
        setMatrixLoading(false);
        return;
      }
      setMatrixLoading(true);
      setMatrixError(null);
      
      try {
        // 1. Build all unique providers: main + all unique nearby (by dhc)
        let allProviders = [provider, ...nearbyProviders];
        allProviders = allProviders.filter((p, idx, arr) => p && arr.findIndex(x => x.dhc === p.dhc) === idx);

        // 2. Build provider.dhc -> [ccn, ...] mapping from nearbyDhcCcns
        const providerDhcToCcns = {};
        (nearbyDhcCcns || []).forEach(row => {
          if (!providerDhcToCcns[row.dhc]) providerDhcToCcns[row.dhc] = [];
          providerDhcToCcns[row.dhc].push(row.ccn);
        });
        
        // 3. If the main provider is not in nearbyDhcCcns, fetch its CCNs
        if (!providerDhcToCcns[provider.dhc]) {
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
        }

        // DEBUG: Log CCNs for main provider
        console.log('🔍 Main provider CCNs:', {
          dhc: provider?.dhc,
          ccns: providerDhcToCcns[provider?.dhc] || [],
          allProviderDhcToCcns: Object.keys(providerDhcToCcns).length
        });

        // 4. Only include providers with at least one CCN
        allProviders = allProviders.filter(p => providerDhcToCcns[p.dhc] && providerDhcToCcns[p.dhc].length > 0);
        
        // 4b. Get unique measure settings for dropdown (instead of provider types)
        // This will be populated after we fetch the measures data

        // 5. Get all CCNs for the combined request
        const allCcns = Object.values(providerDhcToCcns).flat();
        
        // 6. Check cache for combined data
        const cacheKey = getCacheKey('qm_combined', { ccns: allCcns, publish_date: selectedPublishDate || '2025-04-01' });
        const cachedData = getCachedData(cacheKey);
        
        let combinedData;
        if (cachedData) {
          console.log('📦 Using cached combined data');
          combinedData = cachedData;
        } else {
          // 7. Fetch all data in a single API call
          console.log('🔍 Fetching combined quality measure data:', {
            providerDhc: provider?.dhc,
            allCcnsCount: allCcns.length,
            publish_date: selectedPublishDate || '2025-04-01'
          });
          
          const combinedResponse = await fetch(apiUrl('/api/qm_combined'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: allCcns, 
              publish_date: selectedPublishDate || '2025-04-01' 
            })
          });
          
          if (!combinedResponse.ok) throw new Error('Failed to fetch combined quality measure data');
          const combinedResult = await combinedResponse.json();
          if (!combinedResult.success) throw new Error(combinedResult.error);
          combinedData = combinedResult.data;
          
          // Cache the result
          setCachedData(cacheKey, combinedData);
        }

        const { measures, providerData, nationalAverages, availableDates } = combinedData;
        
        console.log('🔍 Combined data received:', {
          measuresCount: measures?.length || 0,
          providerDataCount: providerData?.length || 0,
          nationalAveragesCount: Object.keys(nationalAverages || {}).length,
          availableDatesCount: availableDates?.length || 0,
          availableDates: availableDates || []
        });
        
        // DEBUG: Log sample provider data to see what we're getting
        if (providerData && providerData.length > 0) {
          console.log('🔍 Sample provider data:', providerData.slice(0, 3));
          console.log('🔍 Provider data CCNs:', [...new Set(providerData.map(d => d.ccn))].slice(0, 10));
          console.log('🔍 Provider data codes:', [...new Set(providerData.map(d => d.code))].slice(0, 10));
        } else {
          console.log('⚠️ No provider data received');
        }
        
        // 8. Set available publish dates
        setAvailablePublishDates(availableDates);

        // 9. Check if we have valid data
        if (availableDates.length === 0) {
          console.log("⚠️ No available publish dates found");
          // Clear the cache to prevent caching empty results
          apiCache.delete(cacheKey);
          setMatrixError("No quality measure data available for any publish date");
          setMatrixLoading(false);
          return;
        }
        
        if (measures.length === 0) {
          console.log("⚠️ No quality measures found");
          // Clear the cache to prevent caching empty results
          apiCache.delete(cacheKey);
          setMatrixError("No quality measures available");
          setMatrixLoading(false);
          return;
        }
        
        // 10. Determine which publish date to use
        let publish_date;
        if (selectedPublishDate && availableDates.includes(selectedPublishDate)) {
          publish_date = selectedPublishDate;
        } else {
          // Default to April 2025 if available, otherwise use the most recent date
          const april2025 = '2025-04-01';
          publish_date = availableDates.includes(april2025) ? april2025 : availableDates[0];
        }
        setCurrentPublishDate(publish_date);
        
        // DEBUG: Log publish date selection
        console.log('📅 Publish date selection:', {
          selectedPublishDate,
          availableDates,
          chosenDate: publish_date,
          mainProviderCcns: providerDhcToCcns[provider?.dhc] || []
        });

        // 10b. Get unique measure settings for dropdown
        const uniqueSettings = Array.from(new Set(measures.map(m => m.setting).filter(Boolean)));
        
        // DEBUG: If no settings found, try to infer from measure codes or use defaults
        if (uniqueSettings.length === 0) {
          console.log('⚠️ No settings found in measures data, trying to infer from measure codes...');
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
          console.log('🔍 Inferred settings:', uniqueInferred);
          console.log('🔍 Sample measure codes for inference:', measures.slice(0, 10).map(m => m.code));
          setAvailableProviderTypes(uniqueInferred);
        } else {
          console.log('✅ Using settings from database:', uniqueSettings);
          setAvailableProviderTypes(uniqueSettings);
        }
        
        // DEBUG: Log measures data to see what fields are available
        console.log('🔍 Measures data sample:', measures.slice(0, 3));
        console.log('🔍 Unique settings found:', uniqueSettings);
        console.log('🔍 Settings from first 5 measures:', measures.slice(0, 5).map(m => ({ code: m.code, setting: m.setting, name: m.name })));
        
        console.log('📅 Using publish date:', publish_date, 'from available dates:', availableDates);
        console.log('📊 Combined data received:', {
          measuresCount: measures.length,
          providerDataCount: providerData.length,
          nationalAveragesCount: Object.keys(nationalAverages).length,
          availableDatesCount: availableDates.length
        });

        // 11. Calculate market averages from the provider data
        let marketAverages = {};
        if (nearbyDhcCcns.length > 0) {
          const marketCcns = nearbyDhcCcns.map(row => row.ccn).filter(Boolean);
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
        
        console.log('🏥 Provider data summary:', {
          totalProviders: allProviders.length,
          providersWithData,
          mainProviderDhc: provider?.dhc,
          mainProviderHasData: Object.keys(dataByDhc[provider?.dhc] || {}).length > 0
        });

        setMatrixMeasures(measures);
        setMatrixData(dataByDhc);
        setMatrixMarketAverages(marketAverages);
        setMatrixNationalAverages(nationalAverages);
        setMatrixLoading(false);

        // Save allProviders and providerDhcToCcns for filtering in render
        setAllMatrixProviders(allProviders);
        setMatrixProviderIdToCcns(providerDhcToCcns);
      } catch (err) {
        setMatrixError(err.message || 'Error loading matrix data');
        setMatrixLoading(false);
      }
    }
    fetchMatrixData();
  }, [provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate]);

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