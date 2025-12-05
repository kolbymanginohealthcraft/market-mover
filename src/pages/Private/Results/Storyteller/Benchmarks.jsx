import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, X } from 'lucide-react';
import BenchmarkChart from './BenchmarkChart';
import ExportButton from '../../../../components/Buttons/ExportButton';
import { exportChart } from '../../../../utils/chartExport';
import { apiUrl } from '../../../../utils/api';
import useQualityMeasures from '../../../../hooks/useQualityMeasures';
import styles from './Benchmarks.module.css';

// Cache for quality measures dictionary
const measuresDictionaryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getDictionaryCacheKey(providerTypeFilter, showMyKpisOnly, kpiCodes) {
  const sortedKpiCodes = kpiCodes ? [...kpiCodes].sort().join(',') : '';
  return `qm_dictionary:${providerTypeFilter || 'all'}:${showMyKpisOnly}:${sortedKpiCodes}`;
}

function getCachedDictionary(cacheKey) {
  const cached = measuresDictionaryCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (cached.expiresAt && now > cached.expiresAt) {
    measuresDictionaryCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedDictionary(cacheKey, data) {
  const expiresAt = Date.now() + CACHE_TTL;
  measuresDictionaryCache.set(cacheKey, {
    data,
    expiresAt
  });
}

// Cache for wins calculation data
const winsDataCache = new Map();

function getWinsCacheKey(ccns, publishDate, providerDhc, hasMarketFilter) {
  const sortedCcns = [...ccns].sort().join(',');
  return `wins:${sortedCcns}:${publishDate || 'latest'}:${providerDhc || 'none'}:${hasMarketFilter}`;
}

function getCachedWins(cacheKey) {
  const cached = winsDataCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (cached.expiresAt && now > cached.expiresAt) {
    winsDataCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedWins(cacheKey, data) {
  const expiresAt = Date.now() + CACHE_TTL;
  winsDataCache.set(cacheKey, {
    data,
    expiresAt
  });
}

export default function Benchmarks({ 
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
  showMyKpisOnly = false,
  myKpiCodes = [],
  highlightedDhcKeys = [],
  highlightedDhcByType = new Map(),
  highlightTagTypes = [],
  highlightPrimaryProvider = true,
  hasMarketFilter = false,
  qualityMeasuresData = null
}) {
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
    currentPublishDate,
    availablePublishDates
  } = qualityMeasuresData ? {
    currentPublishDate: qualityMeasuresData.currentPublishDate,
    availablePublishDates: qualityMeasuresData.availablePublishDates
  } : {
    currentPublishDate: hookData.currentPublishDate,
    availablePublishDates: hookData.availablePublishDates
  };

  const [availableMeasures, setAvailableMeasures] = useState([]);
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [measuresLoading, setMeasuresLoading] = useState(false);
  const [measuresError, setMeasuresError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartExportData, setChartExportData] = useState(null);
  const [showWinsOnly, setShowWinsOnly] = useState(false);
  const [winsData, setWinsData] = useState({});
  const [sortByPercentile, setSortByPercentile] = useState(false);
  const chartRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle back to scorecard navigation
  const handleBackToScorecard = () => {
    const basePath = location.pathname.replace(/\/benchmarks$/, '').replace(/\/scorecard$/, '');
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('provider');
    const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    navigate(`${basePath}/scorecard${search}`);
  };

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

  // Handle global search behavior integration
  useEffect(() => {
    if (searchInputRef.current) {
      const handleInputChange = (e) => {
        // Sync with global script changes
        if (e.target.value !== searchTerm) {
          setSearchTerm(e.target.value);
        }
      };
      
      searchInputRef.current.addEventListener('input', handleInputChange);
      
      return () => {
        if (searchInputRef.current) {
          searchInputRef.current.removeEventListener('input', handleInputChange);
        }
      };
    }
  }, [searchTerm]);

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
    const [year, month] = dateStr.split('-');
    return `${year}-${month}`;
  };

  // Function to determine if a measure is a "win" for the provider
  const isWin = (measureCode, providerScore, marketAverage, nationalAverage, direction) => {
    if (providerScore === null || nationalAverage === null) {
      return false;
    }

    if (direction === 'Higher') {
      // For "Higher is better" measures, provider score must be higher than national average
      // If market average exists, also beat that
      const beatsNational = providerScore > nationalAverage;
      if (marketAverage !== null) {
        return beatsNational && providerScore > marketAverage;
      }
      return beatsNational;
    } else if (direction === 'Lower') {
      // For "Lower is better" measures, provider score must be lower than national average
      // If market average exists, also beat that
      const beatsNational = providerScore < nationalAverage;
      if (marketAverage !== null) {
        return beatsNational && providerScore < marketAverage;
      }
      return beatsNational;
    }
    
    return false;
  };

  // Memoize cache keys
  const dictionaryCacheKey = useMemo(() => {
    return getDictionaryCacheKey(providerTypeFilter, showMyKpisOnly, myKpiCodes);
  }, [providerTypeFilter, showMyKpisOnly, myKpiCodes]);

  // Fetch quality measures and calculate wins
  useEffect(() => {
    async function fetchQualityMeasures() {
      console.log('🔍 fetchQualityMeasures called with:', {
        providerTypeFilter,
        hasProvider: !!provider,
        providerDhc: provider?.dhc
      });

      if (!providerTypeFilter) {
        console.log('⚠️ No provider type filter, clearing measures');
        setAvailableMeasures([]);
        setSelectedMeasure(null);
        setWinsData({});
        setMeasuresLoading(false);
        return;
      }

      if (showMyKpisOnly && kpiCodeSet.size === 0) {
        console.log('⚠️ Metric-only mode without tagged metrics');
        setAvailableMeasures([]);
        setSelectedMeasure(null);
        setWinsData({});
        setMeasuresLoading(false);
        return;
      }

      // Check cache for dictionary first
      const cachedDictionary = getCachedDictionary(dictionaryCacheKey);
      let allMeasuresData;
      
      if (cachedDictionary) {
        console.log('✅ Using cached quality measures dictionary');
        allMeasuresData = cachedDictionary;
        setMeasuresLoading(false);
      } else {
        setMeasuresLoading(true);
        setMeasuresError(null);
      }

      try {
        if (!cachedDictionary) {
          console.log('🔍 Fetching quality measures from /api/qm_dictionary');
          const response = await fetch(apiUrl('/api/qm_dictionary'));
          
          console.log('🔍 API response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API call failed:', errorText);
            throw new Error(`Failed to fetch quality measures: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('🔍 API response data keys:', Object.keys(result));
          
          if (!result.success) {
            console.error('❌ API returned error:', result.error);
            throw new Error(result.error || 'Failed to fetch quality measures');
          }

          allMeasuresData = result.data;
          
          // Cache the dictionary
          setCachedDictionary(dictionaryCacheKey, allMeasuresData);
        }

        // Filter measures by the selected setting
        let filteredMeasures = allMeasuresData.filter(measure => 
          measure.setting === providerTypeFilter && measure.active === true
        );

        if (showMyKpisOnly) {
          filteredMeasures = filteredMeasures.filter(measure => {
            if (kpiCodeSet.size === 0) return false;
            const code = measure?.code ? String(measure.code).trim().toUpperCase() : '';
            if (!code) return false;
            return kpiCodeSet.has(code);
          });
        }

        console.log('🔍 Filtered measures:', {
          totalMeasures: allMeasuresData.length,
          filteredCount: filteredMeasures.length,
          setting: providerTypeFilter
        });

        // Sort by sort_order if available, otherwise by name
        filteredMeasures.sort((a, b) => {
          if (a.sort_order !== undefined && b.sort_order !== undefined) {
            return a.sort_order - b.sort_order;
          }
          return (a.name || '').localeCompare(b.name || '');
        });

        setAvailableMeasures(filteredMeasures);

        // Fetch quality measure data to calculate wins
        if (provider && nearbyDhcCcns && nearbyDhcCcns.length > 0 && filteredMeasures.length > 0) {
          const allCcns = nearbyDhcCcns.map(row => String(row.ccn)).filter(Boolean);
          
          if (allCcns.length > 0) {
            // Determine publish date
            let publishDate = currentPublishDate;
            if (!publishDate) {
              const datesResponse = await fetch(apiUrl('/api/qm_combined'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  ccns: allCcns, 
                  publish_date: 'latest' 
                })
              });
              
              if (datesResponse.ok) {
                const datesResult = await datesResponse.json();
                if (datesResult.success) {
                  const availableDates = datesResult.data.availableDates || [];
                  if (availableDates.length > 0) {
                    publishDate = availableDates[0];
                  }
                }
              }
            }

            // Check cache for wins data
            const winsCacheKey = getWinsCacheKey(allCcns, publishDate, provider?.dhc, hasMarketFilter);
            const cachedWins = getCachedWins(winsCacheKey);
            
            if (cachedWins) {
              console.log('✅ Using cached wins data');
              setWinsData(cachedWins);
            } else {
              // Fetch quality measure data
              console.log('🔍 Fetching quality measure data for wins calculation');
              const qmResponse = await fetch(apiUrl('/api/qm_combined'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  ccns: allCcns, 
                  publish_date: publishDate 
                })
              });

              if (qmResponse.ok) {
                const qmResult = await qmResponse.json();
                if (qmResult.success) {
                  const { providerData: allProviderData, nationalAverages } = qmResult.data;

                  // Calculate wins for each measure
                  const wins = {};
                  filteredMeasures.forEach(measure => {
                    // Get provider's score
                    const providerCcns = nearbyDhcCcns
                      .filter(row => row.dhc === provider.dhc)
                      .map(row => String(row.ccn));
                    
                    const providerMeasureData = allProviderData.filter(d => 
                      providerCcns.includes(d.ccn) && d.code === measure.code
                    );

                    let providerScore = null;
                    let providerPercentile = null;
                    if (providerMeasureData.length > 0) {
                      providerScore = providerMeasureData.reduce((sum, d) => sum + (d.score || 0), 0) / providerMeasureData.length;
                      providerPercentile = providerMeasureData.reduce((sum, d) => sum + (d.percentile_column || 0), 0) / providerMeasureData.length;
                    }

                    // Calculate market average only if market filter is active
                    let marketAverage = null;
                    if (hasMarketFilter && provider) {
                      // Calculate market average (excluding the main provider)
                      const marketCcns = nearbyDhcCcns
                        .filter(row => row.dhc !== provider.dhc)
                        .map(row => String(row.ccn));
                      
                      const marketData = allProviderData.filter(d => 
                        marketCcns.includes(d.ccn) && d.code === measure.code
                      );

                      if (marketData.length > 0) {
                        marketAverage = marketData.reduce((sum, d) => sum + (d.score || 0), 0) / marketData.length;
                      }
                    }

                    // Get national average
                    const nationalAverage = nationalAverages[measure.code]?.score || null;

                    // Determine if this is a win
                    const isWinResult = isWin(measure.code, providerScore, marketAverage, nationalAverage, measure.direction);
                    
                    wins[measure.code] = {
                      isWin: isWinResult,
                      providerScore,
                      providerPercentile,
                      marketAverage,
                      nationalAverage,
                      direction: measure.direction
                    };
                  });

                  setWinsData(wins);
                  setCachedWins(winsCacheKey, wins);
                  console.log('🔍 Calculated wins:', wins);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('❌ Error fetching quality measures:', err);
        console.error('❌ Error stack:', err.stack);
        setMeasuresError(err.message);
        setAvailableMeasures([]);
        setWinsData({});
        
        // Set fallback measures for production
        if (providerTypeFilter === 'SNF') {
          const fallbackMeasures = [
            { code: 'SNF5S1', name: 'Overall Star Rating', description: 'Overall 5-star rating', setting: 'SNF', active: true, sort_order: 1 },
            { code: 'SNF5S2', name: 'Survey Star Rating', description: 'Health inspection survey 5-star rating', setting: 'SNF', active: true, sort_order: 2 },
            { code: 'SNF5S3', name: 'QM Star Rating', description: 'Quality measures 5-star rating', setting: 'SNF', active: true, sort_order: 3 }
          ];
          console.log('🔍 Using fallback SNF measures');
          setAvailableMeasures(fallbackMeasures);
          setSelectedMeasure('SNF5S1');
          setMeasuresError(null);
        }
      } finally {
        setMeasuresLoading(false);
      }
    }

    fetchQualityMeasures();
  }, [providerTypeFilter, provider, nearbyDhcCcns, currentPublishDate, showMyKpisOnly, myKpiCodes, dictionaryCacheKey, hasMarketFilter, kpiCodeSet]);

  // Validate selected measure when available measures change (without re-fetching)
  useEffect(() => {
    if (availableMeasures.length === 0) {
      // No measures available, clear selection
      if (selectedMeasure) {
        setSelectedMeasure(null);
      }
    } else if (selectedMeasure) {
      const isMeasureValid = availableMeasures.some(measure => measure.code === selectedMeasure);
      if (!isMeasureValid) {
        // Selected measure is no longer in the filtered list, auto-select first
        setSelectedMeasure(availableMeasures[0].code);
        console.log('🔍 Selected measure no longer valid, auto-selected:', availableMeasures[0].code);
      }
    } else {
      // No measure selected, auto-select first
      setSelectedMeasure(availableMeasures[0].code);
      console.log('🔍 No measure selected, auto-selected:', availableMeasures[0].code);
    }
  }, [availableMeasures, selectedMeasure]);

  // Handle chart export
  const handleChartExport = async (format) => {
    console.log('Export button clicked:', format);
    
    try {
      if (format === 'csv') {
        // Export measures table as CSV
        if (!sortedMeasures || sortedMeasures.length === 0) {
          console.warn('No measures data available for CSV export');
          return;
        }

        const csvData = sortedMeasures.map(measure => {
          const winData = winsData[measure.code];
          const isRating = measure.source === 'Ratings';
          
          const baseRow = {
            Measure: measure.name,
            Provider: formatValue(winData?.providerScore, isRating),
            National: formatValue(winData?.nationalAverage, isRating),
            Percentile: winData?.providerPercentile !== null && winData?.providerPercentile !== undefined
              ? `${Math.round(winData.providerPercentile * 100)}%`
              : '—',
            Win: winData && winData.isWin ? 'Yes' : 'No'
          };

          // Add Market column if market filter is active
          if (hasMarketFilter) {
            return {
              Measure: baseRow.Measure,
              Provider: baseRow.Provider,
              Market: formatValue(winData?.marketAverage, isRating),
              National: baseRow.National,
              Percentile: baseRow.Percentile,
              Win: baseRow.Win
            };
          }

          return baseRow;
        });

        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `quality-measures-${timestamp}.csv`;
        await exportChart(format, null, csvData, filename);
      } else if (format === 'png') {
        // Export chart as PNG
        if (!chartExportData) {
          console.warn('No chart data available for export');
          return;
        }

        const { measureInfo, publishDate, chartRef: chartElementRef } = chartExportData;
        const filename = `${measureInfo?.name || 'benchmark'}-${publishDate || 'data'}.png`;
        
        if (!chartElementRef || !chartElementRef.current) {
          console.error('Chart element reference not available');
          return;
        }
        
        console.log('Chart element found:', chartElementRef.current);
        await exportChart(format, chartElementRef.current, null, filename);
      }
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
    }
  };

  // Helper to format value for display
  const formatValue = (val, isRating) => {
    if (val === null || val === undefined) return '—';
    return isRating ? val.toFixed(1) : `${Math.round(val * 100) / 100}%`;
  };

  // Handle sort toggle
  const handleToggleSort = () => {
    setSortByPercentile(!sortByPercentile);
  };

  // Filter measures based on search term and wins filter
  const filteredMeasures = availableMeasures.filter(measure => {
    // First apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        measure.name?.toLowerCase().includes(searchLower) ||
        measure.description?.toLowerCase().includes(searchLower) ||
        measure.code?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    
    // Then apply wins filter
    if (showWinsOnly) {
      const winData = winsData[measure.code];
      return winData && winData.isWin;
    }
    
    return true;
  });

  // Sort filtered measures
  const sortedMeasures = useMemo(() => {
    if (!sortByPercentile) return filteredMeasures;
    
    return [...filteredMeasures].sort((a, b) => {
      const winDataA = winsData[a.code];
      const winDataB = winsData[b.code];
      
      const valueA = winDataA?.providerPercentile ?? null;
      const valueB = winDataB?.providerPercentile ?? null;
      
      // Handle null values - put them at the end
      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return 1;
      if (valueB === null) return -1;
      
      // Sort descending (highest percentile first)
      return valueB - valueA;
    });
  }, [filteredMeasures, sortByPercentile, winsData]);

  // Count wins for display
  const totalWins = Object.values(winsData).filter(win => win.isWin).length;
  const totalMeasures = availableMeasures.length;

  return (
    <div className={styles.benchmarksContainer}>
      {/* Date Display Banner */}
      <div className={styles.dataPeriodBanner}>
        {/* Left side - Back Button and Export Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Back to Scorecard Button */}
          <button
            type="button"
            onClick={handleBackToScorecard}
            className="sectionHeaderButton"
          >
            <ArrowLeft size={14} />
            Back to Scorecard
          </button>

          {/* Export Button */}
          <ExportButton
            onExport={handleChartExport}
            disabled={false}
          />
        </div>
        
        {/* Data Publication Date - Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <strong>Data Publication Date:</strong>
          <span style={{ fontFamily: 'monospace', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>
            {currentPublishDate ? formatPublishDate(currentPublishDate) : 'Not set'}
          </span>
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.benchmarksLayout}>
          {/* Left Column - Measures List */}
          <div className={styles.measuresPanel}>
            <div className={styles.measuresHeader}>
              {/* First Row: Title and Wins Filter */}
              <div className={styles.headerRow}>
                <h3 className={styles.measuresTitle}>Quality Measures</h3>
                <div className={styles.winsFilter}>
                  <label className={styles.winsToggle}>
                    <input
                      type="checkbox"
                      checked={showWinsOnly}
                      onChange={(e) => setShowWinsOnly(e.target.checked)}
                      className={styles.winsCheckbox}
                    />
                    <span className={styles.winsLabel}>
                      Show Wins Only ({totalWins}/{totalMeasures})
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Second Row: Sort Buttons */}
              <div className={styles.sortButtonsRow}>
                <button
                  onClick={() => setSortByPercentile(false)}
                  className={!sortByPercentile ? styles.activeSortButton : styles.sortButton}
                >
                  Default Order
                </button>
                <button
                  onClick={() => setSortByPercentile(true)}
                  className={sortByPercentile ? styles.activeSortButton : styles.sortButton}
                >
                  Sort by %
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="searchBarContainer">
              <div className="searchIcon">
                <Search size={16} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search measures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                  }
                }}
                className="searchInput"
              />
            </div>
            
            {/* Search Results Count */}
            {searchTerm && !measuresLoading && !measuresError && availableMeasures.length > 0 && (
              <div className={styles.searchResultsCount}>
                {sortedMeasures.length} of {availableMeasures.length} measures
              </div>
            )}
            
            <div className={styles.measuresTableContainer}>
              {measuresLoading ? (
                <div className={styles.loadingMessage}>Loading measures...</div>
              ) : measuresError ? (
                <div className={styles.errorMessage}>Error: {measuresError}</div>
              ) : availableMeasures.length === 0 ? (
                <div className={styles.noDataMessage}>
                  {showMyKpisOnly
                    ? 'None of your tagged metrics are available for this setting yet. Toggle off "Show My Metrics" to browse all measures.'
                    : providerTypeFilter ? 'No measures available for this setting' : 'Select a measure setting to view available measures'}
                </div>
              ) : sortedMeasures.length === 0 ? (
                <div className={styles.noDataMessage}>
                  {showWinsOnly ? 'No wins found' : `No measures found matching "${searchTerm}"`}
                </div>
              ) : (
                <table className={styles.measuresTable}>
                  <thead>
                    <tr>
                      <th className={styles.radioColumn}></th>
                      <th>Measure</th>
                      <th>Provider</th>
                      {hasMarketFilter && <th>Market</th>}
                      <th>National</th>
                      <th title="Provider Percentile">%</th>
                      <th className={styles.winColumn}>Win</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMeasures.map((measure) => {
                      const winData = winsData[measure.code];
                      const isWin = winData && winData.isWin;
                      const isRating = measure.source === 'Ratings';
                      const isSelected = selectedMeasure === measure.code;
                      
                      return (
                        <tr 
                          key={measure.code} 
                          className={isWin ? styles.winRow : ''}
                          onClick={() => setSelectedMeasure(measure.code)}
                        >
                          <td className={styles.radioCell} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="radio"
                              name="selectedMeasure"
                              value={measure.code}
                              checked={isSelected}
                              onChange={(e) => setSelectedMeasure(e.target.value)}
                              className={styles.radioInput}
                            />
                          </td>
                          <td className={styles.measureNameCell} title={measure.description}>
                            {measure.name}
                          </td>
                          <td className={styles.valueCell}>
                            {formatValue(winData?.providerScore, isRating)}
                          </td>
                          {hasMarketFilter && (
                            <td className={styles.valueCell}>
                              {formatValue(winData?.marketAverage, isRating)}
                            </td>
                          )}
                          <td className={styles.valueCell}>
                            {formatValue(winData?.nationalAverage, isRating)}
                          </td>
                          <td className={styles.percentileCell}>
                            {winData?.providerPercentile !== null && winData?.providerPercentile !== undefined
                              ? `${Math.round(winData.providerPercentile * 100)}%`
                              : '—'}
                          </td>
                          <td className={styles.winCell}>
                            {isWin ? (
                              <span className={styles.winIndicator} title={winData.marketAverage !== null ? "Provider outperforms both market and national averages" : "Provider outperforms national average"}>
                                ✓
                              </span>
                            ) : (
                              <span className={styles.noWinIndicator} title="Not a win">
                                <X size={14} />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          {/* Right Column - Chart */}
          <div className={styles.chartPanel}>
            <BenchmarkChart 
              provider={provider}
              radiusInMiles={radiusInMiles}
              nearbyProviders={nearbyProviders}
              nearbyDhcCcns={nearbyDhcCcns}
              selectedPublishDate={currentPublishDate}
              providerTypeFilter={providerTypeFilter}
              selectedMeasure={selectedMeasure}
              measuresLoading={measuresLoading}
              onExport={setChartExportData}
              hasMarketFilter={hasMarketFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
