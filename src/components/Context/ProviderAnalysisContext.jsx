import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '../../utils/api';

const ProviderAnalysisContext = createContext();

export const useProviderAnalysis = () => {
  const context = useContext(ProviderAnalysisContext);
  if (!context) {
    throw new Error('useProviderAnalysis must be used within a ProviderAnalysisProvider');
  }
  return context;
};

export const ProviderAnalysisProvider = ({ children, provider, radiusInMiles }) => {
  // Core data states
  const [providers, setProviders] = useState([]);
  const [ccns, setCcns] = useState([]);
  const [npis, setNpis] = useState([]);
  const [censusData, setCensusData] = useState(null);
  const [counties, setCounties] = useState([]);
  const [censusTracts, setCensusTracts] = useState([]);
  const [qualityMeasuresDates, setQualityMeasuresDates] = useState({});
  
  // Quality measures data
  const [qualityMeasuresData, setQualityMeasuresData] = useState({
    measures: [],
    providerData: {},
    nationalAverages: {},
    marketAverages: {},
    allProviders: [],
    availableProviderTypes: [],
    availablePublishDates: [],
    currentPublishDate: null
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [ccnsLoading, setCcnsLoading] = useState(false);
  const [npisLoading, setNpisLoading] = useState(false);
  const [censusLoading, setCensusLoading] = useState(false);
  const [qualityMeasuresDatesLoading, setQualityMeasuresDatesLoading] = useState(false);
  const [qualityMeasuresLoading, setQualityMeasuresLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState(null);
  const [providersError, setProvidersError] = useState(null);
  const [ccnsError, setCcnsError] = useState(null);
  const [npisError, setNpisError] = useState(null);
  const [censusError, setCensusError] = useState(null);
  const [qualityMeasuresDatesError, setQualityMeasuresDatesError] = useState(null);
  const [qualityMeasuresError, setQualityMeasuresError] = useState(null);

  // Refs for request management
  const abortControllerRef = useRef(null);
  const dataCacheRef = useRef(new Map());

  // Helper functions
  const getAllProviderDhcs = useCallback(() => {
    const dhcs = [];
    if (provider?.dhc) dhcs.push(provider.dhc);
    providers.forEach(p => {
      if (p.dhc && !dhcs.includes(p.dhc)) dhcs.push(p.dhc);
    });
    return dhcs;
  }, [provider, providers]);

  const getAllCcns = useCallback(() => {
    return ccns.map(row => row.ccn);
  }, [ccns]);

  const getAllNpis = useCallback(() => {
    return npis.map(row => row.npi);
  }, [npis]);

  const getProviderDhcToCcns = useCallback(() => {
    const mapping = {};
    ccns.forEach(row => {
      if (!mapping[row.dhc]) mapping[row.dhc] = [];
      mapping[row.dhc].push(row.ccn);
    });
    return mapping;
  }, [ccns]);

  const getProviderDhcToNpis = useCallback(() => {
    const mapping = {};
    npis.forEach(row => {
      if (!mapping[row.dhc]) mapping[row.dhc] = [];
      mapping[row.dhc].push(row.npi);
    });
    return mapping;
  }, [npis]);

  // Fetch nearby providers
  const fetchProviders = useCallback(async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) return [];

    setProvidersLoading(true);
    setProvidersError(null);

    try {
      console.log('🔍 Fetching nearby providers for:', provider.dhc, 'at', provider.latitude, provider.longitude, 'radius:', radiusInMiles);
      
      const response = await fetch(apiUrl(`/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch nearby providers');
      
      console.log('✅ Nearby providers fetched:', result.data?.length || 0, 'providers');
      
      // Filter out the main provider from the results
      const filteredProviders = result.data.filter(p => p.dhc !== provider.dhc);
      console.log('🔍 After filtering:', filteredProviders.length, 'providers (filtered out main provider)');
      
      setProviders(filteredProviders);
      return filteredProviders;
    } catch (err) {
      console.error('Error fetching providers:', err);
      setProvidersError(err.message);
      setProviders([]);
      return [];
    } finally {
      setProvidersLoading(false);
    }
  }, [provider, radiusInMiles]);

  // Fetch CCNs for all providers
  const fetchCcns = useCallback(async (providerList) => {
    const dhcIds = [];
    
    // Add main provider DHC if it's numeric
    if (provider?.dhc && !isNaN(parseInt(provider.dhc))) {
      dhcIds.push(provider.dhc);
    }
    
    // Add all provider DHCs
    providerList.forEach(provider => {
      if (provider.dhc && !isNaN(parseInt(provider.dhc)) && !dhcIds.includes(provider.dhc)) {
        dhcIds.push(provider.dhc);
      }
    });
    
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
  }, [provider]);

  // Fetch NPIs for all providers
  const fetchNpis = useCallback(async (providerList) => {
    const dhcIds = [];
    
    // Add main provider DHC if it's numeric
    if (provider?.dhc && !isNaN(parseInt(provider.dhc))) {
      dhcIds.push(provider.dhc);
    }
    
    // Add all provider DHCs
    providerList.forEach(provider => {
      if (provider.dhc && !isNaN(parseInt(provider.dhc)) && !dhcIds.includes(provider.dhc)) {
        dhcIds.push(provider.dhc);
      }
    });
    
    if (dhcIds.length === 0) {
      setNpis([]);
      return [];
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
        return result.data || [];
      } else {
        setNpis([]);
        return [];
      }
    } catch (err) {
      console.error('Error fetching NPIs:', err);
      setNpisError(err.message);
      setNpis([]);
      return [];
    } finally {
      setNpisLoading(false);
    }
  }, [provider]);

  // Fetch census data
  const fetchCensusData = useCallback(async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) return null;

    setCensusLoading(true);
    setCensusError(null);

    try {
      console.log('🔍 Fetching census data for radius:', radiusInMiles);
      const response = await fetch(apiUrl(`/api/census-acs-api?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch census data');
      
      console.log('✅ Census data fetched:', result.data);
      setCensusData(result.data);
      
      // Extract counties and census tracts from geographic_units
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
      return result.data;
    } catch (err) {
      console.error('Error fetching census data:', err);
      setCensusError(err.message);
      setCensusData(null);
      return null;
    } finally {
      setCensusLoading(false);
    }
  }, [provider, radiusInMiles]);

  // Fetch quality measures dates
  const fetchQualityMeasuresDates = useCallback(async (ccnList) => {
    if (!ccnList || ccnList.length === 0) {
      setQualityMeasuresDates({});
      return {};
    }

    setQualityMeasuresDatesLoading(true);
    setQualityMeasuresDatesError(null);

    try {
      console.log('🔍 fetchQualityMeasuresDates called with CCNs:', ccnList.length);
      
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
              ccns: ccnList,
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
      if (Object.keys(datesBySetting).length === 0) {
        console.log('⚠️ No setting-specific dates found, using overall latest date');
        // Get overall latest date as fallback
        const fallbackResponse = await fetch(apiUrl('/api/qm_combined'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ccns: ccnList,
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
      console.log('✅ Quality measures dates fetched:', { settings: Object.keys(datesBySetting), datesBySetting });
      setQualityMeasuresDates(datesBySetting);
      return datesBySetting;
    } catch (err) {
      console.error('Error fetching quality measures dates:', err);
      setQualityMeasuresDatesError(err.message);
      setQualityMeasuresDates({});
      return {};
    } finally {
      setQualityMeasuresDatesLoading(false);
    }
  }, []);

  // Fetch quality measures data
  const fetchQualityMeasuresData = useCallback(async (ccnList, publishDate) => {
    if (!ccnList || ccnList.length === 0) {
      setQualityMeasuresData({
        measures: [],
        providerData: {},
        nationalAverages: {},
        marketAverages: {},
        allProviders: [],
        availableProviderTypes: [],
        availablePublishDates: [],
        currentPublishDate: null
      });
      return null;
    }

    setQualityMeasuresLoading(true);
    setQualityMeasuresError(null);

    try {
      console.log('🔍 Fetching combined quality measure data:', {
        providerDhc: provider?.dhc,
        allCcnsCount: ccnList.length,
        publish_date: publishDate
      });
      
      const response = await fetch(apiUrl('/api/qm_combined'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ccns: ccnList, 
          publish_date: publishDate 
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch combined quality measure data');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      const { measures, providerData, nationalAverages } = result.data;
      
      // Calculate market averages
      const marketAverages = {};
      if (ccns.length > 0) {
        const marketCcns = ccns.map(row => row.ccn).filter(Boolean);
        const marketRows = providerData.filter(d => marketCcns.includes(d.ccn));
        
        const marketAgg = {};
        marketRows.forEach(row => {
          if (!marketAgg[row.code]) {
            marketAgg[row.code] = { scoreSum: 0, percSum: 0, count: 0 };
          }
          marketAgg[row.code].scoreSum += row.score || 0;
          marketAgg[row.code].percSum += row.percentile_column || 0;
          marketAgg[row.code].count += 1;
        });
        
        Object.keys(marketAgg).forEach(code => {
          const agg = marketAgg[code];
          marketAverages[code] = {
            score: agg.count > 0 ? agg.scoreSum / agg.count : 0,
            percentile: agg.count > 0 ? agg.percSum / agg.count : 0,
            count: agg.count
          };
        });
      }
      
      // Get unique measure settings
      const uniqueSettings = Array.from(new Set(measures.map(m => m.setting).filter(Boolean)));
      
      // Get available publish dates
      const availableDates = Object.values(qualityMeasuresDates).sort().reverse();
      
      const qualityData = {
        measures,
        providerData,
        nationalAverages,
        marketAverages,
        allProviders: [provider, ...providers],
        availableProviderTypes: uniqueSettings,
        availablePublishDates: availableDates,
        currentPublishDate: publishDate
      };
      
      setQualityMeasuresData(qualityData);
      return qualityData;
    } catch (err) {
      console.error('Error fetching quality measures data:', err);
      setQualityMeasuresError(err.message);
      return null;
    } finally {
      setQualityMeasuresLoading(false);
    }
  }, [provider, providers, ccns, qualityMeasuresDates]);

  // Main effect to fetch all data
  useEffect(() => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) {
      setProviders([]);
      setCcns([]);
      setNpis([]);
      setCensusData(null);
      setCounties([]);
      setCensusTracts([]);
      setQualityMeasuresDates({});
      setQualityMeasuresData({
        measures: [],
        providerData: {},
        nationalAverages: {},
        marketAverages: {},
        allProviders: [],
        availableProviderTypes: [],
        availablePublishDates: [],
        currentPublishDate: null
      });
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
        // Fetch providers and census data in parallel
        const [providersResult, censusResult] = await Promise.all([
          fetchProviders(),
          fetchCensusData()
        ]);

        // Fetch CCNs and NPIs after providers are loaded
        const [ccnsResult, npisResult] = await Promise.all([
          fetchCcns(providersResult),
          fetchNpis(providersResult)
        ]);

        // Fetch quality measures dates after CCNs are loaded
        if (ccnsResult && ccnsResult.length > 0) {
          const ccnStrings = ccnsResult.map(row => row.ccn);
          console.log('🔍 About to fetch quality measures dates with CCNs:', ccnStrings.length);
          const datesResult = await fetchQualityMeasuresDates(ccnStrings);
          
          // Fetch quality measures data with the most recent date
          if (datesResult && Object.keys(datesResult).length > 0) {
            const mostRecentDate = Object.values(datesResult).sort().reverse()[0];
            await fetchQualityMeasuresData(ccnStrings, mostRecentDate);
          }
        } else {
          console.log('⚠️ No CCNs available for quality measures dates fetch');
        }

      } catch (err) {
        console.error('Error in provider analysis data fetch:', err);
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
  }, [provider?.latitude, provider?.longitude, radiusInMiles]);

  const value = {
    // Core data
    providers,
    ccns,
    npis,
    censusData,
    counties,
    censusTracts,
    qualityMeasuresDates,
    qualityMeasuresData,
    
    // Loading states
    loading,
    providersLoading,
    ccnsLoading,
    npisLoading,
    censusLoading,
    qualityMeasuresDatesLoading,
    qualityMeasuresLoading,
    
    // Error states
    error,
    providersError,
    ccnsError,
    npisError,
    censusError,
    qualityMeasuresDatesError,
    qualityMeasuresError,
    
    // Helper functions
    getAllProviderDhcs,
    getAllCcns,
    getAllNpis,
    getProviderDhcToCcns,
    getProviderDhcToNpis,
    
    // Context info
    provider,
    radiusInMiles
  };

  return (
    <ProviderAnalysisContext.Provider value={value}>
      {children}
    </ProviderAnalysisContext.Provider>
  );
};
