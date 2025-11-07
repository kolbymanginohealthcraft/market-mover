import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import BenchmarkChart from './BenchmarkChart';
import ExportButton from '../../../../components/Buttons/ExportButton';
import { exportChart } from '../../../../utils/chartExport';
import { apiUrl } from '../../../../utils/api';
import useQualityMeasures from '../../../../hooks/useQualityMeasures';
import styles from './Benchmarks.module.css';

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
  providerLabels = {}
}) {
  // Use the same quality measures hook to get consistent date handling
  const {
    currentPublishDate,
    availablePublishDates
  } = useQualityMeasures(
    provider, 
    nearbyProviders, 
    nearbyDhcCcns, 
    selectedPublishDate,
    prefetchedData?.qualityMeasuresDates,
    providerTypeFilter,
    providerLabels
  );

  const [availableMeasures, setAvailableMeasures] = useState([]);
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [measuresLoading, setMeasuresLoading] = useState(false);
  const [measuresError, setMeasuresError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartExportData, setChartExportData] = useState(null);
  const [showWinsOnly, setShowWinsOnly] = useState(false);
  const [winsData, setWinsData] = useState({});
  const chartRef = useRef(null);
  const searchInputRef = useRef(null);

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
    if (providerScore === null || marketAverage === null || nationalAverage === null) {
      return false;
    }

    if (direction === 'Higher') {
      // For "Higher is better" measures, provider score must be higher than both averages
      return providerScore > marketAverage && providerScore > nationalAverage;
    } else if (direction === 'Lower') {
      // For "Lower is better" measures, provider score must be lower than both averages
      return providerScore < marketAverage && providerScore < nationalAverage;
    }
    
    return false;
  };

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
        return;
      }

      setMeasuresLoading(true);
      setMeasuresError(null);

      try {
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

        // Filter measures by the selected setting
        const filteredMeasures = result.data.filter(measure => 
          measure.setting === providerTypeFilter && measure.active === true
        );

        console.log('🔍 Filtered measures:', {
          totalMeasures: result.data.length,
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
        if (provider && nearbyDhcCcns && nearbyDhcCcns.length > 0) {
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

            // Fetch quality measure data
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
                  if (providerMeasureData.length > 0) {
                    providerScore = providerMeasureData.reduce((sum, d) => sum + (d.score || 0), 0) / providerMeasureData.length;
                  }

                  // Calculate market average (excluding the main provider)
                  const marketCcns = nearbyDhcCcns
                    .filter(row => row.dhc !== provider.dhc)
                    .map(row => String(row.ccn));
                  
                  const marketData = allProviderData.filter(d => 
                    marketCcns.includes(d.ccn) && d.code === measure.code
                  );

                  let marketAverage = null;
                  if (marketData.length > 0) {
                    marketAverage = marketData.reduce((sum, d) => sum + (d.score || 0), 0) / marketData.length;
                  }

                  // Get national average
                  const nationalAverage = nationalAverages[measure.code]?.score || null;

                  // Determine if this is a win
                  const isWinResult = isWin(measure.code, providerScore, marketAverage, nationalAverage, measure.direction);
                  
                  wins[measure.code] = {
                    isWin: isWinResult,
                    providerScore,
                    marketAverage,
                    nationalAverage,
                    direction: measure.direction
                  };
                });

                setWinsData(wins);
                console.log('🔍 Calculated wins:', wins);
              }
            }
          }
        }
        
        // Auto-select the first measure if none is selected
        if (filteredMeasures.length > 0 && !selectedMeasure) {
          setSelectedMeasure(filteredMeasures[0].code);
          console.log('🔍 Auto-selected measure:', filteredMeasures[0].code);
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
  }, [providerTypeFilter, provider, nearbyDhcCcns, currentPublishDate]);

  // Handle chart export
  const handleChartExport = async (format) => {
    console.log('Export button clicked:', format);
    console.log('Chart export data:', chartExportData);
    
    if (!chartExportData) {
      console.warn('No chart data available for export');
      return;
    }

    try {
      const { measureInfo, publishDate, chartRef: chartElementRef } = chartExportData;
      const filename = `${measureInfo?.name || 'benchmark'}-${publishDate || 'data'}`;
      
      console.log('Exporting with filename:', filename);
      
      if (format === 'csv') {
        // For CSV, we need to transform the chart data
        const csvData = chartExportData.data.map(item => ({
          Provider: item.name,
          Value: `${item.value}%`,
          Type: item.type || 'Provider'
        }));
        console.log('CSV data:', csvData);
        await exportChart(format, null, csvData, `${filename}.csv`);
      } else {
        // For image formats, we need the chart element
        if (!chartElementRef || !chartElementRef.current) {
          console.error('Chart element reference not available');
          return;
        }
        console.log('Chart element found:', chartElementRef.current);
        await exportChart(format, chartElementRef.current, null, `${filename}.${format}`);
      }
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
    }
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

  // Count wins for display
  const totalWins = Object.values(winsData).filter(win => win.isWin).length;
  const totalMeasures = availableMeasures.length;

  return (
    <div className={styles.benchmarksContainer}>
      {/* Date Display Banner */}
      <div className={styles.dataPeriodBanner}>
        {/* Left side - Measure Setting and Current Data Period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Measure Setting Filter */}
          {typeof window !== 'undefined' && availableProviderTypes && availableProviderTypes.length > 0 && (
            <div className={styles.filterGroup}>
              <label htmlFor="provider-type-select" className={styles.filterLabel}>Measure Setting:</label>
              <SelectInput
                id="provider-type-select"
                value={providerTypeFilter || ''}
                onChange={e => setProviderTypeFilter(e.target.value)}
                options={availableProviderTypes}
                size="sm"
              />
            </div>
          )}
          
          {/* Current Data Period */}
          <div className={styles.bannerLeft}>
            <strong>Current Data Period:</strong>
            <span className={styles.dateDisplay}>
              {currentPublishDate || 'Not set'}
            </span>
          </div>
        </div>
        
        {/* Export Button - Right side */}
        <ExportButton
          onExport={handleChartExport}
          disabled={!chartExportData}
          className={styles.exportButton}
        />
      </div>
      
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.benchmarksLayout}>
          {/* Left Column - Measures List */}
          <div className={styles.measuresPanel}>
            <div className={styles.measuresHeader}>
              <h3 className={styles.measuresTitle}>Quality Measures</h3>
              
              {/* Wins Filter Toggle */}
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
                {filteredMeasures.length} of {availableMeasures.length} measures
              </div>
            )}
            
            <div className={styles.measuresList}>
              {measuresLoading ? (
                <div className={styles.loadingMessage}>Loading measures...</div>
              ) : measuresError ? (
                <div className={styles.errorMessage}>Error: {measuresError}</div>
              ) : availableMeasures.length === 0 ? (
                <div className={styles.noDataMessage}>
                  {providerTypeFilter ? 'No measures available for this setting' : 'Select a measure setting to view available measures'}
                </div>
              ) : filteredMeasures.length === 0 ? (
                <div className={styles.noDataMessage}>
                  {showWinsOnly ? 'No wins found' : `No measures found matching "${searchTerm}"`}
                </div>
              ) : (
                filteredMeasures.map((measure) => {
                  const winData = winsData[measure.code];
                  const isWin = winData && winData.isWin;
                  
                                     return (
                     <div key={measure.code} className={styles.measureItem}>
                      <label className={styles.measureRadio}>
                        <input
                          type="radio"
                          name="selectedMeasure"
                          value={measure.code}
                          checked={selectedMeasure === measure.code}
                          onChange={(e) => setSelectedMeasure(e.target.value)}
                          className={styles.radioInput}
                        />
                        <div className={styles.measureContent}>
                          <div className={styles.measureHeader}>
                            <div className={styles.measureName}>{measure.name}</div>
                            {isWin && (
                              <div className={styles.winBadge} title="Provider outperforms both market and national averages">
                                WIN
                              </div>
                            )}
                          </div>
                          <div className={styles.measureDescription}>{measure.description}</div>
                                                     {winData && (
                             <div className={styles.measureStats}>
                               <span className={styles.statLabel}>Provider:</span>
                               <span className={styles.statValue}>
                                 {winData.providerScore !== null ? 
                                   (measure.source === 'Ratings' ? 
                                     winData.providerScore.toFixed(1) : 
                                     `${winData.providerScore.toFixed(1)}%`) : 
                                   'N/A'}
                               </span>
                               <span className={styles.statLabel}>Market:</span>
                               <span className={styles.statValue}>
                                 {winData.marketAverage !== null ? 
                                   (measure.source === 'Ratings' ? 
                                     winData.marketAverage.toFixed(1) : 
                                     `${winData.marketAverage.toFixed(1)}%`) : 
                                   'N/A'}
                               </span>
                               <span className={styles.statLabel}>National:</span>
                               <span className={styles.statValue}>
                                 {winData.nationalAverage !== null ? 
                                   (measure.source === 'Ratings' ? 
                                     winData.nationalAverage.toFixed(1) : 
                                     `${winData.nationalAverage.toFixed(1)}%`) : 
                                   'N/A'}
                               </span>
                             </div>
                           )}
                        </div>
                      </label>
                    </div>
                  );
                })
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
