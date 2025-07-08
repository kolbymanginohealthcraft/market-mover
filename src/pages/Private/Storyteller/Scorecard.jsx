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

  // Filter measures by selected setting (if any) - this is the key change
  const filteredMeasures = finalMeasures.filter(m => {
    // If no filter is selected, show all measures
    if (!providerTypeFilter || providerTypeFilter === 'All') {
      return true;
    }
    
    // Infer setting from measure code since database setting field might be empty
    let inferredSetting = 'Other';
    if (m.code && m.code.includes('HOSPITAL')) inferredSetting = 'Hospital';
    else if (m.code && m.code.includes('SNF')) inferredSetting = 'SNF';
    else if (m.code && m.code.includes('HH')) inferredSetting = 'HH';
    else if (m.code && m.code.includes('HOSPICE')) inferredSetting = 'Hospice';
    else if (m.code && m.code.includes('IRF')) inferredSetting = 'IRF';
    else if (m.code && m.code.includes('LTCH')) inferredSetting = 'LTCH';
    else if (m.code && m.code.includes('CAH')) inferredSetting = 'Hospital';
    
    return inferredSetting === providerTypeFilter;
  });

  // Fallback: if no measures found for selected setting, show all measures
  const finalFilteredMeasures = filteredMeasures.length > 0 ? filteredMeasures : finalMeasures;

  // Show ALL providers, but only the measures that match the selected setting
  // This allows users to see all providers but only the relevant measures
  const filteredProviders = finalAllProviders;

  // Main provider for the scorecard (show all providers)
  const mainProviderInMatrix = filteredProviders.find(p => p.dhc === provider?.dhc);

  // DEBUG: Log filtering info
  console.log('🔍 Scorecard filtering:', {
    providerTypeFilter,
    totalMeasures: finalMeasures.length,
    filteredMeasuresCount: filteredMeasures.length,
    finalFilteredMeasuresCount: finalFilteredMeasures.length,
    totalProviders: finalAllProviders.length,
    filteredProvidersCount: filteredProviders.length,
    sampleMeasures: finalMeasures.slice(0, 3).map(m => ({ code: m.code, setting: m.setting, name: m.name })),
    filteredMeasures: filteredMeasures.map(m => ({ code: m.code, name: m.name })),
    finalFilteredMeasures: finalFilteredMeasures.map(m => ({ code: m.code, name: m.name })),
    mainProviderHasData: mainProviderInMatrix ? 'YES' : 'NO',
    competitorsCount: filteredProviders.filter(p => p.dhc !== provider?.dhc).length,
    // Debug: Show what measures are available for each setting
    allMeasuresBySetting: finalMeasures.reduce((acc, m) => {
      let setting = 'Other';
      if (m.code && m.code.includes('HOSPITAL')) setting = 'Hospital';
      else if (m.code && m.code.includes('SNF')) setting = 'SNF';
      else if (m.code && m.code.includes('HH')) setting = 'HH';
      else if (m.code && m.code.includes('HOSPICE')) setting = 'Hospice';
      else if (m.code && m.code.includes('IRF')) setting = 'IRF';
      else if (m.code && m.code.includes('LTCH')) setting = 'LTCH';
      else if (m.code && m.code.includes('CAH')) setting = 'CAH';
      else if (m.code && m.code.includes('OPPS')) setting = 'Outpatient';
      else setting = 'Other';
      
      if (!acc[setting]) acc[setting] = [];
      acc[setting].push(m.code);
      return acc;
    }, {}),
    // Debug: Show provider data availability
    providerDataDebug: finalAllProviders.slice(0, 5).map(provider => {
      const providerData = finalData[provider.dhc] || {};
      const hasFilteredData = filteredMeasures.some(measure => providerData[measure.code]);
      const measureCount = Object.keys(providerData).length;
      return {
        dhc: provider.dhc,
        name: provider.name,
        hasFilteredData,
        measureCount,
        sampleMeasures: Object.keys(providerData).slice(0, 3)
      };
    }),
    // Debug: Show what data the main provider has
    mainProviderData: provider ? {
      dhc: provider.dhc,
      name: provider.name,
      allMeasures: Object.keys(finalData[provider.dhc] || {}),
      filteredMeasures: filteredMeasures.filter(m => finalData[provider.dhc]?.[m.code]),
      hasFilteredData: filteredMeasures.some(m => finalData[provider.dhc]?.[m.code])
    } : null
  });

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
        competitors={filteredProviders.filter(p => p.dhc !== provider?.dhc)}
        measures={finalFilteredMeasures}
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