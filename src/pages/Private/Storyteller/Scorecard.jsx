import { useState } from "react";
import useQualityMeasures from "../../../hooks/useQualityMeasures";
import ProviderComparisonMatrix from "../ProviderComparisonMatrix";

console.log("Scorecard component mounted");

export default function Scorecard({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, prefetchedData }) {
  const [providerTypeFilter, setProviderTypeFilter] = useState('');
  const [selectedPublishDate, setSelectedPublishDate] = useState(null);

  // Use prefetched data if available, otherwise use the hook
  const usePrefetchedData = prefetchedData && !prefetchedData.loading && !prefetchedData.error;
  
  const {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    availableProviderTypes,
    availablePublishDates,
    currentPublishDate,
    clearCache
  } = useQualityMeasures(
    usePrefetchedData ? null : provider, 
    usePrefetchedData ? null : nearbyProviders, 
    usePrefetchedData ? null : nearbyDhcCcns, 
    selectedPublishDate
  );

  // Use prefetched data when available
  const finalLoading = usePrefetchedData ? false : matrixLoading;
  const finalMeasures = usePrefetchedData ? prefetchedData.measures : matrixMeasures;
  const finalData = usePrefetchedData ? prefetchedData.data : matrixData;
  const finalMarketAverages = usePrefetchedData ? prefetchedData.marketAverages : matrixMarketAverages;
  const finalNationalAverages = usePrefetchedData ? prefetchedData.nationalAverages : matrixNationalAverages;
  const finalError = usePrefetchedData ? prefetchedData.error : matrixError;
  const finalAllProviders = usePrefetchedData ? prefetchedData.allProviders : allMatrixProviders;
  const finalProviderTypes = usePrefetchedData ? prefetchedData.providerTypes : availableProviderTypes;
  const finalPublishDates = usePrefetchedData ? prefetchedData.publishDates : availablePublishDates;
  const finalCurrentDate = usePrefetchedData ? prefetchedData.currentDate : currentPublishDate;

  // Set default provider type filter when available types change
  if (finalProviderTypes.length > 0 && !providerTypeFilter) {
    setProviderTypeFilter(finalProviderTypes[0]);
  }

  // Filter providers by selected type (if any)
  const filteredMatrixProviders = providerTypeFilter
    ? finalAllProviders.filter(p => p.type === providerTypeFilter)
    : finalAllProviders;

  // Main provider and competitors for the matrix
  const mainProviderInMatrix = filteredMatrixProviders.find(p => p.dhc === provider?.dhc);
  const competitorsInMatrix = filteredMatrixProviders.filter(p => p.dhc !== provider?.dhc);

  if (finalLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        padding: '2rem',
        color: '#666'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #265947', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
          {usePrefetchedData ? 'Loading Quality Measure Data...' : 'Loading Quality Measure Data...'}
        </div>
        <div style={{ fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px' }}>
          {usePrefetchedData ? 'Using prefetched data...' : 'Fetching provider comparisons, market averages, and national benchmarks'}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (finalError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        padding: '2rem',
        color: '#666'
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem', color: '#d32f2f' }}>
          Error loading quality measure data
        </div>
        <div style={{ fontSize: '0.9rem', textAlign: 'center', maxWidth: '400px', marginBottom: '1rem' }}>
          {finalError}
        </div>
        <button 
          onClick={() => {
            // Clear cache and retry
            clearCache();
            window.location.reload();
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#265947',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!mainProviderInMatrix || !finalMeasures.length) {
    return <div>No quality measure data available for this provider.</div>;
  }

  return (
    <ProviderComparisonMatrix
      provider={mainProviderInMatrix}
      competitors={competitorsInMatrix}
      measures={finalMeasures}
      data={finalData}
      marketAverages={finalMarketAverages}
      nationalAverages={finalNationalAverages}
      publishDate={finalCurrentDate}
      providerTypeFilter={providerTypeFilter}
      setProviderTypeFilter={setProviderTypeFilter}
      availableProviderTypes={finalProviderTypes}
      availablePublishDates={finalPublishDates}
      selectedPublishDate={selectedPublishDate}
      setSelectedPublishDate={setSelectedPublishDate}
    />
  );
} 