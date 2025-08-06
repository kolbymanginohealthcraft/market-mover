import React from 'react';
import { MetricCard } from './MetricCard';
import { ActivityList } from './ActivityList';
import styles from './UserActivitySection.module.css';

export const UserActivitySection = ({ analytics, formatNumber, getActivityIcon }) => {
  return (
    <div className={styles.section}>
      <h2>👥 User Activity (Last 30 Days)</h2>
      <div className={styles.metricsGrid}>
        <MetricCard
          value={formatNumber(analytics.userActivity.totalActivities || 0)}
          label="Total Activities"
        />
        <MetricCard
          value={formatNumber(analytics.featureUsage.totalActiveUsers || 0)}
          label="Active Users"
        />
        <MetricCard
          value={analytics.engagement.averageStreak || 0}
          label="Avg. Streak"
        />
      </div>

      {analytics.userActivity.topActivities?.length > 0 && (
        <ActivityList 
          activities={analytics.userActivity.topActivities}
          getActivityIcon={getActivityIcon}
        />
      )}
    </div>
  );
}; 