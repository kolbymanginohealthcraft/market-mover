import React from 'react';
import { FeatureCard } from './FeatureCard';
import styles from './FeatureUsageSection.module.css';

export const FeatureUsageSection = ({ analytics, formatNumber }) => {
  return (
    <div className={styles.section}>
      <h2>🔧 Feature Usage</h2>
      <div className={styles.featureUsage}>
        {analytics.featureUsage.topFeatures?.map(([feature, data]) => (
          <FeatureCard
            key={feature}
            feature={feature}
            percentage={data.percentage}
          />
        ))}
      </div>
    </div>
  );
}; 