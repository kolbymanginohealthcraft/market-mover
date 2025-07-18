import React, { useMemo } from 'react';
import styles from './CMSEnrollmentTrendChart.module.css';

function formatMonthLabel(ym) {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIdx = parseInt(month, 10) - 1;
  return mIdx >= 0 && mIdx < 12 ? `${monthNames[mIdx]} ${year}` : year;
}

export default function CMSEnrollmentTrendChart({ data, metric = 'ma_and_other' }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    // Remove duplicates and sort by month
    const seen = new Set();
    const sorted = data
      .filter(d => d.month && !seen.has(d.month) && seen.add(d.month))
      .sort((a, b) => a.month.localeCompare(b.month));
    return sorted.map(d => ({
      month: d.month,
      value: d[metric] || 0
    }));
  }, [data, metric]);

  if (!data || data.length === 0) return <div className={styles.chart}>No trend data available.</div>;

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  // Only show every Nth label to avoid crowding
  const labelStep = chartData.length > 24 ? Math.ceil(chartData.length / 12) : 1;

  return (
    <div className={styles.chart}>
      <div className={styles.header}>
        <h4>Monthly Trend</h4>
        <p className={styles.subtitle}>
          {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} by Month
        </p>
      </div>
      <div className={styles.chartContainer}>
        <div className={styles.yAxis}>
          <span>{formatNumber(maxValue)}</span>
          <span>{formatNumber(Math.round((maxValue + minValue) / 2))}</span>
          <span>{formatNumber(minValue)}</span>
        </div>
        <div className={styles.chartArea}>
          <svg className={styles.svg} viewBox={`0 0 ${chartData.length * 40 + 40} 200`}>
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="50" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Data line */}
            <polyline
              points={chartData.map((d, i) => {
                const x = 20 + (i * 40);
                const y = 180 - ((d.value - minValue) / (maxValue - minValue || 1)) * 160;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {chartData.map((d, i) => {
              const x = 20 + (i * 40);
              const y = 180 - ((d.value - minValue) / (maxValue - minValue || 1)) * 160;
              return (
                <g key={d.month}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Only show every Nth label */}
                  {i % labelStep === 0 && (
                    <text
                      x={x}
                      y="195"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                    >
                      {formatMonthLabel(d.month)}
                    </text>
                  )}
                  {/* Show value on hover or always if desired */}
                  {/* <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#059669"
                    fontWeight="bold"
                  >
                    {formatNumber(d.value)}
                  </text> */}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
} 