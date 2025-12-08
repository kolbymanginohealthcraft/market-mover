import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { apiUrl } from '../../../../utils/api';
import { sanitizeProviderName } from '../../../../utils/providerName';
import styles from './BenchmarkChart.module.css';

// Cache for quality measures data
const qualityMeasuresCache = new Map();
const trendDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(ccns, publishDate) {
  const sortedCcns = [...ccns].sort().join(',');
  return `${sortedCcns}|${publishDate || 'latest'}`;
}

function getTrendCacheKey(ccns, measureCode) {
  const sortedCcns = [...ccns].sort().join(',');
  return `trend:${sortedCcns}|${measureCode}`;
}

function getCachedData(cacheKey) {
  const cached = qualityMeasuresCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (cached.expiresAt && now > cached.expiresAt) {
    qualityMeasuresCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedData(cacheKey, data) {
  const expiresAt = Date.now() + CACHE_TTL;
  qualityMeasuresCache.set(cacheKey, {
    data,
    expiresAt
  });
}

function getCachedTrendData(cacheKey) {
  const cached = trendDataCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (cached.expiresAt && now > cached.expiresAt) {
    trendDataCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedTrendData(cacheKey, data) {
  const expiresAt = Date.now() + CACHE_TTL;
  trendDataCache.set(cacheKey, {
    data,
    expiresAt
  });
}

export default function BenchmarkChart({ 
  provider, 
  radiusInMiles, 
  nearbyProviders, 
  nearbyDhcCcns, 
  selectedPublishDate,
  providerTypeFilter,
  selectedMeasure,
  measuresLoading = false,
  onExport = null,
  hasMarketFilter = false,
  chartMode = 'snapshot' // 'snapshot' or 'trend'
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading measure data...');
  const [error, setError] = useState(null);
  const [measureInfo, setMeasureInfo] = useState(null);
  const [publishDate, setPublishDate] = useState(null);
  const [collectionPeriod, setCollectionPeriod] = useState(null);
  const chartRef = useRef(null);
  
  // Memoize CCNs and publish date to create stable cache key
  const allCcns = useMemo(() => {
    if (!nearbyDhcCcns || nearbyDhcCcns.length === 0) return [];
    return nearbyDhcCcns.map(row => String(row.ccn)).filter(Boolean);
  }, [nearbyDhcCcns]);
  
  const cacheKey = useMemo(() => {
    if (allCcns.length === 0) return null;
    return getCacheKey(allCcns, selectedPublishDate);
  }, [allCcns, selectedPublishDate]);

  useEffect(() => {
    async function fetchRehospitalizationData() {
      // Clear previous data when starting a new fetch
      setData(null);
      setError(null);
      setCollectionPeriod(null);
      
      // Clear trend cache when measure changes to ensure fresh data
      // (The cache key includes measure code, but clearing on measure change ensures no stale data)
      if (chartMode === 'trend' && selectedMeasure) {
        // selectedMeasure is a string (code), not an object
        const trendCacheKey = getTrendCacheKey(allCcns, selectedMeasure);
        trendDataCache.delete(trendCacheKey);
        console.log(`🗑️ Cleared cache for measure ${selectedMeasure} to ensure fresh data`);
      }
      
      if (!provider || !nearbyDhcCcns || nearbyDhcCcns.length === 0) {
        setLoading(false);
        setError("No provider or market data available");
        return;
      }

      // Wait for selectedMeasure to be available before fetching data
      if (!selectedMeasure) {
        setLoading(false);
        if (measuresLoading) {
          setError("Loading measures...");
        } else {
          setError("No measure selected");
        }
        return;
      }

      if (allCcns.length === 0) {
        setLoading(false);
        setError("No CCNs found in market area");
        return;
      }

      // Set loading state immediately
      setLoading(true);
      setLoadingMessage(chartMode === 'trend' ? 'Preparing trend data...' : 'Loading snapshot data...');

      // Check cache first
      let cachedResult = cacheKey ? getCachedData(cacheKey) : null;

      try {
        let measures, allProviderData, nationalAverages, publishDate;
        
        let publishDateToUse;
        if (cachedResult) {
          // Use cached data - show brief loading for consistency
          console.log('✅ Using cached quality measures data');
          // Small delay to show loading state and clear old chart
          await new Promise(resolve => setTimeout(resolve, 150));
          measures = cachedResult.measures;
          allProviderData = cachedResult.providerData;
          nationalAverages = cachedResult.nationalAverages;
          publishDateToUse = cachedResult.publishDate;
        } else {
          // 2. Determine publish date to use
          publishDateToUse = selectedPublishDate;
          if (!publishDateToUse) {
            // Fetch available dates and use the latest
            const datesResponse = await fetch(apiUrl('/api/qm_combined'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ccns: allCcns, 
                publish_date: 'latest' 
              })
            });
            
            if (!datesResponse.ok) throw new Error('Failed to fetch available dates');
            const datesResult = await datesResponse.json();
            if (!datesResult.success) throw new Error(datesResult.error);
            
            const availableDates = datesResult.data.availableDates || [];
            if (availableDates.length === 0) {
              throw new Error("No quality measure data available");
            }
            
            publishDateToUse = availableDates[0]; // Use the most recent date
          }

          // 3. Fetch quality measure data
          console.log('🔍 Fetching quality measures data (cache miss)');
          const response = await fetch(apiUrl('/api/qm_combined'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: allCcns, 
              publish_date: publishDateToUse 
            })
          });

          if (!response.ok) throw new Error('Failed to fetch quality measure data');
          const result = await response.json();
          if (!result.success) throw new Error(result.error);

          measures = result.data.measures;
          allProviderData = result.data.providerData;
          nationalAverages = result.data.nationalAverages;
          
          // Cache the result
          if (cacheKey) {
            setCachedData(cacheKey, {
              measures,
              providerData: allProviderData,
              nationalAverages,
              publishDate: publishDateToUse
            });
          }
        }
        
        // Store publish date in state for display
        setPublishDate(publishDateToUse);

        // 4. Find the selected measure or fall back to first available measure
        let targetMeasure = null;
        
        if (selectedMeasure) {
          targetMeasure = measures.find(m => m.code === selectedMeasure);
        }
        
        // Fall back to first available measure if selected measure not found
        if (!targetMeasure && measures.length > 0) {
          targetMeasure = measures[0];
        }

        if (!targetMeasure) {
          throw new Error("No suitable measure found in available data");
        }

        // Store measure info for display
        setMeasureInfo({
          name: targetMeasure.name || 'Quality Measure',
          label: targetMeasure.label || targetMeasure.name || 'Quality Measure',
          description: targetMeasure.description || 'Quality measure performance',
          source: targetMeasure.source || null,
          direction: targetMeasure.direction || null
        });

        // Fetch data collection period from qm_post (only needed for snapshot mode)
        if (chartMode === 'snapshot') {
          try {
            const periodResponse = await fetch(apiUrl('/api/qm_post/collection-period'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code: targetMeasure.code,
                publish_date: publishDateToUse
              })
            });

            if (periodResponse.ok) {
              const periodResult = await periodResponse.json();
              if (periodResult.success && periodResult.data) {
                setCollectionPeriod({
                  start_date: periodResult.data.start_date,
                  end_date: periodResult.data.end_date
                });
              } else {
                setCollectionPeriod(null);
              }
            } else {
              setCollectionPeriod(null);
            }
          } catch (err) {
            console.error('Error fetching collection period:', err);
            setCollectionPeriod(null);
          }
        } else {
          // Clear collection period in trend mode (not needed)
          setCollectionPeriod(null);
        }

        const isStarRating = targetMeasure.source === 'Ratings';
        const providerCcns = nearbyDhcCcns
          .filter(row => row.dhc === provider.dhc)
          .map(row => String(row.ccn));

        let finalPublishDate = publishDateToUse;
        let chartDataForExport = null;

        if (chartMode === 'trend') {
          // TREND MODE: Fetch data for all available time periods
          // Check cache first - but verify it's for the correct measure
          const trendCacheKey = getTrendCacheKey(allCcns, targetMeasure.code);
          const cachedTrendData = getCachedTrendData(trendCacheKey);
          
          if (cachedTrendData && cachedTrendData.data && Array.isArray(cachedTrendData.data) && cachedTrendData.data.length > 0) {
            console.log(`✅ Using cached trend data for measure ${targetMeasure.code} (${cachedTrendData.data.length} periods)`);
            // Small delay to show loading state and clear old chart
            await new Promise(resolve => setTimeout(resolve, 150));
            setData(cachedTrendData.data);
            setPublishDate(cachedTrendData.latestDate);
            setLoading(false);
            chartDataForExport = cachedTrendData.data;
            finalPublishDate = cachedTrendData.latestDate;
            
            if (onExport && chartDataForExport) {
              onExport({
                chartRef,
                data: chartDataForExport,
                measureInfo: targetMeasure,
                publishDate: finalPublishDate
              });
            }
            return;
          }

          setLoadingMessage('Finding periods with data for this measure...');
          
          // CRITICAL FIX: Query for dates that ACTUALLY have data for this specific measure and CCNs
          // This is the correct approach - query by measure first, get dates from results
          const datesResponse = await fetch(apiUrl('/api/qm_setting_dates'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ccns: allCcns,
              measures: [targetMeasure.code]
            })
          });
          
          if (!datesResponse.ok) throw new Error('Failed to fetch dates for this measure');
          const datesResult = await datesResponse.json();
          if (!datesResult.success) throw new Error(datesResult.error || 'Failed to fetch dates for this measure');
          
          const availableDates = datesResult.data || [];
          if (availableDates.length === 0) {
            throw new Error(`No historical data available for ${targetMeasure.name}`);
          }
          
          console.log(`📅 Found ${availableDates.length} periods with data for measure ${targetMeasure.code}:`, availableDates);
          setLoadingMessage(`Loading trend data for ${availableDates.length} time periods...`);

          // Now fetch data for ONLY the dates where this measure actually exists
          const fetchPromises = availableDates.map(async (publishDate) => {
            try {
              const dataResponse = await fetch(apiUrl('/api/qm_combined'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  ccns: allCcns,
                  publish_date: publishDate,
                  measures: [targetMeasure.code]
                })
              });

              if (!dataResponse.ok) return null;
              const dataResult = await dataResponse.json();
              if (!dataResult.success) return null;

              const { providerData: rawProviderData, nationalAverages: periodNationalAverages } = dataResult.data;

              // Since we queried for dates that have this measure, we should have data
              // But validate we have valid data before proceeding
              if (!rawProviderData || !Array.isArray(rawProviderData) || rawProviderData.length === 0) {
                console.log(`⚠️ Unexpected: ${publishDate} returned no provider data for measure ${targetMeasure.code}`);
                return null;
              }

              const measureDataRows = rawProviderData.filter(d => d.code === targetMeasure.code);
              
              // Verify we have rows with valid numeric scores (not just null/undefined)
              const hasValidScores = measureDataRows.some(d => 
                d.score !== null && 
                d.score !== undefined && 
                !isNaN(Number(d.score)) &&
                typeof d.score === 'number'
              );

              if (!hasValidScores) {
                console.log(`⚠️ Unexpected: ${publishDate} has measure rows but no valid numeric scores for ${targetMeasure.code}`);
                return null;
              }

              return { publishDate, data: dataResult.data };
            } catch (err) {
              console.error(`Error fetching data for ${publishDate}:`, err);
              return null;
            }
          });

          const results = await Promise.all(fetchPromises);
          const trendData = [];

          // Filter out null results (periods where measure doesn't exist)
          const validResults = results.filter(result => result !== null && result.data);
          
          if (validResults.length === 0) {
            throw new Error(`No data available for ${targetMeasure.name} in the selected time period`);
          }

          // Set final publish date to the latest period that has data
          finalPublishDate = validResults[0].publishDate;

          console.log(`📊 Processing ${validResults.length} periods with data for measure ${targetMeasure.code} (${targetMeasure.name})`);
          
          validResults.forEach((result) => {
            const { publishDate, data } = result;
            const { providerData: rawProviderData, nationalAverages: periodNationalAverages } = data;

            // Filter to only rows with this measure code
            const measureDataRows = rawProviderData.filter(d => d.code === targetMeasure.code);
            
            // Get provider score for this period - ONLY use rows with valid numeric scores
            // CRITICAL: Do NOT use (d.score || 0) as this creates fake 0 values for null/undefined
            const periodProviderData = measureDataRows.filter(d => 
              providerCcns.includes(d.ccn) &&
              d.score !== null &&
              d.score !== undefined &&
              !isNaN(Number(d.score)) &&
              typeof d.score === 'number'
            );
            const providerScore = periodProviderData.length > 0
              ? periodProviderData.reduce((sum, d) => sum + d.score, 0) / periodProviderData.length
              : null;

            // Get market average for this period (if market filter is active) - ONLY use valid numeric scores
            let marketAverage = null;
            if (hasMarketFilter && provider) {
              const marketCcns = nearbyDhcCcns
                .filter(row => row.dhc !== provider.dhc)
                .map(row => String(row.ccn));
              
              const marketData = measureDataRows.filter(d => 
                marketCcns.includes(d.ccn) &&
                d.score !== null &&
                d.score !== undefined &&
                !isNaN(Number(d.score)) &&
                typeof d.score === 'number'
              );

              if (marketData.length > 0) {
                marketAverage = marketData.reduce((sum, d) => sum + d.score, 0) / marketData.length;
              }
            }

            // Get national average for this period - validate it's a real number
            const nationalAverageRaw = periodNationalAverages && periodNationalAverages[targetMeasure.code] 
              ? periodNationalAverages[targetMeasure.code].score 
              : null;
            const nationalAverage = (nationalAverageRaw !== null && 
                                   nationalAverageRaw !== undefined && 
                                   !isNaN(Number(nationalAverageRaw)) &&
                                   typeof nationalAverageRaw === 'number')
              ? nationalAverageRaw
              : null;

            // Since we queried for dates with this measure, we should have data
            // But only include if we have valid provider or market scores (proves measure existed for our CCNs)
            const hasRealData = providerScore !== null || marketAverage !== null;
            
            if (hasRealData) {
              const period = publishDate.substring(0, 7); // YYYY-MM
              trendData.push({
                period,
                provider: providerScore !== null 
                  ? (isStarRating ? providerScore : Math.round(providerScore * 100) / 100)
                  : null,
                market: marketAverage !== null
                  ? (isStarRating ? marketAverage : Math.round(marketAverage * 100) / 100)
                  : null,
                national: nationalAverage !== null
                  ? (isStarRating ? nationalAverage : Math.round(nationalAverage * 100) / 100)
                  : null
              });
            } else {
              console.log(`⚠️ Skipping ${publishDate} - measure data exists but no valid scores found`);
            }
          });
          
          console.log(`✅ Final trend data for ${targetMeasure.code}: ${trendData.length} periods`, 
            trendData.map(d => d.period));

          // Sort by period ascending
          trendData.sort((a, b) => a.period.localeCompare(b.period));

          // Cache the trend data
          if (trendCacheKey) {
            setCachedTrendData(trendCacheKey, {
              data: trendData,
              latestDate: finalPublishDate
            });
          }

          setData(trendData);
          setPublishDate(finalPublishDate);
          chartDataForExport = trendData;
        } else {
          // SNAPSHOT MODE: Use current logic for single period
          // 5. Get provider's measure rate
          const providerMeasureData = allProviderData.filter(d => 
            providerCcns.includes(d.ccn) && d.code === targetMeasure.code
          );

          let providerScore = null;
          if (providerMeasureData.length > 0) {
            providerScore = providerMeasureData.reduce((sum, d) => sum + (d.score || 0), 0) / providerMeasureData.length;
          }

          // 6. Calculate market average only if market filter is active
          let marketAverage = null;
          if (hasMarketFilter && provider) {
            const marketCcns = nearbyDhcCcns
              .filter(row => row.dhc !== provider.dhc)
              .map(row => String(row.ccn));
            
            const marketData = allProviderData.filter(d => 
              marketCcns.includes(d.ccn) && d.code === targetMeasure.code
            );

            if (marketData.length > 0) {
              marketAverage = marketData.reduce((sum, d) => sum + (d.score || 0), 0) / marketData.length;
            }
          }

          // 7. Get national average
          const nationalAverage = nationalAverages[targetMeasure.code]?.score || null;

          // 8. Create chart data
          const chartData = [];
          
          if (providerScore !== null) {
            chartData.push({
              name: 'Provider',
              value: isStarRating ? providerScore : Math.round(providerScore * 100) / 100,
              fill: '#3FB985',
              stroke: '#2E8B57'
            });
          }
          
          if (marketAverage !== null) {
            chartData.push({
              name: 'Market Avg',
              value: isStarRating ? marketAverage : Math.round(marketAverage * 100) / 100,
              fill: '#6B7280',
              stroke: '#4B5563'
            });
          }
          
          if (nationalAverage !== null) {
            chartData.push({
              name: 'National Avg',
              value: isStarRating ? nationalAverage : Math.round(nationalAverage * 100) / 100,
              fill: '#6B7280',
              stroke: '#4B5563'
            });
          }

          setData(chartData);
          chartDataForExport = chartData;
        }

        setLoading(false);
        
        // Expose export function to parent component
        if (onExport && chartDataForExport) {
          onExport({
            chartRef,
            data: chartDataForExport,
            measureInfo: targetMeasure,
            publishDate: finalPublishDate
          });
        }

      } catch (err) {
        console.error('Error fetching rehospitalization data:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchRehospitalizationData();
  }, [provider, allCcns, cacheKey, selectedPublishDate, selectedMeasure, measuresLoading, chartMode, hasMarketFilter]);

  const renderTrendLegend = () => {
    const legendEntries = [
      { dataKey: 'provider', name: 'Provider', color: '#3FB985', strokeWidth: 2.5, isDashed: false },
      ...(hasMarketFilter ? [{ dataKey: 'market', name: 'Market Avg', color: '#6B7280', strokeWidth: 2, isDashed: false }] : []),
      { dataKey: 'national', name: 'National Avg', color: '#6B7280', strokeWidth: 2, isDashed: true }
    ];
    
    return (
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '10px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        zIndex: 10
      }}>
        {legendEntries.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="40" height="16" style={{ overflow: 'visible' }}>
              <line
                x1="0"
                y1="8"
                x2="40"
                y2="8"
                stroke={entry.color}
                strokeWidth={entry.strokeWidth}
                strokeDasharray={entry.isDashed ? '5 5' : '0'}
              />
            </svg>
            <span style={{ fontSize: '14px', color: '#374151' }}>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isStarRating = measureInfo?.source === 'Ratings';
      
      if (chartMode === 'trend') {
        // Trend mode tooltip - show all values
        return (
          <div className={styles.customTooltip}>
            <p className={styles.tooltipLabel}>{`Period: ${label}`}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {payload.map((entry, index) => {
                const value = entry.value;
                if (value === null || value === undefined) return null;
                const displayValue = isStarRating ? value.toFixed(1) : `${value.toFixed(2)}%`;
                const isDashed = entry.dataKey === 'national';
                const strokeWidth = entry.dataKey === 'provider' ? 2.5 : 2;
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="12" style={{ overflow: 'visible' }}>
                      <line
                        x1="0"
                        y1="6"
                        x2="16"
                        y2="6"
                        stroke={entry.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={isDashed ? '3 3' : '0'}
                      />
                    </svg>
                    <span className={styles.tooltipValue} style={{ color: '#374151' }}>
                      {`${entry.name}: `}
                      <span style={{ color: entry.color, fontWeight: '700' }}>{displayValue}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Snapshot mode tooltip - single value
        const value = payload[0].value;
        const displayValue = isStarRating ? value.toFixed(1) : `${value.toFixed(1)}%`;
        
        return (
          <div className={styles.customTooltip}>
            <p className={styles.tooltipLabel}>{`${label}`}</p>
            <p className={styles.tooltipValue} style={{ color: payload[0].color, fontWeight: '700' }}>{displayValue}</p>
          </div>
        );
      }
    }
    return null;
  };

           if (loading) {
        return (
          <div className={styles.benchmarkContainer}>
            <div className={styles.chartHeader}>
              <h3 className={styles.metricTitle}>Quality Measure</h3>
              <p className={styles.metricDescription}>
                {chartMode === 'trend' ? 'Loading trend data...' : 'Loading snapshot data...'}
              </p>
            </div>
            <div className={styles.chartContent}>
              <div className={styles.loadingMessage}>
                {loadingMessage || (chartMode === 'trend' ? 'Loading trend data...' : 'Loading quality measure data...')}
              </div>
            </div>
          </div>
        );
      }

           if (error) {
        return (
          <div className={styles.benchmarkContainer}>
            <div className={styles.chartHeader}>
              <h3 className={styles.metricTitle}>Quality Measure</h3>
              <p className={styles.metricDescription}>
                {measuresLoading ? 'Loading measures...' : 'Error loading measure data'}
              </p>
            </div>
            <div className={styles.chartContent}>
              {measuresLoading ? (
                <div className={styles.loadingMessage}>Loading quality measures...</div>
              ) : (
                <div className={styles.errorMessage}>Error: {error}</div>
              )}
            </div>
          </div>
        );
      }

           if (!data || data.length === 0) {
        return (
          <div className={styles.benchmarkContainer}>
            <div className={styles.chartHeader}>
              <h3 className={styles.metricTitle}>Quality Measure</h3>
              <p className={styles.metricDescription}>No measure data available</p>
            </div>
            <div className={styles.chartContent}>
              <div className={styles.noDataMessage}>No quality measure data available</div>
            </div>
          </div>
        );
      }

     return (
     <div className={styles.benchmarkContainer} ref={chartRef} style={{ position: 'relative' }}>
       {chartMode === 'trend' && renderTrendLegend()}
       <div className={styles.chartHeader} style={chartMode === 'trend' ? { paddingRight: '200px' } : {}}>
         <h3 className={styles.metricTitle}>
           {measureInfo?.label || 'Rehospitalization Rate'}
         </h3>
         {measureInfo?.source !== 'Ratings' && (
           <p className={styles.metricDescription}>
             {measureInfo?.description || 'Rate of patients readmitted to hospital within 30 days'}
           </p>
         )}
        <div className={styles.chartNotes}>
          {chartMode === 'snapshot' && (
            <p className={styles.noteText}>
              <strong>Data Publication Date:</strong> {publishDate ? (() => {
                  const [year, month] = publishDate.split('-');
                  return `${year}-${month}`;
                })() : 'Not set'}
              {collectionPeriod && collectionPeriod.start_date && collectionPeriod.end_date && (
                <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '12px' }}>
                  (Data collection period: {(() => {
                    const formatDate = (dateStr) => {
                      if (!dateStr) return '';
                      // Handle both YYYY-MM-DD strings and date objects from BigQuery
                      let dateValue = dateStr.value || dateStr;
                      
                      // If it's already a string in YYYY-MM-DD format, parse it directly to avoid timezone issues
                      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                        const parts = dateValue.split('T')[0].split('-'); // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
                        const year = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10);
                        const day = parseInt(parts[2], 10);
                        // Parse directly from string to avoid timezone conversion
                        return `${month}/${day}/${year}`;
                      }
                      
                      // If it's a Date object, extract components using UTC methods to avoid timezone shifts
                      if (dateValue instanceof Date || (typeof dateValue === 'object' && dateValue.getTime)) {
                        const date = new Date(dateValue);
                        if (!isNaN(date.getTime())) {
                          // Use UTC methods to avoid timezone conversion
                          const year = date.getUTCFullYear();
                          const month = date.getUTCMonth() + 1;
                          const day = date.getUTCDate();
                          return `${month}/${day}/${year}`;
                        }
                      }
                      
                      // Try parsing as ISO string with UTC methods
                      try {
                        const date = new Date(dateValue);
                        if (!isNaN(date.getTime())) {
                          const year = date.getUTCFullYear();
                          const month = date.getUTCMonth() + 1;
                          const day = date.getUTCDate();
                          return `${month}/${day}/${year}`;
                        }
                      } catch (e) {
                        // If parsing fails, return as-is
                      }
                      
                      return String(dateValue);
                    };
                    const startFormatted = formatDate(collectionPeriod.start_date);
                    const endFormatted = formatDate(collectionPeriod.end_date);
                    return `${startFormatted} to ${endFormatted}`;
                  })()})
                </span>
              )}
            </p>
          )}
          <p className={styles.noteText}>
            <strong>Note:</strong> {(() => {
              if (measureInfo?.source === 'Ratings') {
                return 'Higher scores indicate better performance.';
              }
              if (measureInfo?.direction === 'Higher') {
                return 'Higher scores indicate better performance.';
              }
              return 'Lower scores indicate better performance.';
            })()}
          </p>
          <p className={styles.noteText}>
            <strong>Provider:</strong> {sanitizeProviderName(provider?.name) || provider?.name || 'N/A'}
          </p>
        </div>
       </div>

      <div className={styles.chartContent}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'trend' ? (
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{ value: 'Data Publication Date', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: 14, fill: '#374151' } }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                domain={measureInfo?.source === 'Ratings' ? [0, 5] : undefined}
                ticks={measureInfo?.source === 'Ratings' ? [0, 1, 2, 3, 4, 5] : undefined}
                tickFormatter={(value) => {
                  const isStarRating = measureInfo?.source === 'Ratings';
                  return isStarRating ? Math.round(value).toString() : `${value}%`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="provider"
                name="Provider"
                stroke="#3FB985"
                strokeWidth={2.5}
                dot={{ fill: '#3FB985', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3FB985', strokeWidth: 2, fill: '#fff' }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="provider"
                  position="top"
                  offset={8}
                  formatter={(value) => {
                    if (value === null || value === undefined) return '';
                    const isStarRating = measureInfo?.source === 'Ratings';
                    return isStarRating ? value.toFixed(1) : `${value.toFixed(2)}%`;
                  }}
                  style={{ fontSize: '10px', fill: '#3FB985', fontWeight: '500' }}
                />
              </Line>
              {hasMarketFilter && (
                <Line
                  type="monotone"
                  dataKey="market"
                  name="Market Avg"
                  stroke="#6B7280"
                  strokeWidth={2}
                  dot={{ fill: '#6B7280', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#6B7280', strokeWidth: 2, fill: '#fff' }}
                  connectNulls={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="national"
                name="National Avg"
                stroke="#6B7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#6B7280', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6B7280', strokeWidth: 2, fill: '#fff' }}
                connectNulls={false}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#666', fontWeight: '500' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                domain={measureInfo?.source === 'Ratings' ? [0, 5] : undefined}
                ticks={measureInfo?.source === 'Ratings' ? [0, 1, 2, 3, 4, 5] : undefined}
                tickFormatter={(value) => {
                  const isStarRating = measureInfo?.source === 'Ratings';
                  return isStarRating ? Math.round(value).toString() : `${value}%`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                strokeWidth={2}
                minPointSize={3}
              >
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  formatter={(value) => {
                    const isStarRating = measureInfo?.source === 'Ratings';
                    return isStarRating ? value.toFixed(1) : `${value}%`;
                  }}
                  style={{ fontSize: '16px', fontWeight: '600', fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
