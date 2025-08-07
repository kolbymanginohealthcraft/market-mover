import React from 'react';
import styles from './FeatureCard.module.css';

export const FeatureCard = ({ feature, percentage }) => {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureHeader}>
        <span className={styles.featureName}>
          {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        <span className={styles.featurePercentage}>{percentage}%</span>
      </div>
      <div className={styles.featureBar}>
        <div 
          className={styles.featureBarFill} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}; 