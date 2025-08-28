import useQualityMeasures from "../../../../hooks/useQualityMeasures";
import ProviderComparisonMatrix from "./ProviderComparisonMatrix";
import styles from "./Scorecard.module.css";

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
  availableProviderTypes
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
    availableProviderTypes: hookProviderTypes,
    availablePublishDates,
    currentPublishDate,
    clearCache
  } = useQualityMeasures(
    provider, 
    nearbyProviders, 
    nearbyDhcCcns, 
    selectedPublishDate,
    prefetchedData?.qualityMeasuresDates,
    providerTypeFilter
  );

  // Always use the hook data to ensure we get all providers
  const finalLoading = matrixLoading;
  const finalMeasures = matrixMeasures;
  const finalData = matrixData;
  const finalMarketAverages = matrixMarketAverages;
  const finalNationalAverages = matrixNationalAverages;
  const finalError = matrixError;
  const finalAllProviders = allMatrixProviders;
  const finalProviderTypes = availableProviderTypes || hookProviderTypes;
  const finalPublishDates = availablePublishDates;
  const finalCurrentDate = currentPublishDate;

  // Helper function for SelectInput component
  function SelectInput({ id, value, onChange, options, size = 'sm', formatOptions = false, ...props }) {
    return (
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={size === 'sm' ? styles.selectSm : ''}
        {...props}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {formatOptions ? formatPublishDate(opt) : opt}
          </option>
        ))}
      </select>
    );
  }

  // Helper function to format publish date
  const formatPublishDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse the date string directly to avoid timezone issues
    const [year, month] = dateStr.split('-');
    return `${year}-${month}`;
  };

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

  // Debug logging
  console.log('🔍 Measure filtering debug:', {
    totalMeasures: finalMeasures.length,
    filteredMeasures: filteredMeasures.length,
    providerTypeFilter,
    availableProviderTypes: finalProviderTypes,
    availableProviderTypesLength: finalProviderTypes?.length || 0,
    sampleMeasures: finalMeasures.slice(0, 3).map(m => ({ code: m.code, setting: m.setting }))
  });
  
  // Additional debug for dropdown visibility
  console.log('🔍 Dropdown visibility debug:', {
    hasProviderTypes: !!finalProviderTypes,
    providerTypesLength: finalProviderTypes?.length || 0,
    isWindowDefined: typeof window !== 'undefined',
    shouldShowDropdown: typeof window !== 'undefined' && finalProviderTypes && finalProviderTypes.length > 0,
    finalProviderTypes: finalProviderTypes,
    availableProviderTypes: availableProviderTypes,
    hookProviderTypes: hookProviderTypes
  });

  // Use only the filtered measures for display
  const finalFilteredMeasures = filteredMeasures;

  // Filter providers to only show those that have data for at least one of the selected measures
  const filteredProviders = finalAllProviders.filter(currentProvider => {
    const providerData = finalData[currentProvider.dhc] || {};
    // Check if provider has data for at least one of the filtered measures
    return finalFilteredMeasures.some(measure => providerData[measure.code]);
  });

  // Main provider for the scorecard (only if they have data for selected measures)
  const mainProviderInMatrix = filteredProviders.find(p => p.dhc === provider?.dhc);

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
             {/* Date Display Banner */}
       <div style={{
         background: '#f8f9fa',
         border: '1px solid #e9ecef',
         borderRadius: '8px',
         padding: '8px 12px',
         marginBottom: '12px',
         fontSize: '13px',
         color: '#495057',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'space-between',
         flexShrink: 0
       }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <strong>Current Data Period:</strong>
           <span style={{ fontFamily: 'monospace', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>
             {finalCurrentDate || 'Not set'}
           </span>
           {providerTypeFilter && (
             <>
               <span>•</span>
               <strong>Setting:</strong>
               <span>{providerTypeFilter}</span>
             </>
           )}
         </div>
         
                   {/* Measure Setting Filter - Right justified */}
          {typeof window !== 'undefined' && (
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <label htmlFor="provider-type-select" style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
               Measure Setting:
             </label>
                           <select
                id="provider-type-select"
                value={providerTypeFilter || 'SNF'}
                onChange={e => setProviderTypeFilter(e.target.value)}
               style={{
                 fontSize: '13px',
                 padding: '4px 8px',
                 border: '1px solid #d0d0d0',
                 borderRadius: '4px',
                 background: '#ffffff',
                 color: '#333',
                 cursor: 'pointer',
                 minWidth: '120px'
               }}
             >
                               <option value="">All Settings</option>
                {finalProviderTypes && finalProviderTypes.length > 0 ? (
                  finalProviderTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))
                ) : (
                  <>
                    <option value="SNF">SNF</option>
                    <option value="HH">HH</option>
                    <option value="Hospice">Hospice</option>
                    <option value="IRF">IRF</option>
                    <option value="Hospital">Hospital</option>
                  </>
                )}
             </select>
           </div>
         )}
       </div>
      
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
    </div>
  );
} 