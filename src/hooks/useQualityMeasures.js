import { useState, useEffect } from 'react';

export default function useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns) {
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [matrixMeasures, setMatrixMeasures] = useState([]);
  const [matrixData, setMatrixData] = useState({});
  const [matrixMarketAverages, setMatrixMarketAverages] = useState({});
  const [matrixNationalAverages, setMatrixNationalAverages] = useState({});
  const [matrixError, setMatrixError] = useState(null);
  const [allMatrixProviders, setAllMatrixProviders] = useState([]);
  const [matrixProviderIdToCcns, setMatrixProviderIdToCcns] = useState({});
  const [availableProviderTypes, setAvailableProviderTypes] = useState([]);

  useEffect(() => {
    async function fetchMatrixData() {
      if (!provider) {
        setMatrixLoading(false);
        return;
      }
      setMatrixLoading(true);
      setMatrixError(null);
      
      try {
        // 1. Fetch all measures (only active)
        const measuresResponse = await fetch('/api/qm_dictionary');
        if (!measuresResponse.ok) throw new Error('Failed to fetch measures');
        const measuresResult = await measuresResponse.json();
        if (!measuresResult.success) throw new Error(measuresResult.error);
        const measures = measuresResult.data;

        // 2. Build all unique providers: main + all unique nearby (by dhc)
        let allProviders = [provider, ...nearbyProviders];
        allProviders = allProviders.filter((p, idx, arr) => p && arr.findIndex(x => x.dhc === p.dhc) === idx);

        // 3. Build provider.dhc -> [ccn, ...] mapping from nearbyDhcCcns
        const providerDhcToCcns = {};
        (nearbyDhcCcns || []).forEach(row => {
          if (!providerDhcToCcns[row.provider_id]) providerDhcToCcns[row.provider_id] = [];
          providerDhcToCcns[row.provider_id].push(row.ccn);
        });
        
        // If the main provider is not in nearbyDhcCcns, fetch its CCNs
        if (!providerDhcToCcns[provider.dhc]) {
          const ccnResponse = await fetch('/api/ccns/by-dhc-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: [provider.dhc] })
          });
          if (!ccnResponse.ok) throw new Error('Failed to fetch main provider CCNs');
          const ccnResult = await ccnResponse.json();
          if (!ccnResult.success) throw new Error(ccnResult.error);
          ccnResult.data.forEach(row => {
            if (!providerDhcToCcns[row.provider_id]) providerDhcToCcns[row.provider_id] = [];
            providerDhcToCcns[row.provider_id].push(row.ccn);
          });
        }

        // 4. Only include providers with at least one CCN
        allProviders = allProviders.filter(p => providerDhcToCcns[p.dhc] && providerDhcToCcns[p.dhc].length > 0);
        
        // For now, let's include all providers and handle missing CCNs gracefully
        allProviders = allProviders.length > 0 ? allProviders : allProviders;

        // 4b. Get unique provider types for dropdown (from providers with CCN)
        const uniqueTypes = Array.from(new Set(allProviders.map(p => p.type).filter(Boolean)));
        setAvailableProviderTypes(uniqueTypes);

        // 5. Find latest publish_date
        const latestResponse = await fetch('/api/qm_post/latest');
        if (!latestResponse.ok) throw new Error('Failed to fetch latest publish date');
        const latestResult = await latestResponse.json();
        if (!latestResult.success) throw new Error(latestResult.error);
        const publish_date = latestResult.data.publish_date?.value || latestResult.data.publish_date;

        // 6. Fetch all quality measure data for these CCNs and measures
        const allCcns = Object.values(providerDhcToCcns).flat();
        
        const providerDataResponse = await fetch('/api/qm_provider/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ccns: allCcns, publish_date })
        });
        if (!providerDataResponse.ok) throw new Error('Failed to fetch provider quality measure data');
        const providerDataResult = await providerDataResponse.json();
        if (!providerDataResult.success) throw new Error(providerDataResult.error);
        const providerData = providerDataResult.data;
        
        // Check which CCNs have data vs which we requested
        const ccnsWithData = [...new Set(providerData.map(d => d.ccn))];
        
        // Check data distribution by CCN
        const ccnDataCount = {};
        providerData.forEach(d => {
          ccnDataCount[d.ccn] = (ccnDataCount[d.ccn] || 0) + 1;
        });

        // 7. Market averages (aggregate for all nearby providers' CCNs)
        let marketAverages = {};
        if (nearbyDhcCcns.length > 0) {
          const marketCcns = nearbyDhcCcns.map(row => row.ccn).filter(Boolean);
          const marketResponse = await fetch('/api/qm_provider/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ccns: marketCcns, publish_date })
          });
          if (!marketResponse.ok) throw new Error('Failed to fetch market quality measure data');
          const marketResult = await marketResponse.json();
          if (!marketResult.success) throw new Error(marketResult.error);
          const marketRows = marketResult.data;
          
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

        // 8. National averages from qm_post
        const nationalResponse = await fetch(`/api/qm_post/national-averages?publish_date=${publish_date}`);
        if (!nationalResponse.ok) throw new Error('Failed to fetch national averages');
        const nationalResult = await nationalResponse.json();
        if (!nationalResult.success) throw new Error(nationalResult.error);
        const nationalRows = nationalResult.data;
        
        // For percentiles, national average is 50th percentile by definition
        let nationalAverages = {};
        nationalRows.forEach(row => {
          nationalAverages[row.code] = {
            score: row.national,
            percentile: 0.5, // 50th percentile as 0.5
          };
        });

        // 9. Organize data for ProviderComparisonMatrix
        let dataByDhc = {};
        allProviders.forEach(p => {
          const ccns = providerDhcToCcns[p.dhc] || [];
          dataByDhc[p.dhc] = {};
          measures.forEach(m => {
            // Aggregate quality measure data for all CCNs for this provider and measure
            const foundData = providerData.filter(d => ccns.includes(d.ccn) && d.code === m.code);
            if (foundData.length > 0) {
              // Average if multiple CCNs
              const avgScore = foundData.reduce((sum, d) => sum + (d.score || 0), 0) / foundData.length;
              const avgPercentile = foundData.reduce((sum, d) => sum + (d.percentile_column || 0), 0) / foundData.length;
              dataByDhc[p.dhc][m.code] = {
                score: avgScore,
                percentile: avgPercentile,
              };
            }
          });
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
  }, [provider, nearbyProviders, nearbyDhcCcns]);

  return {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    matrixProviderIdToCcns,
    availableProviderTypes
  };
} 