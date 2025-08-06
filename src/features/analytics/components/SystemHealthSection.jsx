import React from 'react';
import { MetricCard } from './MetricCard';
import styles from './SystemHealthSection.module.css';

export const SystemHealthSection = ({ analytics, formatNumber }) => {
  return (
    <div className={styles.section}>
      <h2>⚙️ System Health</h2>
      <div className={styles.systemHealth}>
        <MetricCard
          value={analytics.systemHealth.activeAnnouncements || 0}
          label="Active Announcements"
        />
        <MetricCard
          value={analytics.systemHealth.totalAnnouncements || 0}
          label="Total Announcements"
        />
      </div>
    </div>
  );
}; 