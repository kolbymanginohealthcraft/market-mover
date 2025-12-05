import { useEffect, useMemo, useState, useRef } from "react";
import { ChevronDown, Settings, Filter as FilterIcon, Download } from "lucide-react";
import Spinner from "../../../../components/Buttons/Spinner";
import Dropdown from "../../../../components/Buttons/Dropdown";
import useQualityMeasures from "../../../../hooks/useQualityMeasures";
import ProviderComparisonMatrix from "./ProviderComparisonMatrix";
import styles from "./Scorecard.module.css";
import standaloneStyles from "../../Investigation/StandaloneStoryteller.module.css";
import { sanitizeProviderName } from "../../../../utils/providerName";
import { exportChart } from "../../../../utils/chartExport";

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
  availableProviderTypes,
  providerLabels = {},
  forcedLoading = false,
  showMyKpisOnly = false,
  myKpiCodes = [],
  highlightedDhcKeys = [],
  highlightedDhcByType = new Map(),
  highlightTagTypes = [],
  setHighlightTagTypes,
  highlightPrimaryProvider = true,
  qualityMeasuresData = null,
  providerTags = null,
  highlightCounts = {},
  hasHighlightOptions = false,
  highlightLabels = {},
  highlightSelectionSet = new Set(),
  highlightTriggerLabel = 'Highlight Providers'
}) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [selectedMeasures, setSelectedMeasures] = useState([]);
  const [metricsDropdownOpen, setMetricsDropdownOpen] = useState(false);
  const [measureSettingDropdownOpen, setMeasureSettingDropdownOpen] = useState(false);
  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false);
  const [showPercentiles, setShowPercentiles] = useState(false);
  const hasInitializedMeasures = useRef(false);
  const hasInitializedHighlights = useRef(false);
  
  // Automatically enable all available highlight types by default (only once on mount)
  useEffect(() => {
    if (hasHighlightOptions && !hasInitializedHighlights.current && highlightTagTypes.length === 0) {
      const availableTypes = [];
      if (highlightCounts.me > 0) availableTypes.push('me');
      if (highlightCounts.partner > 0) availableTypes.push('partner');
      if (highlightCounts.competitor > 0) availableTypes.push('competitor');
      if (highlightCounts.target > 0) availableTypes.push('target');
      
      if (availableTypes.length > 0) {
        setHighlightTagTypes(availableTypes);
        hasInitializedHighlights.current = true;
      }
    }
  }, [hasHighlightOptions, highlightCounts, highlightTagTypes.length, setHighlightTagTypes]);
  
  // Use shared quality measures data if provided, otherwise use hook (hook will use cache)
  const hookData = useQualityMeasures(
    provider, 
    nearbyProviders, 
    nearbyDhcCcns, 
    selectedPublishDate,
    prefetchedData?.qualityMeasuresDates,
    providerTypeFilter,
    providerLabels
  );
  
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
  } = qualityMeasuresData || hookData;

  // Always use the hook data to ensure we get all providers
  useEffect(() => {
    setIsHydrating(true);
  }, [provider?.dhc, nearbyDhcCcns, selectedPublishDate, providerTypeFilter]);

  useEffect(() => {
    if (!matrixLoading && (matrixError || matrixMeasures.length > 0)) {
      setIsHydrating(false);
    }
  }, [matrixLoading, matrixError, matrixMeasures.length]);

  const finalLoading = matrixLoading || forcedLoading || isHydrating;
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
  const kpiCodeSet = useMemo(() => {
    if (!Array.isArray(myKpiCodes) || myKpiCodes.length === 0) {
      return new Set();
    }
    return new Set(
      myKpiCodes
        .map(code => (code ? String(code).trim().toUpperCase() : ''))
        .filter(Boolean)
    );
  }, [myKpiCodes]);

  // Track if we're using "My Metrics" mode locally
  const [usingMyMetrics, setUsingMyMetrics] = useState(showMyKpisOnly);

  // Track the measure codes to detect when they actually change
  const measureCodesRef = useRef('');
  
  // Initialize selectedMeasures when measures load (only on initial load or when measures actually change)
  useEffect(() => {
    const currentMeasureCodes = filteredMeasures.map(m => m.code).sort().join(',');
    const measuresChanged = measureCodesRef.current !== currentMeasureCodes;
    
    if (filteredMeasures.length > 0 && (!hasInitializedMeasures.current || measuresChanged)) {
      // If showMyKpisOnly is true and we have KPI codes, use those
      if (showMyKpisOnly && kpiCodeSet.size > 0) {
        const myKpiMeasures = filteredMeasures
          .filter(m => {
            const code = m?.code ? String(m.code).trim().toUpperCase() : '';
            return code && kpiCodeSet.has(code);
          })
          .map(m => m.code);
        setSelectedMeasures(myKpiMeasures);
        setUsingMyMetrics(true);
      } else {
        // Otherwise, select all measures
        setSelectedMeasures(filteredMeasures.map(m => m.code));
        setUsingMyMetrics(false);
      }
      hasInitializedMeasures.current = true;
      measureCodesRef.current = currentMeasureCodes;
    }
  }, [filteredMeasures, showMyKpisOnly, kpiCodeSet.size]);

  // Reset initialization flag when provider type filter changes (new measures loaded)
  useEffect(() => {
    hasInitializedMeasures.current = false;
    measureCodesRef.current = '';
  }, [providerTypeFilter]);

  // Sync usingMyMetrics when showMyKpisOnly prop changes
  useEffect(() => {
    setUsingMyMetrics(showMyKpisOnly);
  }, [showMyKpisOnly]);

  // Filter measures based on selectedMeasures, maintaining the order from filteredMeasures
  const finalFilteredMeasures = useMemo(() => {
    // Return measures in the order they appear in filteredMeasures, but only those in selectedMeasures
    return filteredMeasures.filter(measure => selectedMeasures.includes(measure.code));
  }, [filteredMeasures, selectedMeasures]);

  // Toggle measure selection
  const toggleMeasure = (code) => {
    setSelectedMeasures(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        // Find the position of this measure in filteredMeasures
        const measureIndex = filteredMeasures.findIndex(m => m.code === code);
        if (measureIndex === -1) {
          // If not found, append at end
          return [...prev, code];
        }
        
        // Find where to insert: find the first selected measure that comes after this one in filteredMeasures
        let insertIndex = prev.length;
        for (let i = 0; i < prev.length; i++) {
          const selectedCode = prev[i];
          const selectedIndex = filteredMeasures.findIndex(m => m.code === selectedCode);
          if (selectedIndex > measureIndex) {
            insertIndex = i;
            break;
          }
        }
        
        const newSelected = [...prev];
        newSelected.splice(insertIndex, 0, code);
        return newSelected;
      }
    });
  };

  // Check/Uncheck all measures
  const handleToggleAll = () => {
    const allSelected = selectedMeasures.length === filteredMeasures.length && filteredMeasures.length > 0;
    if (allSelected) {
      // Uncheck all
      hasInitializedMeasures.current = true; // Prevent auto-recheck
      setSelectedMeasures([]);
      setUsingMyMetrics(false);
    } else {
      // Check all
      setSelectedMeasures(filteredMeasures.map(m => m.code));
      setUsingMyMetrics(false);
    }
  };

  // Handle "Use My Metrics" toggle
  const handleUseMyMetrics = () => {
    if (usingMyMetrics) {
      // Turn off - select all measures
      setSelectedMeasures(filteredMeasures.map(m => m.code));
      setUsingMyMetrics(false);
    } else {
      // Turn on - select only my KPIs
      if (kpiCodeSet.size > 0) {
        const myKpiMeasures = filteredMeasures
          .filter(m => {
            const code = m?.code ? String(m.code).trim().toUpperCase() : '';
            return code && kpiCodeSet.has(code);
          })
          .map(m => m.code);
        if (myKpiMeasures.length > 0) {
          setSelectedMeasures(myKpiMeasures);
          setUsingMyMetrics(true);
        }
      }
    }
  };

  // When user manually toggles measures, turn off "My Metrics" mode if they deselect a my KPI or select a non-my KPI
  useEffect(() => {
    if (usingMyMetrics && kpiCodeSet.size > 0) {
      const hasNonMyKpi = selectedMeasures.some(code => {
        const measure = filteredMeasures.find(m => m.code === code);
        if (!measure) return false;
        const measureCode = measure?.code ? String(measure.code).trim().toUpperCase() : '';
        return measureCode && !kpiCodeSet.has(measureCode);
      });
      const allMyKpisSelected = selectedMeasures.length > 0 && selectedMeasures.every(code => {
        const measure = filteredMeasures.find(m => m.code === code);
        if (!measure) return false;
        const measureCode = measure?.code ? String(measure.code).trim().toUpperCase() : '';
        return measureCode && kpiCodeSet.has(measureCode);
      });
      
      if (hasNonMyKpi || !allMyKpisSelected) {
        setUsingMyMetrics(false);
      }
    }
  }, [selectedMeasures, usingMyMetrics, kpiCodeSet, filteredMeasures]);

  // Filter providers to only show those that have data for at least one of the selected measures
  const filteredProviders = finalAllProviders.filter(currentProvider => {
    const providerData = finalData[currentProvider.dhc] || {};
    const hasData = finalFilteredMeasures.some(measure => providerData[measure.code]);

    if (hasData) {
      return true;
    }

    if (currentProvider?.shouldDisplay) {
      return true;
    }

    return false;
  });

  const resolveProviderLabel = (entity) => {
    if (!entity) return entity;
    const dhcKey = entity.dhc ? String(entity.dhc) : null;
    const manualKey = entity.manualCcn ? `ccn:${entity.manualCcn}` : null;
    const mappedName = (dhcKey && providerLabels[dhcKey]) || (manualKey && providerLabels[manualKey]);
    const fallbackName = entity.name || entity.facility_name || entity.providerObj?.name || entity.providerObj?.facility_name || (entity.manualCcn ? `CCN ${entity.manualCcn}` : null) || (entity.city && entity.state ? `${entity.city}, ${entity.state}` : null);
    const candidateName = mappedName || fallbackName || entity.name;
    const sanitizedName = sanitizeProviderName(candidateName) || candidateName;
    const sanitizedFacility = sanitizeProviderName(entity.facility_name || mappedName || fallbackName) || entity.facility_name || mappedName || fallbackName;
    if (!mappedName && fallbackName === entity.name && sanitizedName === entity.name) {
      return entity;
    }
    return {
      ...entity,
      name: sanitizedName,
      facility_name: sanitizedFacility
    };
  };

  const mainProviderInMatrix = resolveProviderLabel(
    filteredProviders.find(p => p.dhc === provider?.dhc && !p.shouldDisplay) || (provider && provider.dhc ? {
      dhc: provider.dhc,
      name: sanitizeProviderName(provider.name) || provider.name,
      facility_name: sanitizeProviderName(provider.facility_name) || provider.facility_name,
      manualCcn: provider.manualCcn,
      city: provider.city,
      state: provider.state,
      providerObj: provider
    } : null)
  );

  const competitorProviders = filteredProviders
    .filter(p => p.dhc !== provider?.dhc)
    .map(resolveProviderLabel);

  if (finalLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
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

  if (showMyKpisOnly && finalFilteredMeasures.length === 0) {
    const message = kpiCodeSet.size === 0
      ? 'Tag metrics from the My Metrics workspace to enable this filter.'
      : 'None of your tagged metrics match the current filters. Toggle off "Show My Metrics" to view all measures.';
    return (
      <div className={styles.scorecardContainer}>
        <div className={styles.noMeasuresMessage}>{message}</div>
      </div>
    );
  }

  // Helper to format value for export
  const formatValueForExport = (val, measure) => {
    if (val === null || val === undefined) return '';
    
    const STAR_RATING_COLUMNS = [
      "overall", "survey", "qm", "qm long", "qm short", "staffing"
    ];
    
    const isRating = measure && (
      (typeof measure.source === "string" && measure.source.toLowerCase() === "ratings") ||
      STAR_RATING_COLUMNS.includes(measure.name?.toLowerCase())
    );
    
    if (isRating) {
      return Math.round(val).toString();
    }
    return Number(val).toFixed(2);
  };

  // Helper to format percentile for export
  const formatPercentileForExport = (val) => {
    if (val === null || val === undefined) return '';
    return `${Math.round(val * 100)}%`;
  };

  // Calculate average percentile for a provider
  const calculateAvgPercentile = (providerDhc) => {
    const providerData = finalData[providerDhc] || {};
    const percentiles = finalFilteredMeasures
      .map(m => providerData[m.code]?.percentile)
      .filter(p => p !== null && p !== undefined);
    
    if (percentiles.length === 0) return '';
    const avg = percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length;
    return formatPercentileForExport(avg);
  };

  // Handle scorecard export
  const handleScorecardExport = async (format) => {
    console.log('Scorecard export clicked:', format);
    
    try {
      if (format === 'csv') {
        // Export scorecard table as CSV
        if (!finalFilteredMeasures || finalFilteredMeasures.length === 0) {
          console.warn('No measures data available for CSV export');
          return;
        }

        // Get all providers (main provider + competitors)
        const allProviders = [];
        if (mainProviderInMatrix) {
          allProviders.push(mainProviderInMatrix);
        }
        allProviders.push(...competitorProviders);

        if (allProviders.length === 0) {
          console.warn('No providers available for CSV export');
          return;
        }

        // Build CSV data
        const csvData = allProviders.map(provider => {
          const providerDhc = provider.dhc;
          const providerData = finalData[providerDhc] || {};
          const providerName = sanitizeProviderName(provider.name) || provider.name || 'Provider';
          
          const row = {
            Provider: providerName
          };

          // Add measure columns
          finalFilteredMeasures.forEach(measure => {
            const cell = providerData[measure.code];
            if (cell) {
              const value = formatValueForExport(cell.score, measure);
              if (showPercentiles && cell.percentile !== null && cell.percentile !== undefined) {
                row[measure.name] = `${value} (${formatPercentileForExport(cell.percentile)})`;
              } else {
                row[measure.name] = value;
              }
            } else {
              row[measure.name] = '';
            }
          });

          // Add Avg % column
          row['Avg %'] = calculateAvgPercentile(providerDhc);

          return row;
        });

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `scorecard-${timestamp}.csv`;
        await exportChart(format, null, csvData, filename);
      }
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className={styles.scorecardContainer}>
             {/* Date Display Banner */}
       <div style={{
         background: 'white',
         borderBottom: '1px solid var(--gray-200)',
         padding: '12px 20px',
         marginBottom: '0',
         fontSize: '13px',
         color: '#495057',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'flex-start',
         gap: '12px',
         flexShrink: 0
       }}>
         {/* Measure Setting Dropdown */}
         {typeof window !== 'undefined' && finalProviderTypes && finalProviderTypes.length > 0 && (
           <Dropdown
             trigger={
               <button type="button" className="sectionHeaderButton">
                 <Settings size={14} />
                 {providerTypeFilter || finalProviderTypes[0]}
                 <ChevronDown size={14} />
               </button>
             }
             isOpen={measureSettingDropdownOpen}
             onToggle={setMeasureSettingDropdownOpen}
             className={standaloneStyles.dropdownMenu}
           >
             {finalProviderTypes.map(type => (
               <button
                 key={type}
                 className={standaloneStyles.dropdownItem}
                 onClick={() => {
                   setProviderTypeFilter(type);
                   setMeasureSettingDropdownOpen(false);
                 }}
                 style={{
                   fontWeight: providerTypeFilter === type ? '600' : '500',
                   background: providerTypeFilter === type ? 'rgba(0, 192, 139, 0.1)' : 'none'
                 }}
               >
                 {type}
               </button>
             ))}
           </Dropdown>
         )}

         {/* Metrics Selection Dropdown */}
         <Dropdown
           trigger={
             <button type="button" className="sectionHeaderButton">
               Select Metrics ({selectedMeasures.length}/{filteredMeasures.length})
               <ChevronDown size={14} />
             </button>
           }
           isOpen={metricsDropdownOpen}
           onToggle={setMetricsDropdownOpen}
           className={standaloneStyles.dropdownMenu}
           style={{ minWidth: '300px', maxHeight: '400px' }}
         >
           {/* Check All / Uncheck All Button */}
           <button
             type="button"
             className={standaloneStyles.dropdownItem}
             onClick={(e) => {
               e.stopPropagation();
               handleToggleAll();
             }}
             style={{
               fontWeight: '500',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between'
             }}
           >
             <span>{selectedMeasures.length === filteredMeasures.length && filteredMeasures.length > 0 ? 'Uncheck All' : 'Check All'}</span>
             {selectedMeasures.length > 0 && selectedMeasures.length < filteredMeasures.length && (
               <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                 ({selectedMeasures.length} selected)
               </span>
             )}
           </button>

           {/* Use My Metrics Button */}
           {myKpiCodes.length > 0 && (
             <>
               {/* Divider */}
               <div style={{ height: '1px', background: 'var(--gray-200)', margin: '4px 0' }} />
               <button
                 className={standaloneStyles.dropdownItem}
                 onClick={(e) => {
                   e.stopPropagation();
                   handleUseMyMetrics();
                 }}
                 style={{
                   fontWeight: usingMyMetrics ? '600' : '500',
                   background: usingMyMetrics ? 'rgba(0, 192, 139, 0.1)' : 'none'
                 }}
               >
                 {usingMyMetrics ? '✓ Using My Metrics' : 'Use My Metrics'}
               </button>
               {/* Divider */}
               <div style={{ height: '1px', background: 'var(--gray-200)', margin: '4px 0' }} />
             </>
           )}

           {/* Measure Checkboxes */}
           <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
             {filteredMeasures.map(measure => {
               const isSelected = selectedMeasures.includes(measure.code);
               const isMyKpi = kpiCodeSet.has(measure.code?.toUpperCase() || '');
               return (
                 <button
                   key={measure.code}
                   type="button"
                   className={standaloneStyles.dropdownItem}
                   onClick={(e) => {
                     e.stopPropagation();
                     toggleMeasure(measure.code);
                   }}
                   style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px',
                     fontWeight: isSelected ? '500' : '400',
                     background: isSelected ? 'rgba(0, 192, 139, 0.05)' : 'none',
                     textAlign: 'left',
                     justifyContent: 'flex-start'
                   }}
                 >
                   <input
                     type="checkbox"
                     checked={isSelected}
                     onChange={() => {}}
                     onClick={(e) => e.stopPropagation()}
                     style={{ cursor: 'pointer', margin: 0, pointerEvents: 'none' }}
                   />
                   <span style={{ flex: 1, color: isSelected ? 'var(--gray-700)' : 'var(--gray-600)' }}>
                     {measure.name || measure.code}
                   </span>
                   {isMyKpi && (
                     <span style={{ 
                       fontSize: '10px', 
                       color: '#1971c2', 
                       fontWeight: '600',
                       background: '#e7f5ff',
                       padding: '2px 6px',
                       borderRadius: '3px',
                       flexShrink: 0
                     }}>
                       MY
                     </span>
                   )}
                 </button>
               );
             })}
           </div>
         </Dropdown>

         {/* Highlight Providers Dropdown */}
         {hasHighlightOptions && (
           <Dropdown
             trigger={
               <button
                 type="button"
                 className={`sectionHeaderButton ${highlightTagTypes.length > 0 ? standaloneStyles.activeFilterButton : ''}`}
               >
                 <FilterIcon size={14} />
                 {highlightTriggerLabel}
                 <ChevronDown size={14} />
               </button>
             }
             isOpen={highlightDropdownOpen}
             onToggle={setHighlightDropdownOpen}
             className={standaloneStyles.dropdownMenu}
           >
             <button
               className={standaloneStyles.dropdownItem}
               onClick={() => {
                 setHighlightTagTypes([]);
                 setHighlightDropdownOpen(false);
               }}
               style={{
                 fontWeight: highlightTagTypes.length === 0 ? '600' : '500',
                 background: highlightTagTypes.length === 0 ? 'rgba(38, 89, 71, 0.08)' : 'none'
               }}
             >
               No Highlight
             </button>
             {highlightCounts.me > 0 && (
               <button
                 className={standaloneStyles.dropdownItem}
                 onClick={() => {
                   setHighlightTagTypes(prev => (
                     prev.includes('me') ? prev.filter(type => type !== 'me') : [...prev, 'me']
                   ));
                 }}
                 style={{
                   fontWeight: highlightSelectionSet.has('me') ? '600' : '500',
                   background: highlightSelectionSet.has('me') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                 }}
               >
                 Highlight My Providers ({highlightCounts.me})
               </button>
             )}
             {highlightCounts.partner > 0 && (
               <button
                 className={standaloneStyles.dropdownItem}
                 onClick={() => {
                   setHighlightTagTypes(prev => (
                     prev.includes('partner') ? prev.filter(type => type !== 'partner') : [...prev, 'partner']
                   ));
                 }}
                 style={{
                   fontWeight: highlightSelectionSet.has('partner') ? '600' : '500',
                   background: highlightSelectionSet.has('partner') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                 }}
               >
                 Highlight Partners ({highlightCounts.partner})
               </button>
             )}
             {highlightCounts.competitor > 0 && (
               <button
                 className={standaloneStyles.dropdownItem}
                 onClick={() => {
                   setHighlightTagTypes(prev => (
                     prev.includes('competitor') ? prev.filter(type => type !== 'competitor') : [...prev, 'competitor']
                   ));
                 }}
                 style={{
                   fontWeight: highlightSelectionSet.has('competitor') ? '600' : '500',
                   background: highlightSelectionSet.has('competitor') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                 }}
               >
                 Highlight Competitors ({highlightCounts.competitor})
               </button>
             )}
             {highlightCounts.target > 0 && (
               <button
                 className={standaloneStyles.dropdownItem}
                 onClick={() => {
                   setHighlightTagTypes(prev => (
                     prev.includes('target') ? prev.filter(type => type !== 'target') : [...prev, 'target']
                   ));
                 }}
                 style={{
                   fontWeight: highlightSelectionSet.has('target') ? '600' : '500',
                   background: highlightSelectionSet.has('target') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                 }}
               >
                 Highlight Targets ({highlightCounts.target})
               </button>
             )}
          </Dropdown>
        )}
         
         {/* Show Percentiles Checkbox */}
         <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
           <input
             type="checkbox"
             checked={showPercentiles}
             onChange={(e) => setShowPercentiles(e.target.checked)}
             style={{ cursor: 'pointer', margin: 0 }}
           />
           <span style={{ fontSize: '13px' }}>Show Percentiles</span>
         </label>
         
         {/* Export Button and Data Publication Date - Right side */}
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
           <button
             type="button"
             className="sectionHeaderButton"
             onClick={() => handleScorecardExport('csv')}
             title="Export Scorecard"
           >
             <Download size={14} />
             Export Scorecard
           </button>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <strong>Data Publication Date:</strong>
             <span style={{ fontFamily: 'monospace', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>
               {finalCurrentDate ? formatPublishDate(finalCurrentDate) : 'Not set'}
             </span>
           </div>
         </div>
       </div>
      
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ProviderComparisonMatrix
          provider={mainProviderInMatrix}
          competitors={competitorProviders}
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
          highlightedDhcKeys={highlightedDhcKeys}
          highlightedDhcByType={highlightedDhcByType}
          highlightTagTypes={highlightTagTypes}
          highlightPrimaryProvider={highlightPrimaryProvider}
          selectedMeasures={selectedMeasures}
          nearbyDhcCcns={nearbyDhcCcns}
          showPercentiles={showPercentiles}
        />
      </div>
    </div>
  );
} 