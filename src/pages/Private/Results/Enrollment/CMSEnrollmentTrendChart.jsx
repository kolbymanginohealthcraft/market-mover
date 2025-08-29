import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import styles from "./CMSEnrollmentTrendChart.module.css";

const CMSEnrollmentTrendChart = ({ data, nationalData, metric = 'ma_and_other', displayMode = 'count', displayModeToggle }) => {
  // Process data for Recharts
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Remove duplicates and sort by month
    const seen = new Set();
    const processedData = data
      .filter(d => d.month && !seen.has(d.month) && seen.add(d.month))
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => {
        let value;
        if (displayMode === 'percentage') {
          // Use percentage data if available, otherwise calculate it
          value = d[`${metric}_percentage`] !== undefined ? 
            d[`${metric}_percentage`] : 
            (d.total_benes > 0 ? ((d[metric] || 0) / d.total_benes * 100) : 0);
        } else {
          value = d[metric] || 0;
        }
        
        return {
          month: d.month,
          value: value
        };
      });

    // Add national average data if available and in percentage mode
    if (displayMode === 'percentage' && nationalData && Array.isArray(nationalData) && nationalData.length > 0) {
      console.log('🔍 Processing national data for chart:', { nationalDataLength: nationalData.length, metric });
      console.log('🔍 National data sample:', nationalData.slice(0, 2));
      console.log('🔍 Local data months:', processedData.map(d => d.month));
      console.log('🔍 National data months:', nationalData.map(d => d.month).slice(0, 10));
      
      const nationalSeen = new Set();
      const nationalProcessed = nationalData
        .filter(d => d.month && !nationalSeen.has(d.month) && nationalSeen.add(d.month))
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(d => {
          const nationalValue = d[`${metric}_percentage`] !== undefined ? 
            d[`${metric}_percentage`] : 
            (d.total_benes > 0 ? ((d[metric] || 0) / d.total_benes * 100) : 0);
          
          return {
            month: d.month,
            nationalValue: nationalValue
          };
        });

      console.log('🔍 National processed data sample:', nationalProcessed.slice(0, 3));
      console.log('🔍 National processed months:', nationalProcessed.map(d => d.month));

      // Merge national data with local data
      const mergedData = processedData.map(localPoint => {
        const nationalPoint = nationalProcessed.find(n => n.month === localPoint.month);
        return {
          ...localPoint,
          nationalValue: nationalPoint ? nationalPoint.nationalValue : null
        };
      });

      console.log('🔍 Final chart data with national values sample:', mergedData.slice(0, 3));
      return mergedData;
    }

    return processedData;
  }, [data, nationalData, metric, displayMode]);

  // Get unique years for reference lines
  const yearStarts = useMemo(() => {
    const years = [...new Set(chartData.map(d => d.month.split('-')[0]))];
    return years.map(year => `${year}-01`);
  }, [chartData]);

  // Get year ranges for labels
  const yearRanges = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const years = [...new Set(chartData.map(d => d.month.split('-')[0]))].sort();
    return years.map(year => {
      const firstIndex = chartData.findIndex(d => d.month.startsWith(year));
      const lastIndex = chartData.findLastIndex(d => d.month.startsWith(year));
      
      return {
        year,
        startIndex: firstIndex,
        endIndex: lastIndex,
        centerIndex: (firstIndex + lastIndex) / 2
      };
    });
  }, [chartData]);

  // Calculate custom Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    // Include both local and national values in domain calculation
    const allValues = chartData.flatMap(d => [
      d.value,
      d.nationalValue
    ]).filter(v => v !== null && v !== undefined);
    
    if (allValues.length === 0) return [0, 100];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    
    // Add 20% padding above and below
    const padding = range * 0.2;
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const localValue = payload[0].value;
      const nationalValue = payload[0].payload?.nationalValue;
      
      const formattedLocalValue = displayMode === 'percentage' ? 
        `${localValue.toFixed(1)}%` : 
        new Intl.NumberFormat().format(Math.round(localValue));
      
      const formattedNationalValue = nationalValue !== null && nationalValue !== undefined ? 
        `${nationalValue.toFixed(1)}%` : null;
      
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>
            <strong>{label}</strong>
          </p>
          <p className={styles.tooltipValue}>
            <span className={styles.tooltipDot} style={{ backgroundColor: '#10B981' }}></span>
            Local: {formattedLocalValue}
          </p>
          {formattedNationalValue && (
            <p className={styles.tooltipNationalValue}>
              <span className={styles.tooltipDot} style={{ backgroundColor: '#6B7280' }}></span>
              National: {formattedNationalValue}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Create a more sophisticated tick formatter that shows years appropriately
  const formatXAxisTick = (tickItem) => {
    if (!tickItem) return '';
    
    const [year, month] = tickItem.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(month, 10) - 1;
    
    if (mIdx >= 0 && mIdx < 12) {
      // Show year for January and July to help with multi-year data
      if (mIdx === 0 || mIdx === 6) {
        return `${monthNames[mIdx]} ${year}`;
      }
      // Show just month for other points
      return monthNames[mIdx];
    }
    return `${year}-${month}`;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className={styles.chartWrapper}>
        <div className={styles.noData}>No trend data available.</div>
      </div>
    );
  }

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>Enrollment Trend</div>
        {displayModeToggle && (
          <div className={styles.chartControls}>
            {displayModeToggle}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 60,
            bottom: 50,
          }}
        >
                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
           {displayMode === 'percentage' && <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '10px' }} />}
           {yearStarts.map((yearStart) => (
             <ReferenceLine
               key={yearStart}
               x={yearStart}
               stroke="#e5e7eb"
               strokeWidth={2}
               strokeDasharray="0"
             />
           ))}
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666', fontWeight: '500' }}
            tickFormatter={formatXAxisTick}
            angle={-45}
            textAnchor="end"
            height={60}
            ticks={chartData.map(d => d.month)}
          />
          {/* Year labels underneath */}
          {yearRanges.map(({ year, centerIndex }) => {
            const centerMonth = chartData[centerIndex]?.month;
            return (
              <ReferenceLine
                key={`year-label-${year}`}
                x={centerMonth}
                stroke="none"
                label={{
                  value: year,
                  position: 'bottom',
                  offset: 10,
                  style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    fill: '#374151'
                  }
                }}
              />
            );
          })}
                                                                                       <YAxis
               axisLine={false}
               tickLine={false}
               tick={{ fontSize: 12, fill: '#666' }}
               tickFormatter={(value) => displayMode === 'percentage' ? 
                 `${value.toFixed(1)}%` : 
                 new Intl.NumberFormat().format(Math.round(value))}
               domain={yAxisDomain}
               allowDecimals={displayMode === 'percentage'}
             />
                     <Tooltip 
                       content={<CustomTooltip />} 
                       cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '3 3' }}
                       wrapperStyle={{ outline: 'none' }}
                     />
                       <Line
              type="natural"
              dataKey="value"
              name="Local Data"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
              animationDuration={1000}
              animationEasing="ease-out"
            />
                       {displayMode === 'percentage' && (
              <>
                {console.log('🔍 Rendering national average line')}
                <Line
                  type="natural"
                  dataKey="nationalValue"
                  name="National Average"
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#6B7280', strokeWidth: 2, fill: '#fff' }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </>
                         )}
         </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CMSEnrollmentTrendChart; 