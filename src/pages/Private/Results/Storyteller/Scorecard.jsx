import useQualityMeasures from "../../../../hooks/useQualityMeasures";
import ProviderComparisonMatrix from "./ProviderComparisonMatrix";
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
  setSelectedPublishDate,
  allCcns,
  allProviderDhcs
}) {
  // Always use the hook to ensure we get all providers, but use prefetched data if available
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
    provider, 
    nearbyProviders, 
    nearbyDhcCcns, 
    selectedPublishDate
  );

  // Always use the hook data to ensure we get all providers
  const finalLoading = matrixLoading;
  const finalMeasures = matrixMeasures;
  const finalData = matrixData;
  const finalMarketAverages = matrixMarketAverages;
  const finalNationalAverages = matrixNationalAverages;
  const finalError = matrixError;
  const finalAllProviders = allMatrixProviders;
  const finalProviderTypes = availableProviderTypes;
  const finalPublishDates = availablePublishDates;
  const finalCurrentDate = currentPublishDate;

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

  // Use only the filtered measures for display
  const finalFilteredMeasures = filteredMeasures;

  // Show all providers, regardless of whether they have data for the current measure setting
  const filteredProviders = finalAllProviders;

  // Main provider for the scorecard (always show the main provider)
  const mainProviderInMatrix = filteredProviders.find(p => p.dhc === provider?.dhc) || provider;

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
    mainProviderDhc: provider?.dhc,
    mainProviderInMatrixDhc: mainProviderInMatrix?.dhc,
    // Debug CCN data
    nearbyDhcCcnsCount: nearbyDhcCcns?.length || 0,
    nearbyDhcCcnsSample: nearbyDhcCcns?.slice(0, 5) || [],
    allCcnsCount: allCcns?.length || 0,
    allCcnsSample: allCcns?.slice(0, 10) || [],
    allProviderDhcsCount: allProviderDhcs?.length || 0,
    allProviderDhcsSample: allProviderDhcs?.slice(0, 5) || [],
    // Show all providers and their data availability
    allProviders: finalAllProviders.map(p => ({
      dhc: p.dhc,
      name: p.name,
      hasData: Object.keys(finalData[p.dhc] || {}).length > 0,
      measureCount: Object.keys(finalData[p.dhc] || {}).length,
      isMainProvider: p.dhc === provider?.dhc
    })),
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
      const hasFilteredData = finalFilteredMeasures.some(measure => providerData[measure.code]);
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
      filteredMeasures: finalFilteredMeasures.filter(m => finalData[provider.dhc]?.[m.code]),
      hasFilteredData: finalFilteredMeasures.some(m => finalData[provider.dhc]?.[m.code])
    } : null
  });

  if (finalLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <div className={styles.loadingTitle}>
          Loading Quality Measure Data...
        </div>
        <div className={styles.loadingSubtitle}>
          Fetching provider comparisons, market averages, and national benchmarks
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

  if (!finalMeasures.length) {
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