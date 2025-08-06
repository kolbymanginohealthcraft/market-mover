import React from 'react';
import { MetricCard } from './MetricCard';
import styles from './EngagementSection.module.css';

export const EngagementSection = ({ analytics, formatNumber }) => {
  return (
    <div className={styles.section}>
      <h2>🎯 User Engagement</h2>
      <div className={styles.engagementGrid}>
        <MetricCard
          value={analytics.engagement.activeUsers || 0}
          label="Active Users"
        />
        <MetricCard
          value={analytics.engagement.averageStreak || 0}
          label="Average Streak"
        />
        <MetricCard
          value={analytics.engagement.topStreak || 0}
          label="Longest Streak"
        />
      </div>
    </div>
  );
}; 