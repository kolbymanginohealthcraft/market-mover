import React from 'react';
import { formatMetricValue, getMetricLabel, COLOR_SCHEMES } from '../../utils/demographicColors';
import styles from './DemographicLegend.module.css';

/**
 * DemographicLegend Component
 * Displays a color scale legend for demographic choropleth maps
 * 
 * @param {string} metric - The metric being displayed
 * @param {object} statistics - Statistics object with min, max, median, mean, breaks
 * @param {boolean} compact - Whether to show compact version
 */
export default function DemographicLegend({ metric, statistics, compact = false }) {
  if (!statistics || !statistics.breaks || statistics.breaks.length === 0) {
    return null;
  }

  const scheme = COLOR_SCHEMES[metric] || COLOR_SCHEMES.median_income;
  const { breaks, min, max, median, mean } = statistics;

  // Create legend items from breaks
  const legendItems = [];
  for (let i = 0; i < scheme.colors.length && i < breaks.length - 1; i++) {
    legendItems.push({
      color: scheme.colors[i],
      minValue: breaks[i],
      maxValue: breaks[i + 1],
      label: i === 0 ? 'Lowest' : i === scheme.colors.length - 1 ? 'Highest' : ''
    });
  }

  if (compact) {
    return (
      <div className={styles.legendCompact}>
        <div className={styles.legendTitle}>{getMetricLabel(metric)}</div>
        <div className={styles.legendGradient}>
          {scheme.colors.map((color, index) => (
            <div
              key={index}
              className={styles.gradientSegment}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className={styles.legendLabels}>
          <span>{formatMetricValue(min, metric)}</span>
          <span>{formatMetricValue(max, metric)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.legend}>
      <div className={styles.legendHeader}>
        <h4 className={styles.legendTitle}>{getMetricLabel(metric)}</h4>
      </div>
      
      <div className={styles.legendBody}>
        {legendItems.map((item, index) => (
          <div key={index} className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: item.color }}
            />
            <div className={styles.legendRange}>
              {formatMetricValue(item.minValue, metric)} - {formatMetricValue(item.maxValue, metric)}
            </div>
          </div>
        ))}
        
        <div className={styles.legendItem}>
          <div
            className={styles.legendColor}
            style={{ backgroundColor: scheme.noDataColor }}
          />
          <div className={styles.legendRange}>No data</div>
        </div>
      </div>

      <div className={styles.legendStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Median:</span>
          <span className={styles.statValue}>{formatMetricValue(median, metric)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Mean:</span>
          <span className={styles.statValue}>{formatMetricValue(mean, metric)}</span>
        </div>
      </div>
    </div>
  );
}

