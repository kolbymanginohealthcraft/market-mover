import React from 'react';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { UserActivitySection } from './components/UserActivitySection';
import { FeatureUsageSection } from './components/FeatureUsageSection';
import { EngagementSection } from './components/EngagementSection';
import { FeedbackSection } from './components/FeedbackSection';
import { SystemHealthSection } from './components/SystemHealthSection';
import { AnalyticsFooter } from './components/AnalyticsFooter';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { useAnalyticsFormatters } from './hooks/useAnalyticsFormatters';
import styles from './AnalyticsDashboard.module.css';

export default function AnalyticsDashboard() {
  const {
    analytics,
    loading,
    error,
    fetchAnalytics
  } = useAnalyticsData();

  const {
    formatNumber,
    getActivityIcon
  } = useAnalyticsFormatters();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AnalyticsHeader onRefresh={fetchAnalytics} />

      <div className={styles.analyticsGrid}>
        <UserActivitySection 
          analytics={analytics}
          formatNumber={formatNumber}
          getActivityIcon={getActivityIcon}
        />

        <FeatureUsageSection 
          analytics={analytics}
          formatNumber={formatNumber}
        />

        <EngagementSection 
          analytics={analytics}
          formatNumber={formatNumber}
        />

        <FeedbackSection 
          analytics={analytics}
          formatNumber={formatNumber}
        />

        <SystemHealthSection 
          analytics={analytics}
          formatNumber={formatNumber}
        />
      </div>

      <AnalyticsFooter />
    </div>
  );
} 