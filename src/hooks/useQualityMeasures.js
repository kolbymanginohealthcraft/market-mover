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
  // Normalize params for consistent cache keys
  const normalized = {
    ...params,
    ccns: params.ccns ? [...params.ccns].sort() : params.ccns
  };
  return `${endpoint}:${JSON.stringify(normalized)}`;
}

function getCachedData(cacheKey) {
  if (!cacheKey) return null;
  
  const cached = apiCache.get(cacheKey);
  if (!cached) return null;
  
  // Check if cache entry has expired
  const now = Date.now();
  if (cached.expiresAt && now > cached.expiresAt) {
    apiCache.delete(cacheKey);
    return null;
  }
  
  console.log('✅ Cache hit for:', cacheKey);
  return cached.data;
}

function setCachedData(cacheKey, data) {
  if (!cacheKey || !data) return;
  
  const expiresAt = Date.now() + CACHE_TTL;
  apiCache.set(cacheKey, {
    data,
    expiresAt,
    cachedAt: Date.now()
  });
  
  console.log('💾 Cached data for:', cacheKey, 'expires in', CACHE_TTL / 1000, 'seconds');
}

function normalizeCcn(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  return digits.padStart(6, '0');
}

function getCcnVariants(value) {
  if (value === null || value === undefined) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  const digits = raw.replace(/\D/g, '');
  const padded = digits ? digits.padStart(6, '0') : raw;
  const variants = new Set([raw]);
  if (digits) variants.add(digits);
  if (padded) variants.add(padded);
  return Array.from(variants);
}

