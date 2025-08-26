import { useEffect, useState, useRef } from "react";
import { apiUrl } from '../utils/api';

/**
 * useMarketAnalysis
 * 
 * Unified hook for market analysis data that works for both provider and market contexts.
 * Provides all necessary data sources: providers, CCNs, NPIs, census tracts, counties, etc.
 * 
 * @param {object} centerPoint - The center point object with latitude, longitude, and optional dhc
 * @param {number} radiusInMiles - The search radius in miles
 * @param {string} context - Either 'provider' or 'market' for context-specific behavior
 * @returns {object} All market analysis data and loading states
 */
export default function useMarketAnalysis(centerPoint, radiusInMiles, context = 'provider') {
  // Core data states
  const [providers, setProviders] = useState([]);
  const [ccns, setCcns] = useState([]);
  const [npis, setNpis] = useState([]);
  const [censusData, setCensusData] = useState(null);
  const [counties, setCounties] = useState([]);
  const [censusTracts, setCensusTracts] = useState([]);
  const [qualityMeasuresDates, setQualityMeasuresDates] = useState({});
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [ccnsLoading, setCcnsLoading] = useState(false);
  const [npisLoading, setNpisLoading] = useState(false);
  const [censusLoading, setCensusLoading] = useState(false);
  const [qualityMeasuresDatesLoading, setQualityMeasuresDatesLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState(null);
  const [providersError, setProvidersError] = useState(null);
  const [ccnsError, setCcnsError] = useState(null);
  const [npisError, setNpisError] = useState(null);
  const [censusError, setCensusError] = useState(null);
  const [qualityMeasuresDatesError, setQualityMeasuresDatesError] = useState(null);

  // Refs for request management
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Helper to get all provider DHCs (main + nearby)
  const getAllProviderDhcs = () => {
    const dhcs = [];
    // Only include numeric DHCs (exclude market IDs like 'market-123')
    if (centerPoint?.dhc && !isNaN(parseInt(centerPoint.dhc))) {
      dhcs.push(centerPoint.dhc);
    }
    providers.forEach(provider => {
      if (provider.dhc && !isNaN(parseInt(provider.dhc)) && !dhcs.includes(provider.dhc)) {
        dhcs.push(provider.dhc);
      }
    });
    return dhcs;
  };

  // Helper to get all CCNs
  const getAllCcns = () => {
    return ccns.map(row => row.ccn);
  };

  // Helper to get all NPIs
  const getAllNpis = () => {
    return npis.map(row => row.npi);
  };

  // Helper to get provider DHC to CCNs mapping
  const getProviderDhcToCcns = () => {
    const mapping = {};
    ccns.forEach(row => {
      if (!mapping[row.dhc]) {
        mapping[row.dhc] = [];
      }
      mapping[row.dhc].push(row.ccn);
    });
    return mapping;
  };

  // Helper to get provider DHC to NPIs mapping
  const getProviderDhcToNpis = () => {
    const mapping = {};
    npis.forEach(row => {
      if (!mapping[row.dhc]) {
        mapping[row.dhc] = [];
      }
      mapping[row.dhc].push(row.npi);
    });
    return mapping;
  };

  // Fetch nearby providers
  const fetchProviders = async () => {
    if (!centerPoint?.latitude || !centerPoint?.longitude || !radiusInMiles) {
      setProviders([]);
      return;
    }

    setProvidersLoading(true);
    setProvidersError(null);

    try {
      console.log('🔍 Fetching nearby providers for:', centerPoint.dhc || 'market', 'radius:', radiusInMiles);
      
      const response = await fetch(apiUrl(`/api/nearby-providers?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&radius=${radiusInMiles}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch nearby providers');
      
      console.log('✅ Nearby providers fetched:', result.data?.length || 0, 'providers', 'context:', context);
      
      // Filter out the main provider from the results if in provider context
      let filteredProviders = result.data;
      if (context === 'provider' && centerPoint.dhc) {
        filteredProviders = result.data.filter(p => p.dhc !== centerPoint.dhc);
      }
      
      console.log('🔍 After filtering:', filteredProviders.length, 'providers (filtered out main provider:', context === 'provider' && centerPoint.dhc ? 'yes' : 'no', ')');
      setProviders(filteredProviders);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setProvidersError(err.message);
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

     // Fetch CCNs for all providers
   const fetchCcns = async () => {
     // Get DHCs directly from the center point and the providers that were fetched
     const dhcIds = [];
     
     // Add main provider DHC if it's numeric
     if (centerPoint?.dhc && !isNaN(parseInt(centerPoint.dhc))) {
       dhcIds.push(centerPoint.dhc);
     }
     
     // Get DHCs from the providers that were fetched in fetchProviders
     // We need to get this from the API response, not the state
     try {
       const response = await fetch(apiUrl(`/api/nearby-providers?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&radius=${radiusInMiles}`));
       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
       const result = await response.json();
       if (result.success) {
         // Add all provider DHCs (including the main provider)
         result.data.forEach(provider => {
           if (provider.dhc && !isNaN(parseInt(provider.dhc)) && !dhcIds.includes(provider.dhc)) {
             dhcIds.push(provider.dhc);
           }
         });
       }
     } catch (err) {
       console.error('Error getting provider DHCs for CCN fetch:', err);
     }
     
     if (dhcIds.length === 0) {
       setCcns([]);
       return [];
     }

     setCcnsLoading(true);
     setCcnsError(null);

     try {
       console.log('🔍 Fetching CCNs for', dhcIds.length, 'providers');
       const response = await fetch(apiUrl('/api/related-ccns'), {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ dhc_ids: dhcIds })
       });
       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
       const result = await response.json();
       if (result.success) {
         setCcns(result.data || []);
         console.log('✅ CCNs fetched:', result.data?.length || 0, 'CCNs');
         return result.data || [];
       } else {
         setCcns([]);
         return [];
       }
     } catch (err) {
       console.error('Error fetching CCNs:', err);
       setCcnsError(err.message);
       setCcns([]);
       return [];
     } finally {
       setCcnsLoading(false);
     }
   };

  // Fetch NPIs for all providers
  const fetchNpis = async () => {
    // Get DHCs directly from the center point and the providers that were fetched
    const dhcIds = [];
    
    // Add main provider DHC if it's numeric
    if (centerPoint?.dhc && !isNaN(parseInt(centerPoint.dhc))) {
      dhcIds.push(centerPoint.dhc);
    }
    
    // Get DHCs from the providers that were fetched in fetchProviders
    // We need to get this from the API response, not the state
    try {
      const response = await fetch(apiUrl(`/api/nearby-providers?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&radius=${radiusInMiles}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        // Add all provider DHCs (including the main provider)
        result.data.forEach(provider => {
          if (provider.dhc && !isNaN(parseInt(provider.dhc)) && !dhcIds.includes(provider.dhc)) {
            dhcIds.push(provider.dhc);
          }
        });
      }
    } catch (err) {
      console.error('Error getting provider DHCs for NPI fetch:', err);
    }
    
    if (dhcIds.length === 0) {
      setNpis([]);
      return;
    }

    setNpisLoading(true);
    setNpisError(null);

    try {
      console.log('🔍 Fetching NPIs for', dhcIds.length, 'providers');
      const response = await fetch(apiUrl('/api/related-npis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dhc_ids: dhcIds })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setNpis(result.data || []);
        console.log('✅ NPIs fetched:', result.data?.length || 0, 'NPIs');
      } else {
        setNpis([]);
      }
    } catch (err) {
      console.error('Error fetching NPIs:', err);
      setNpisError(err.message);
      setNpis([]);
    } finally {
      setNpisLoading(false);
    }
  };

  // Fetch census data
  const fetchCensusData = async () => {
    if (!centerPoint?.latitude || !centerPoint?.longitude || !radiusInMiles) {
      setCensusData(null);
      return;
    }

    setCensusLoading(true);
    setCensusError(null);

    try {
      console.log('🔍 Fetching census data for radius:', radiusInMiles);
      const response = await fetch(apiUrl(`/api/census-acs-api?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&radius=${radiusInMiles}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setCensusData(result.data);
        
        // Extract counties and census tracts from the data
        const geographicUnits = result.data?.geographic_units || [];
        const uniqueCounties = new Set();
        const uniqueTracts = new Set();
        
        geographicUnits.forEach(unit => {
          if (unit.state && unit.county) {
            const countyKey = `${unit.state}-${unit.county}`;
            uniqueCounties.add(countyKey);
          }
          if (unit.tract) {
            uniqueTracts.add(unit.tract);
          }
        });
        
        setCounties(Array.from(uniqueCounties));
        setCensusTracts(Array.from(uniqueTracts));
        
        console.log('✅ Census data fetched:', {
          counties: uniqueCounties.size,
          tracts: uniqueTracts.size,
          totalPopulation: result.data?.market_totals?.total_population || 0
        });
      } else {
        setCensusData(null);
      }
    } catch (err) {
      console.error('Error fetching census data:', err);
      setCensusError(err.message);
      setCensusData(null);
    } finally {
      setCensusLoading(false);
    }
  };

           // Fetch quality measures dates for all measure settings
    const fetchQualityMeasuresDates = async (ccnsToUse = null) => {
      setQualityMeasuresDatesLoading(true);
      setQualityMeasuresDatesError(null);

      try {
        // Get all CCNs to determine available dates
        const allCcns = ccnsToUse || getAllCcns();
        
        console.log('🔍 fetchQualityMeasuresDates called with CCNs:', allCcns.length);
        
        if (allCcns.length === 0) {
          console.log('⚠️ No CCNs available for quality measures dates fetch');
          setQualityMeasuresDates({});
          return;
        }

        // Step 1: Get all measure settings from qm_dictionary first
        const settingsResponse = await fetch(apiUrl('/api/qm_dictionary'), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!settingsResponse.ok) {
          throw new Error('Failed to fetch quality measures settings');
        }

        const settingsResult = await settingsResponse.json();
        if (!settingsResult.success) {
          throw new Error(settingsResult.error || 'Failed to fetch quality measures settings');
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
            const settingDatesResponse = await fetch(apiUrl('/api/qm_combined'), {
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
       
        setQualityMeasuresDates(datesBySetting);

        // Step 4: Add fallback for any settings that didn't get dates
        if (Object.keys(datesBySetting).length === 0) {
          console.log('⚠️ No setting-specific dates found, using overall latest date');
          // Get overall latest date as fallback
          const fallbackResponse = await fetch(apiUrl('/api/qm_combined'), {
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
              // Assign fallback date to all settings
              uniqueSettings.forEach(setting => {
                datesBySetting[setting] = fallbackDate;
              });
              console.log(`📅 Using fallback date for all settings:`, fallbackDate);
            }
          }
        }

        console.log('✅ Quality measures dates fetched:', {
          settings: Object.keys(datesBySetting),
          datesBySetting: datesBySetting
        });

      } catch (err) {
        console.error('Error fetching quality measures dates:', err);
        setQualityMeasuresDatesError(err.message);
        setQualityMeasuresDates({});
      } finally {
        setQualityMeasuresDatesLoading(false);
      }
    };

  // Main effect to fetch all data
  useEffect(() => {
    if (!centerPoint?.latitude || !centerPoint?.longitude || !radiusInMiles) {
      setProviders([]);
      setCcns([]);
      setNpis([]);
      setCensusData(null);
      setCounties([]);
      setCensusTracts([]);
      setQualityMeasuresDates({});
      return;
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

         const fetchAllData = async () => {
       try {
         // Fetch all data in parallel
         await Promise.all([
           fetchProviders(),
           fetchCensusData()
         ]);

         // Fetch CCNs and NPIs after providers are loaded
         const [ccnsResult, npisResult] = await Promise.all([
           fetchCcns(),
           fetchNpis()
         ]);

                // Fetch quality measures dates after CCNs are loaded
       // Use the CCNs returned from fetchCcns
       if (ccnsResult && ccnsResult.length > 0) {
         const ccnStrings = ccnsResult.map(row => row.ccn);
         console.log('🔍 About to fetch quality measures dates with CCNs:', ccnStrings.length);
         await fetchQualityMeasuresDates(ccnStrings);
       } else {
         console.log('⚠️ No CCNs available for quality measures dates fetch');
       }

       } catch (err) {
         console.error('Error in market analysis data fetch:', err);
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

    fetchAllData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [centerPoint?.latitude, centerPoint?.longitude, radiusInMiles, context]);

  return {
    // Core data
    providers,
    ccns,
    npis,
    censusData,
    counties,
    censusTracts,
    qualityMeasuresDates,
    
    // Loading states
    loading,
    providersLoading,
    ccnsLoading,
    npisLoading,
    censusLoading,
    qualityMeasuresDatesLoading,
    
    // Error states
    error,
    providersError,
    ccnsError,
    npisError,
    censusError,
    qualityMeasuresDatesError,
    
    // Helper functions
    getAllProviderDhcs,
    getAllCcns,
    getAllNpis,
    getProviderDhcToCcns,
    getProviderDhcToNpis,
    
    // Context info
    context,
    centerPoint,
    radiusInMiles
  };
}
