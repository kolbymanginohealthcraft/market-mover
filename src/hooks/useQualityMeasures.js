import { useState, useEffect, useRef, useCallback } from 'react';

// Simple cache for API responses
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
          const ccnResponse = await fetch('/api/related-ccns', {
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

        // 4. Only include providers with at least one CCN
        allProviders = allProviders.filter(p => providerDhcToCcns[p.dhc] && providerDhcToCcns[p.dhc].length > 0);
        
        // 4b. Get unique provider types for dropdown
        const uniqueTypes = Array.from(new Set(allProviders.map(p => p.type).filter(Boolean)));
        setAvailableProviderTypes(uniqueTypes);

        // 5. Get all CCNs for the combined request
        const allCcns = Object.values(providerDhcToCcns).flat();
        
        // 6. Check cache for combined data
        const cacheKey = getCacheKey('qm_combined', { ccns: allCcns, publish_date: selectedPublishDate || 'latest' });
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
            publish_date: selectedPublishDate || 'latest'
          });
          
          const combinedResponse = await fetch('/api/qm_combined', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: allCcns, 
              publish_date: selectedPublishDate || 'latest' 
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
          // Use the most recent date as default
          publish_date = availableDates[0];
        }
        setCurrentPublishDate(publish_date);
        
        console.log('📅 Using publish date:', publish_date, 'from available dates:', availableDates);
        console.log('📊 Combined data received:', {
          measuresCount: measures.length,
          providerDataCount: providerData.length,
          nationalAveragesCount: Object.keys(nationalAverages).length,
          availableDatesCount: availableDates.length
        });

        // 10. Calculate market averages from the provider data
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

        // 11. Organize data for ProviderComparisonMatrix
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