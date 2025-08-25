import { useState, useEffect } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import Scorecard from "./Scorecard";
import Benchmarks from "./Benchmarks";
import styles from "./Storyteller.module.css";

export default function Storyteller({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, mainProviderCcns, prefetchedData }) {
  const location = useLocation();
  
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

  // Extract available options from prefetched data
  const availableProviderTypes = prefetchedData?.providerTypes || [];
  const availablePublishDates = prefetchedData?.publishDates || [];
  const currentPublishDate = prefetchedData?.currentDate || null;

  // Set default provider type filter when available types change
  useEffect(() => {
    if (availableProviderTypes.length > 0 && !providerTypeFilter) {
      // Default to SNF
      setProviderTypeFilter('SNF');
    }
  }, [availableProviderTypes]);

  // Set default publish date when available dates change
  useEffect(() => {
    if (availablePublishDates.length > 0 && !selectedPublishDate) {
      // Always use the most recent available date (availableDates is sorted chronologically)
      const defaultDate = availablePublishDates[0];
      setSelectedPublishDate(defaultDate);
    }
  }, [availablePublishDates]);

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
          availableProviderTypes={availableProviderTypes}
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
          availableProviderTypes={availableProviderTypes}
        />
      } />
      <Route path="*" element={<Navigate to="scorecard" replace />} />
    </Routes>
  );
}