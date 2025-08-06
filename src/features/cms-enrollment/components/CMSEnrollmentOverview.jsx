import React from 'react';
import { MetricCard } from './MetricCard';
import styles from './CMSEnrollmentOverview.module.css';

export const CMSEnrollmentOverview = ({
  summaryStats,
  demographicData,
  getCurrentBenchmark,
  getBenchmarkValue,
  renderBenchmarkAverage
}) => {
  if (!summaryStats) return null;

  return (
    <div className={styles.overviewSection}>
      <div className={styles.metricsGrid}>
        <MetricCard
          title="Coverage Type"
          metrics={[
            {
              label: 'Medicare Advantage & Other',
              value: summaryStats.maOther.toLocaleString(),
              percentage: summaryStats.maPercentage,
              benchmark: getBenchmarkValue('maPercentage'),
              benchmarkFormatter: renderBenchmarkAverage
            },
            {
              label: 'Original Medicare',
              value: summaryStats.originalMedicare.toLocaleString(),
              percentage: summaryStats.originalMedicare > 0 && summaryStats.totalBenes > 0 
                ? ((summaryStats.originalMedicare / summaryStats.totalBenes) * 100).toFixed(1) 
                : 0,
              benchmark: getBenchmarkValue('originalMedicarePercentage'),
              benchmarkFormatter: renderBenchmarkAverage
            }
          ]}
        />

        <MetricCard
          title="Eligibility"
          metrics={[
            {
              label: 'Aged (65+)',
              value: demographicData ? Object.values(demographicData.ageGroups).reduce((sum, count) => sum + count, 0).toLocaleString() : '0',
              percentage: summaryStats.totalBenes > 0 
                ? ((Object.values(demographicData?.ageGroups || {}).reduce((sum, count) => sum + count, 0) / summaryStats.totalBenes) * 100).toFixed(1) 
                : 0,
              benchmark: getBenchmarkValue('agedPercentage'),
              benchmarkFormatter: renderBenchmarkAverage
            },
            {
              label: 'Disabled',
              value: 'N/A', // This would need to be calculated from the data
              percentage: 'N/A',
              benchmark: getBenchmarkValue('disabledPercentage'),
              benchmarkFormatter: renderBenchmarkAverage
            }
          ]}
        />

        <MetricCard
          title="Dual Eligibility"
          metrics={[
            {
              label: 'Dual Eligible',
              value: summaryStats.dualTotal.toLocaleString(),
              percentage: summaryStats.dualPercentage,
              benchmark: getBenchmarkValue('dualPercentage'),
              benchmarkFormatter: renderBenchmarkAverage
            }
          ]}
        />
      </div>
    </div>
  );
}; 