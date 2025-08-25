import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import styles from "./CMSEnrollmentTrendChart.module.css";

const CMSEnrollmentTrendChart = ({ data, metric = 'ma_and_other' }) => {
  // Process data for Recharts
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Remove duplicates and sort by month
    const seen = new Set();
    return data
      .filter(d => d.month && !seen.has(d.month) && seen.add(d.month))
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        month: d.month,
        value: d[metric] || 0
      }));
  }, [data, metric]);

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
      const yearData = chartData.filter(d => d.month.startsWith(year));
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
    
    const values = chartData.map(d => d.value).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return [0, 100];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add 20% padding above and below
    const padding = range * 0.2;
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>
            <strong>{label}</strong>
          </p>
          <p className={styles.tooltipValue}>
            {new Intl.NumberFormat().format(payload[0].value)}
          </p>
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
      <div className={styles.chartTitle}>Enrollment Trend</div>
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
          {yearStarts.map((yearStart, index) => (
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
               tickFormatter={(value) => new Intl.NumberFormat().format(Math.round(value))}
               domain={yAxisDomain}
               allowDecimals={false}
             />
          <Tooltip content={<CustomTooltip />} />
                                    <Line
                 type="natural"
                 dataKey="value"
                 stroke="#10B981"
                 strokeWidth={2.5}
                 dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                 activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
                 animationDuration={1000}
                 animationEasing="ease-out"
               />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CMSEnrollmentTrendChart; 