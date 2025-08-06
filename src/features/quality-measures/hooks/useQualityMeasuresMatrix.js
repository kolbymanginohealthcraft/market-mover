import { useState, useEffect } from 'react';
import { apiUrl } from '../../../../utils/api';

export const useQualityMeasuresMatrix = (provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate, getCachedData, setCachedData) => {
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [matrixMeasures, setMatrixMeasures] = useState([]);
  const [matrixData, setMatrixData] = useState({});
  const [matrixMarketAverages, setMatrixMarketAverages] = useState({});
  const [matrixNationalAverages, setMatrixNationalAverages] = useState({});
  const [matrixError, setMatrixError] = useState(null);
  const [allMatrixProviders, setAllMatrixProviders] = useState([]);
  const [matrixProviderIdToCcns, setMatrixProviderIdToCcns] = useState({});

  const fetchMatrixData = async () => {
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

      // 4. Only include providers with at least one CCN
      allProviders = allProviders.filter(p => providerDhcToCcns[p.dhc] && providerDhcToCcns[p.dhc].length > 0);
      
      // 5. Get all CCNs for the combined request
      const allCcns = Object.values(providerDhcToCcns).flat();
      
      // 6. Check cache for combined data
      const cacheKey = getCachedData('qm_combined', { 
        ccns: allCcns, 
        publish_date: selectedPublishDate || '2025-04-01' 
      });

      if (cacheKey) {
        // Use cached data
        setMatrixData(cacheKey.matrixData);
        setMatrixMeasures(cacheKey.matrixMeasures);
        setMatrixMarketAverages(cacheKey.marketAverages);
        setMatrixNationalAverages(cacheKey.nationalAverages);
        setAllMatrixProviders(cacheKey.providers);
        setMatrixProviderIdToCcns(cacheKey.providerIdToCcns);
      } else {
        // Fetch fresh data
        const response = await fetch(apiUrl('/api/quality-measures/matrix'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ccns: allCcns,
            publish_date: selectedPublishDate || '2025-04-01'
          })
        });

        if (!response.ok) throw new Error('Failed to fetch matrix data');
        const result = await response.json();
        
        if (!result.success) throw new Error(result.error);

        // Cache the results
        setCachedData(cacheKey, {
          matrixData: result.matrixData,
          matrixMeasures: result.matrixMeasures,
          marketAverages: result.marketAverages,
          nationalAverages: result.nationalAverages,
          providers: allProviders,
          providerIdToCcns: providerDhcToCcns
        });

        setMatrixData(result.matrixData);
        setMatrixMeasures(result.matrixMeasures);
        setMatrixMarketAverages(result.marketAverages);
        setMatrixNationalAverages(result.nationalAverages);
        setAllMatrixProviders(allProviders);
        setMatrixProviderIdToCcns(providerDhcToCcns);
      }
    } catch (error) {
      console.error('Matrix data error:', error);
      setMatrixError(error.message);
    } finally {
      setMatrixLoading(false);
    }
  };

  return {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    matrixProviderIdToCcns,
    fetchMatrixData
  };
}; 