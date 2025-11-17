import { memo, useState, useEffect, useMemo } from "react";
import { useLocation, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";
import useQualityMeasures from "../../../../hooks/useQualityMeasures";
import styles from "./Storyteller.module.css";

function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, mainProviderCcns, prefetchedData, providerLabels = {}, isLoading = false, showMyKpisOnly = false, myKpiCodes = [], highlightedDhcKeys = [], highlightedDhcByType = new Map(), highlightTagTypes = [], highlightPrimaryProvider = true }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Debug logging for production troubleshooting
  useEffect(() => {
    console.log('🔍 Storyteller Debug - Props received:', {
      hasProvider: !!provider,
      providerDhc: provider?.dhc,
      radiusInMiles,
      nearbyProvidersCount: nearbyProviders?.length || 0,
      nearbyDhcCcnsCount: nearbyDhcCcns?.length || 0,
      mainProviderCcnsCount: mainProviderCcns?.length || 0,
      hasPrefetchedData: !!prefetchedData,
      prefetchedDataKeys: prefetchedData ? Object.keys(prefetchedData) : [],
      qualityMeasuresDates: prefetchedData?.qualityMeasuresDates,
      providerTypes: prefetchedData?.providerTypes,
      publishDates: prefetchedData?.publishDates,
      currentDate: prefetchedData?.currentDate
    });
  }, [provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, mainProviderCcns, prefetchedData]);
  
  // Set body attribute for CSS overrides
  useEffect(() => {
    document.body.setAttribute('data-page', 'storyteller');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);
  
  // Move state management to this level so it can be shared between tabs
  const [providerTypeFilter, setProviderTypeFilter] = useState(null);
  const [selectedPublishDate, setSelectedPublishDate] = useState('');
  const [chartMode, setChartMode] = useState('snapshot');

  // Extract available options from prefetched data with fallbacks
  const availableProviderTypes = prefetchedData?.providerTypes || [];
  const availablePublishDates = prefetchedData?.publishDates || [];
  const currentPublishDate = prefetchedData?.currentDate || null;

  // Fallback data for production when prefetchedData is not available
  const fallbackProviderTypes = ['SNF', 'IRF', 'HH', 'Hospice', 'Hospital'];
  const fallbackPublishDates = ['2025-07-01', '2025-06-01', '2025-04-01'];
  const fallbackCurrentDate = '2025-07-01';

  // Use fallback data if prefetched data is not available
  const finalProviderTypes = availableProviderTypes.length > 0 ? availableProviderTypes : fallbackProviderTypes;
  const finalPublishDates = availablePublishDates.length > 0 ? availablePublishDates : fallbackPublishDates;
  const finalCurrentDate = currentPublishDate || fallbackCurrentDate;

  // Set default provider type filter when available types change
  useEffect(() => {
    if (finalProviderTypes.length > 0 && !providerTypeFilter) {
      // Default to SNF
      setProviderTypeFilter('SNF');
      console.log('🔍 Setting default provider type filter to SNF');
    }
  }, [finalProviderTypes, providerTypeFilter]);

  // Set default publish date when available dates change
  useEffect(() => {
    if (finalPublishDates.length > 0 && !selectedPublishDate) {
      // Always use the most recent available date (availableDates is sorted chronologically)
      const defaultDate = finalPublishDates[0];
      setSelectedPublishDate(defaultDate);
      console.log('🔍 Setting default publish date to:', defaultDate);
    }
  }, [finalPublishDates, selectedPublishDate]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 Storyteller State Debug:', {
      providerTypeFilter,
      selectedPublishDate,
      finalProviderTypes,
      finalPublishDates,
      finalCurrentDate,
      usingFallbackData: availableProviderTypes.length === 0 || availablePublishDates.length === 0
    });
  }, [providerTypeFilter, selectedPublishDate, finalProviderTypes, finalPublishDates, finalCurrentDate, availableProviderTypes, availablePublishDates]);

  // Determine if market filter is active (more than just the selected provider)
  const hasMarketFilter = useMemo(() => {
    if (!provider || !nearbyProviders || nearbyProviders.length === 0) return false;
    // If there are other providers besides the selected one, market filter is active
    return nearbyProviders.some(p => {
      const providerDhc = provider?.dhc ? String(provider.dhc) : null;
      const pDhc = p?.dhc ? String(p.dhc) : null;
      return pDhc && pDhc !== providerDhc;
    });
  }, [provider, nearbyProviders]);

  // Fetch quality measures data once at Storyteller level to share between tabs
  const qualityMeasuresData = useQualityMeasures(
    provider,
    nearbyProviders,
    nearbyDhcCcns,
    selectedPublishDate,
    prefetchedData?.qualityMeasuresDates,
    providerTypeFilter,
    providerLabels
  );

  // Remove provider query parameter when on scorecard page
  useEffect(() => {
    const isScorecard = location.pathname.includes('/scorecard') || 
                       (location.pathname.includes('/storyteller') && !location.pathname.includes('/benchmarks'));
    
    if (isScorecard && location.search.includes('provider=')) {
      const currentParams = new URLSearchParams(location.search);
      currentParams.delete('provider');
      const newSearch = currentParams.toString();
      setSearchParams(currentParams, { replace: true });
    }
  }, [location.pathname, location.search, setSearchParams]);

  return (
    <Routes>
      <Route path="scorecard" element={
        <Scorecard 
          provider={provider} 
          radiusInMiles={radiusInMiles} 
          nearbyProviders={nearbyProviders} 
          nearbyDhcCcns={nearbyDhcCcns} 
          mainProviderCcns={mainProviderCcns}
          prefetchedData={prefetchedData}
          providerTypeFilter={providerTypeFilter}
          setProviderTypeFilter={setProviderTypeFilter}
          selectedPublishDate={selectedPublishDate}
          setSelectedPublishDate={setSelectedPublishDate}
          chartMode={chartMode}
          setChartMode={setChartMode}
          availableProviderTypes={qualityMeasuresData.availableProviderTypes.length > 0 ? qualityMeasuresData.availableProviderTypes : finalProviderTypes}
          providerLabels={providerLabels}
          forcedLoading={isLoading || qualityMeasuresData.matrixLoading}
          showMyKpisOnly={showMyKpisOnly}
          myKpiCodes={myKpiCodes}
          highlightedDhcKeys={highlightedDhcKeys}
          highlightedDhcByType={highlightedDhcByType}
          highlightTagTypes={highlightTagTypes}
          highlightPrimaryProvider={highlightPrimaryProvider}
          qualityMeasuresData={qualityMeasuresData}
        />
      } />
      <Route path="benchmarks" element={
        <Benchmarks 
          provider={provider} 
          radiusInMiles={radiusInMiles} 
          nearbyProviders={nearbyProviders} 
          nearbyDhcCcns={nearbyDhcCcns} 
          mainProviderCcns={mainProviderCcns}
          prefetchedData={prefetchedData}
          providerTypeFilter={providerTypeFilter}
          setProviderTypeFilter={setProviderTypeFilter}
          selectedPublishDate={selectedPublishDate}
          setSelectedPublishDate={setSelectedPublishDate}
          availableProviderTypes={qualityMeasuresData.availableProviderTypes.length > 0 ? qualityMeasuresData.availableProviderTypes : finalProviderTypes}
          providerLabels={providerLabels}
          showMyKpisOnly={showMyKpisOnly}
          myKpiCodes={myKpiCodes}
          highlightedDhcKeys={highlightedDhcKeys}
          highlightedDhcByType={highlightedDhcByType}
          highlightTagTypes={highlightTagTypes}
          highlightPrimaryProvider={highlightPrimaryProvider}
          hasMarketFilter={hasMarketFilter}
          qualityMeasuresData={qualityMeasuresData}
        />
      } />
      <Route path="*" element={<Navigate to={`scorecard${location.search}`} replace />} />
    </Routes>
  );
}

export default memo(Storyteller);