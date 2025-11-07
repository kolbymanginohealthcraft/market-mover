import { memo, useState, useEffect } from "react";
import { useLocation, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";
import styles from "./Storyteller.module.css";

function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, mainProviderCcns, prefetchedData, providerLabels = {}, isLoading = false }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
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
          availableProviderTypes={finalProviderTypes}
          providerLabels={providerLabels}
          forcedLoading={isLoading}
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
          availableProviderTypes={finalProviderTypes}
          providerLabels={providerLabels}
        />
      } />
      <Route path="*" element={<Navigate to={`scorecard${location.search}`} replace />} />
    </Routes>
  );
}

export default memo(Storyteller);