export default function useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate = null, qualityMeasuresDates = null, currentMeasureSetting = null, providerLabels = {}) {
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
  const lastFetchKeyRef = useRef(null);

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

  // Memoize dependencies to prevent infinite re-renders without serializing full objects
  const nearbyProvidersKey = useMemo(() => (nearbyProviders || []).map(p => String(p?.dhc ?? '')).join('|'), [nearbyProviders]);
  const nearbyDhcCcnsKey = useMemo(() => (nearbyDhcCcns || []).map(row => `${String(row?.dhc ?? '')}:${String(row?.ccn ?? '')}`).join('|'), [nearbyDhcCcns]);
  const memoizedNearbyProviders = useMemo(() => nearbyProviders || [], [nearbyProvidersKey]);
  const memoizedNearbyDhcCcns = useMemo(() => nearbyDhcCcns || [], [nearbyDhcCcnsKey]);

       // Effect to update current publish date when measure setting changes
  // Note: This is now mainly for initial state. The fetchMatrixData function will fetch fresh dates
  // and set the correct currentPublishDate, so this is just a fallback for initial render
  useEffect(() => {
    if (qualityMeasuresDates && Object.keys(qualityMeasuresDates).length > 0 && currentMeasureSetting) {
      if (qualityMeasuresDates[currentMeasureSetting]) {
        const settingSpecificDate = qualityMeasuresDates[currentMeasureSetting];
        // Only set if we don't already have a more recent date
        setCurrentPublishDate(prev => {
          if (!prev || settingSpecificDate >= prev) {
            console.log('📅 Updating publish date for setting:', currentMeasureSetting, 'to:', settingSpecificDate);
            return settingSpecificDate;
          }
          return prev;
        });
        // Clear cache when measure setting changes to ensure fresh data
        apiCache.clear();
      } else {
        // Fallback to the most recent available date if the setting doesn't have a specific date
        const allDates = Object.values(qualityMeasuresDates).sort().reverse();
        const fallbackDate = allDates[0];
        setCurrentPublishDate(prev => {
          if (!prev || fallbackDate >= prev) {
            console.log('📅 Setting not found, using fallback date:', fallbackDate);
            return fallbackDate;
          }
          return prev;
        });
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
        const providerCcnSets = {};
        
        console.log('🔍 Building CCN mapping from nearbyDhcCcns:', {
          nearbyDhcCcnsLength: memoizedNearbyDhcCcns?.length || 0,
          nearbyDhcCcns: memoizedNearbyDhcCcns,
          providerDhc: provider?.dhc,
          isPlaceholderProvider
        });
        
        (memoizedNearbyDhcCcns || []).forEach(row => {
          const dhcKey = String(row.dhc);
          if (!providerCcnSets[dhcKey]) providerCcnSets[dhcKey] = new Set();
          getCcnVariants(row.ccn).forEach(variant => {
            const normalized = normalizeCcn(variant);
            if (normalized) {
              providerCcnSets[dhcKey].add(normalized);
            }
          });
        });
        
        console.log('🔍 CCN mapping after processing nearbyDhcCcns:', Object.fromEntries(Object.entries(providerCcnSets).map(([dhc, set]) => [dhc, Array.from(set)])));
        
        // 3. If the main provider is not in nearbyDhcCcns, fetch its CCNs (only for numeric DHCs and not placeholder)
        if (provider && !isPlaceholderProvider && provider.dhc && !providerCcnSets[String(provider.dhc)]) {
          console.log('🔍 Main provider not in nearbyDhcCcns, fetching CCNs for:', provider.dhc);
          const ccnResponse = await fetch(apiUrl('/api/related-ccns'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: [String(provider.dhc)] })
          });
          if (!ccnResponse.ok) throw new Error('Failed to fetch main provider CCNs');
          const ccnResult = await ccnResponse.json();
          if (!ccnResult.success) throw new Error(ccnResult.error);
          ccnResult.data.forEach(row => {
            const dhcKey = String(row.dhc);
            if (!providerCcnSets[dhcKey]) providerCcnSets[dhcKey] = new Set();
            getCcnVariants(row.ccn).forEach(variant => {
              const normalized = normalizeCcn(variant);
              if (normalized) {
                providerCcnSets[dhcKey].add(normalized);
              }
            });
          });
          console.log('🔍 CCN mapping after fetching main provider CCNs:', Object.fromEntries(Object.entries(providerCcnSets).map(([dhc, set]) => [dhc, Array.from(set)])));
        }

        const providerDhcToCcns = Object.fromEntries(
          Object.entries(providerCcnSets).map(([dhc, set]) => [dhc, Array.from(set)])
        );



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
        const ccnsForQuerySet = new Set();
        allCcns.forEach(ccn => {
          getCcnVariants(ccn).forEach(variant => {
            const normalizedVariant = normalizeCcn(variant) || String(variant);
            if (normalizedVariant) {
              ccnsForQuerySet.add(normalizedVariant);
            }
          });
        });
        const uniqueCcns = Array.from(ccnsForQuerySet);
         
         console.log('🔍 CCNs for quality measures:', {
          totalCcns: uniqueCcns.length,
          ccnList: uniqueCcns,
           providerDhcToCcns: providerDhcToCcns,
           allProviders: allProviders.map(p => ({ dhc: p.dhc, name: p.name }))
         });
        
        // 5b. Check if we have any CCNs before proceeding
        if (uniqueCcns.length === 0) {
          console.log('⚠️ No CCNs found for any providers, skipping quality measures fetch');
          setMatrixError("No quality measure data available for providers in this market. This may be because the selected provider and nearby providers don't have CCNs in our database.");
          setMatrixLoading(false);
          return;
        }
        
        // 6. Always fetch fresh dates from API to ensure we get the latest available dates
        // If a measure setting is selected, fetch setting-specific dates
        // This prevents using stale dates from prefetchedData when new data has been uploaded
        let availableDates = [];
        let publish_date;
        
        try {
          // If we have a measure setting, fetch setting-specific dates
          if (currentMeasureSetting) {
            console.log('📅 Fetching setting-specific dates for', currentMeasureSetting, 'with', uniqueCcns.length, 'CCNs');
            
            // First, get the measure codes for this setting from the dictionary
            const dictionaryResponse = await fetch(apiUrl('/api/qm_dictionary'), {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (dictionaryResponse.ok) {
              const dictionaryResult = await dictionaryResponse.json();
              if (dictionaryResult.success && dictionaryResult.data) {
                const measures = dictionaryResult.data || [];
                const settingMeasures = measures.filter(m => m.setting === currentMeasureSetting && m.active === true);
                
                if (settingMeasures.length > 0) {
                  const settingMeasureCodes = settingMeasures.map(m => m.code);
                  console.log(`📅 Found ${settingMeasureCodes.length} measures for ${currentMeasureSetting}`);
                  
                  // Fetch dates filtered by these specific measures
                  const datesResponse = await fetch(apiUrl('/api/qm_combined'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      ccns: uniqueCcns, 
                      publish_date: 'latest',
                      measures: settingMeasureCodes
                    })
                  });
                  
                  if (datesResponse.ok) {
                    const datesResult = await datesResponse.json();
                    if (datesResult.success && datesResult.data.availableDates) {
                      availableDates = datesResult.data.availableDates || [];
                      console.log(`📅 Setting-specific dates for ${currentMeasureSetting}:`, availableDates);
                    }
                  }
                }
              }
            }
            
            // If we didn't get setting-specific dates, fall through to general date fetch
            if (availableDates.length === 0) {
              console.log(`⚠️ No setting-specific dates found for ${currentMeasureSetting}, fetching general dates`);
            }
          }
          
          // If no setting-specific dates were found, fetch general dates
          if (availableDates.length === 0) {
            console.log('📅 Fetching fresh dates from API for', uniqueCcns.length, 'CCNs');
            const datesResponse = await fetch(apiUrl('/api/qm_combined'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ccns: uniqueCcns, 
                publish_date: 'latest' 
              })
            });
            
            if (!datesResponse.ok) throw new Error('Failed to fetch available dates');
            const datesResult = await datesResponse.json();
            if (!datesResult.success) throw new Error(datesResult.error);
            
            availableDates = datesResult.data.availableDates || [];
            console.log('📅 Fresh dates fetched from API:', availableDates);
          }
          
          if (availableDates.length === 0) {
            // Fallback to provided qualityMeasuresDates if API returns no dates
            if (qualityMeasuresDates && Object.keys(qualityMeasuresDates).length > 0) {
              console.log('⚠️ No dates from API, falling back to provided qualityMeasuresDates');
              availableDates = Array.from(new Set(Object.values(qualityMeasuresDates))).sort().reverse();
            } else {
              setMatrixError("No quality measure data available for any publish date");
              setMatrixLoading(false);
              return;
            }
          }
          
          // Determine which publish date to use
          // Always prefer the most recent date from the API to ensure we get the latest data
          // Only use selectedPublishDate if it's the most recent or if no dates are available
          const mostRecentDate = availableDates[0];
          if (selectedPublishDate && availableDates.includes(selectedPublishDate)) {
            // Use selectedPublishDate only if it's the most recent date or if user explicitly selected it
            // If there's a newer date available, prefer that instead
            if (selectedPublishDate >= mostRecentDate) {
              publish_date = selectedPublishDate;
              console.log('📅 Using selected publish date:', publish_date);
            } else {
              publish_date = mostRecentDate;
              console.log('📅 Using most recent date (newer than selected):', publish_date, 'vs selected:', selectedPublishDate);
            }
          } else {
            // Always use the most recent available date (availableDates is sorted chronologically)
            publish_date = mostRecentDate;
            console.log('📅 Using most recent available date:', publish_date);
          }
        } catch (datesError) {
          // Fallback to provided qualityMeasuresDates if API call fails
          console.warn('⚠️ Failed to fetch fresh dates, using provided qualityMeasuresDates:', datesError);
          if (qualityMeasuresDates && Object.keys(qualityMeasuresDates).length > 0) {
            availableDates = Array.from(new Set(Object.values(qualityMeasuresDates))).sort().reverse();
            
            if (currentMeasureSetting && qualityMeasuresDates[currentMeasureSetting]) {
              publish_date = qualityMeasuresDates[currentMeasureSetting];
              console.log('📅 Using setting-specific date from fallback for', currentMeasureSetting, ':', publish_date);
            } else {
              publish_date = availableDates[0];
              console.log('📅 Using fallback date:', publish_date);
            }
          } else {
            setMatrixError("Failed to fetch available dates and no fallback dates provided");
            setMatrixLoading(false);
            return;
          }
        }
        
        // 8. Check cache for combined data with the determined date and measure setting
        const sortedCcns = [...uniqueCcns].sort();
        const fetchKey = `${publish_date}|${currentMeasureSetting || 'ALL'}|${sortedCcns.join(',')}`;
        if (lastFetchKeyRef.current === fetchKey) {
          console.log('🛑 Skipping duplicate quality measures fetch for key:', fetchKey);
          setMatrixLoading(false);
          return;
        }

        const cacheKey = getCacheKey('qm_combined', { 
          ccns: uniqueCcns, 
          publish_date,
          measureSetting: currentMeasureSetting 
        });
        const cachedData = getCachedData(cacheKey);
        
        let combinedData;
        if (cachedData) {
          combinedData = cachedData;
        } else {
          // 9. Fetch all data in a single API call with the determined date
          console.log('🔍 Fetching quality measures data for', uniqueCcns.length, 'CCNs with date:', publish_date);
          
          console.log('🔍 Making API call to /api/qm_combined with:', {
            ccnsCount: uniqueCcns.length,
            publish_date,
            sampleCcns: uniqueCcns.slice(0, 5)
          });

          const combinedResponse = await fetch(apiUrl('/api/qm_combined'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: uniqueCcns, 
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
        const normalizedProviderData = (providerData || []).map(row => ({
          ...row,
          ccn: normalizeCcn(row.ccn) || String(row.ccn)
        }));
        
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
          const marketCcns = memoizedNearbyDhcCcns
            .map(row => normalizeCcn(row.ccn) || String(row.ccn))
            .filter(Boolean);
          const marketRows = normalizedProviderData.filter(d => marketCcns.includes(d.ccn));
          
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
            const foundData = normalizedProviderData.filter(d => ccns.includes(d.ccn) && d.code === m.code);
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
              const foundData = normalizedProviderData.filter(d => ccns.includes(d.ccn) && d.code === m.code);
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
        lastFetchKeyRef.current = fetchKey;

        // Save allProviders and providerDhcToCcns for filtering in render
        // Also include placeholder providers for manually entered CCNs
        const tagContexts = {};
        if (provider && provider.context === 'tag') {
          tagContexts[provider.context] = true;
        }
        memoizedNearbyProviders.forEach(p => {
          if (p?.context === 'tag') {
            tagContexts[p.context] = true;
          }
        });

        const normalizedProviders = allProviders.map(p => {
          if (p?.context === 'tag') {
            const labelKey = p.dhc ? String(p.dhc) : null;
            const name = p.tagLabel || (labelKey && providerLabels?.[labelKey]) || p.name || `${p.context.charAt(0).toUpperCase() + p.context.slice(1)} Network`;
            return {
              ...p,
              name,
              source: 'tag'
            };
          }
          return p;
        });

        setAllMatrixProviders(normalizedProviders);
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