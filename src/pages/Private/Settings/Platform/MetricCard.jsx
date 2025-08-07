import React from 'react';
import styles from './MetricCard.module.css';

export const MetricCard = ({ value, label }) => {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricValue}>
        {value}
      </div>
      <div className={styles.metricLabel}>
        {label}
      </div>
    </div>
  );
}; 