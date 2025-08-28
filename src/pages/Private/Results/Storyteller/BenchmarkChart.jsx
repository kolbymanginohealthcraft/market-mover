import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { apiUrl } from '../../../../utils/api';
import styles from './BenchmarkChart.module.css';

export default function BenchmarkChart({ 
  provider, 
  radiusInMiles, 
  nearbyProviders, 
  nearbyDhcCcns, 
  selectedPublishDate,
  providerTypeFilter,
  selectedMeasure,
  measuresLoading = false,
  onExport = null
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [measureInfo, setMeasureInfo] = useState(null);
  const chartRef = useRef(null);

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

      setLoading(true);
      setError(null);

      try {
        // 1. Get all CCNs for the market area
        const allCcns = nearbyDhcCcns.map(row => String(row.ccn)).filter(Boolean);
        
        if (allCcns.length === 0) {
          throw new Error("No CCNs found in market area");
        }

        // 2. Determine publish date to use
        let publishDate = selectedPublishDate;
        if (!publishDate) {
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
          
          publishDate = availableDates[0]; // Use the most recent date
        }

        // 3. Fetch quality measure data
        const response = await fetch(apiUrl('/api/qm_combined'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ccns: allCcns, 
            publish_date: publishDate 
          })
        });

        if (!response.ok) throw new Error('Failed to fetch quality measure data');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        const { measures, providerData: allProviderData, nationalAverages } = result.data;

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
          description: targetMeasure.description || 'Quality measure performance'
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

        // 6. Calculate market average (excluding the main provider)
        const marketCcns = nearbyDhcCcns
          .filter(row => row.dhc !== provider.dhc)
          .map(row => String(row.ccn));
        
        const marketData = allProviderData.filter(d => 
          marketCcns.includes(d.ccn) && d.code === targetMeasure.code
        );

        let marketAverage = null;
        if (marketData.length > 0) {
          marketAverage = marketData.reduce((sum, d) => sum + (d.score || 0), 0) / marketData.length;
        }

        // 7. Get national average
        const nationalAverage = nationalAverages[targetMeasure.code]?.score || null;

        // 8. Create chart data
        const chartData = [];
        
        if (providerScore !== null) {
          chartData.push({
            name: 'Provider',
            value: Math.round(providerScore * 100) / 100,
            fill: '#3FB985',
            stroke: '#2E8B57'
          });
        }
        
        if (marketAverage !== null) {
          chartData.push({
            name: 'Market Avg',
            value: Math.round(marketAverage * 100) / 100,
            fill: '#6B7280',
            stroke: '#4B5563'
          });
        }
        
        if (nationalAverage !== null) {
          chartData.push({
            name: 'National Avg',
            value: Math.round(nationalAverage * 100) / 100,
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
            publishDate
          });
        }

      } catch (err) {
        console.error('Error fetching rehospitalization data:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchRehospitalizationData();
  }, [provider, nearbyDhcCcns, selectedPublishDate, providerTypeFilter, selectedMeasure]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{`${label}`}</p>
          <p className={styles.tooltipValue}>{`${payload[0].value}%`}</p>
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
           {measureInfo?.name || 'Rehospitalization Rate'}
         </h3>
         <p className={styles.metricDescription}>
           {measureInfo?.description || 'Rate of patients readmitted to hospital within 30 days'}
         </p>
         <div className={styles.chartNotes}>
           <p className={styles.noteText}>
             <strong>Note:</strong> Lower scores indicate better performance. Data collection period: 1/1/2024 to 12/31/2024.
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
              tickFormatter={(value) => `${value}%`}
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
                 formatter={(value) => `${value}%`}
                 style={{ fontSize: '16px', fontWeight: '600', fill: '#374151' }}
               />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
