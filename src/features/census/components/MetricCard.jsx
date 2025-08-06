import React from 'react';
import styles from './MetricCard.module.css';

export const MetricCard = ({ 
  label, 
  value, 
  formatter, 
  benchmark, 
  benchmarkFormatter 
}) => {
  const renderBenchmarkAverage = () => {
    if (!benchmark) return null;
    
    return (
      <span className={styles.nationalAverage}>
        {benchmarkFormatter(benchmark)}
      </span>
    );
  };

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>{label}</span>
        {renderBenchmarkAverage()}
      </div>
      <div className={styles.metricValue}>
        {formatter(value)}
      </div>
    </div>
  );
}; 