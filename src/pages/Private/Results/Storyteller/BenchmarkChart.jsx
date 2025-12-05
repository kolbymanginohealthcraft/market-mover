import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { apiUrl } from '../../../../utils/api';
import { sanitizeProviderName } from '../../../../utils/providerName';
import styles from './BenchmarkChart.module.css';

// Cache for quality measures data
const qualityMeasuresCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(ccns, publishDate) {
  const sortedCcns = [...ccns].sort().join(',');
  return `${sortedCcns}|${publishDate || 'latest'}`;
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
  hasMarketFilter = false
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [measureInfo, setMeasureInfo] = useState(null);
  const [publishDate, setPublishDate] = useState(null);
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

      // Check cache first before setting loading state
      let cachedResult = cacheKey ? getCachedData(cacheKey) : null;
      
      if (!cachedResult) {
        setLoading(true);
      }
      setError(null);

      try {
        let measures, allProviderData, nationalAverages, publishDate;
        
        let publishDateToUse;
        if (cachedResult) {
          // Use cached data - no loading state needed
          console.log('✅ Using cached quality measures data');
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
          source: targetMeasure.source || null
        });



        // 5. Get provider's measure rate
        const providerCcns = nearbyDhcCcns
          .filter(row => row.dhc === provider.dhc)
          .map(row => String(row.ccn));
        
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
        const isStarRating = targetMeasure.source === 'Ratings';
        

        
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
        setLoading(false);
        
        // Expose export function to parent component
        if (onExport) {
          onExport({
            chartRef,
            data: chartData,
            measureInfo: targetMeasure,
            publishDate: publishDateToUse
          });
        }

      } catch (err) {
        console.error('Error fetching rehospitalization data:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchRehospitalizationData();
  }, [provider, allCcns, cacheKey, selectedPublishDate, selectedMeasure, measuresLoading]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isStarRating = measureInfo?.source === 'Ratings';
      const value = payload[0].value;
      const displayValue = isStarRating ? value.toFixed(1) : `${value.toFixed(1)}%`;
      
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{`${label}`}</p>
          <p className={styles.tooltipValue}>{displayValue}</p>
        </div>
      );
    }
    return null;
  };

           if (loading) {
        return (
          <div className={styles.benchmarkContainer}>
            <div className={styles.chartHeader}>
              <h3 className={styles.metricTitle}>Quality Measure</h3>
              <p className={styles.metricDescription}>Loading measure data...</p>
            </div>
            <div className={styles.chartContent}>
              <div className={styles.loadingMessage}>Loading quality measure data...</div>
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
     <div className={styles.benchmarkContainer} ref={chartRef}>
       <div className={styles.chartHeader}>
         <h3 className={styles.metricTitle}>
           {measureInfo?.label || 'Rehospitalization Rate'}
         </h3>
         {measureInfo?.source !== 'Ratings' && (
           <p className={styles.metricDescription}>
             {measureInfo?.description || 'Rate of patients readmitted to hospital within 30 days'}
           </p>
         )}
        <div className={styles.chartNotes}>
          <p className={styles.noteText}>
            <strong>Data Publication Date:</strong> {publishDate ? (() => {
              const [year, month] = publishDate.split('-');
              return `${year}-${month}`;
            })() : 'Not set'}
            <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '12px' }}>
              (Data collection period: 1/1/2024 to 12/31/2024)
            </span>
          </p>
          <p className={styles.noteText}>
            <strong>Note:</strong> {measureInfo?.source === 'Ratings' 
              ? 'Higher scores indicate better performance.' 
              : 'Lower scores indicate better performance.'}
          </p>
          <p className={styles.noteText}>
            <strong>Provider:</strong> {sanitizeProviderName(provider?.name) || provider?.name || 'N/A'}
          </p>
        </div>
       </div>

      <div className={styles.chartContent}>
        <ResponsiveContainer width="100%" height="100%">
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}
