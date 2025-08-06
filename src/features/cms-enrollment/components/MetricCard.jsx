import React from 'react';
import styles from './MetricCard.module.css';

export const MetricCard = ({ title, metrics }) => {
  return (
    <div className={styles.metricCard}>
      <h3>{title}</h3>
      <div className={styles.metricGroup}>
        {metrics.map((metric, index) => (
          <div key={index} className={styles.metricItem}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>{metric.label}</span>
              {metric.benchmark && metric.benchmarkFormatter && (
                <span className={styles.benchmarkAverage}>
                  {metric.benchmarkFormatter(metric.benchmark)}
                </span>
              )}
            </div>
            <span className={styles.value}>{metric.value}</span>
            <span className={styles.percentage}>({metric.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 