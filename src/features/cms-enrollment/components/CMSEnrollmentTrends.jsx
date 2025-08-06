import React from 'react';
import CMSEnrollmentTrendChart from '../../../components/CMSEnrollmentTrendChart';
import styles from './CMSEnrollmentTrends.module.css';

export const CMSEnrollmentTrends = ({
  data,
  months,
  selectedMetric,
  selectedTimeframe
}) => {
  return (
    <div className={styles.trendsSection}>
      <div className={styles.trendsHeader}>
        <h2>Enrollment Trends</h2>
        <p>Track enrollment changes over time for {selectedMetric.replace(/_/g, ' ')}</p>
      </div>
      
      <div className={styles.trendsContent}>
        <CMSEnrollmentTrendChart
          data={data}
          months={months}
          metric={selectedMetric}
          timeframe={selectedTimeframe}
        />
      </div>
    </div>
  );
}; 