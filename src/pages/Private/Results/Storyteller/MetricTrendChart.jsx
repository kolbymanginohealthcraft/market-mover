import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { sanitizeProviderName } from '../../../../utils/providerName';
import styles from './MetricTrendChart.module.css';

export default function MetricTrendChart({ periods, measureName, measureLabel, measureDescription, measureSource, measureDirection, providerName }) {
  // Process data for chart - sort by date ascending
  const chartData = useMemo(() => {
    if (!periods || periods.length === 0) return [];

    return periods
      .slice()
      .sort((a, b) => a.publishDate.localeCompare(b.publishDate))
      .map(item => ({
        period: item.publishDate.substring(0, 7), // YYYY-MM
        value: item.value,
        nationalAverage: item.nationalAverage
      }));
  }, [periods]);

  // Determine if this is a star rating metric
  const isStarRating = useMemo(() => {
    if (measureSource === 'Ratings') return true;
    const STAR_RATING_COLUMNS = [
      "overall", "survey", "qm", "qm long", "qm short", "staffing"
    ];
    return STAR_RATING_COLUMNS.includes(measureName?.toLowerCase());
  }, [measureName, measureSource]);

  // Format Y-axis values
  const formatYAxisValue = (value) => {
    if (isStarRating) {
      return Math.round(value);
    }
    return value.toFixed(1);
  };

  // Format tooltip values
  const formatTooltipValue = (value, name) => {
    if (value === null || value === undefined) return '—';
    if (isStarRating) {
      return Math.round(value);
    }
    return Number(value).toFixed(2);
  };

  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    const allValues = [
      ...chartData.map(d => d.value).filter(v => v != null),
      ...chartData.map(d => d.nationalAverage).filter(v => v != null)
    ];

    if (allValues.length === 0) return [0, 100];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 1;

    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className={styles.emptyChart}>
        <p>No trend data available for this metric.</p>
      </div>
    );
  }

  // Determine note text based on direction
  const noteText = useMemo(() => {
    if (measureSource === 'Ratings') {
      return 'Higher scores indicate better performance.';
    }
    if (measureDirection === 'Higher') {
      return 'Higher scores indicate better performance.';
    }
    return 'Lower scores indicate better performance.';
  }, [measureSource, measureDirection]);

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{measureLabel || measureName || 'Quality Measure'}</h3>
        {measureSource !== 'Ratings' && measureDescription && (
          <p className={styles.chartDescription}>{measureDescription}</p>
        )}
        <div className={styles.chartNotes}>
          <p className={styles.noteText}>
            <strong>Note:</strong> {noteText}
          </p>
          {providerName && (
            <p className={styles.noteText}>
              <strong>Provider:</strong> {sanitizeProviderName(providerName) || providerName || 'N/A'}
            </p>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
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
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={formatYAxisValue}
            domain={yAxisDomain}
            allowDecimals={!isStarRating}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelFormatter={(label) => `Period: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="Provider Value"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="nationalAverage"
            name="National Average"
            stroke="#6B7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#6B7280', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#6B7280', strokeWidth: 2, fill: '#fff' }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

