import useQualityMeasures from "../../../hooks/useQualityMeasures";
import ProviderComparisonMatrix from "../ProviderComparisonMatrix";
import styles from "./Scorecard.module.css";

console.log("Scorecard component mounted");

export default function Scorecard({ 
  provider, 
  radiusInMiles, 
  nearbyProviders, 
  nearbyDhcCcns, 
  prefetchedData,
  providerTypeFilter,
  setProviderTypeFilter,
  selectedPublishDate,
  setSelectedPublishDate
}) {
  // Use prefetched data if available and the selected publish date matches the current date, otherwise use the hook
  const usePrefetchedData = prefetchedData && 
    !prefetchedData.loading && 
    !prefetchedData.error && 
    selectedPublishDate === prefetchedData.currentDate;
  
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

  // Filter providers by selected type (if any)
  const filteredMatrixProviders = providerTypeFilter
    ? finalAllProviders.filter(p => p.type === providerTypeFilter)
    : finalAllProviders;

  // Main provider and competitors for the matrix
  const mainProviderInMatrix = filteredMatrixProviders.find(p => p.dhc === provider?.dhc);
  const competitorsInMatrix = filteredMatrixProviders.filter(p => p.dhc !== provider?.dhc);

  if (finalLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <div className={styles.loadingTitle}>
          {usePrefetchedData ? 'Loading Quality Measure Data...' : 'Loading Quality Measure Data...'}
        </div>
        <div className={styles.loadingSubtitle}>
          {usePrefetchedData ? 'Using prefetched data...' : 'Fetching provider comparisons, market averages, and national benchmarks'}
        </div>
      </div>
    );
  }

  if (finalError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>
          Error loading quality measure data
        </div>
        <div className={styles.errorMessage}>
          {finalError}
        </div>
        <button 
          onClick={() => {
            // Clear cache and retry
            clearCache();
            window.location.reload();
          }}
          className={styles.retryButton}
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
    <div className={styles.scorecardContainer}>
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
    </div>
  );
} 