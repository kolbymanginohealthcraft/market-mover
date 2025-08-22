import React, { useState, useMemo } from 'react';
import styles from './CMSEnrollmentPanel.module.css';
import CMSEnrollmentTrendChart from './CMSEnrollmentTrendChart';
import Spinner from '../../../../components/Buttons/Spinner';

const METRIC_GROUPS = [
  {
    title: 'Summary',
    metrics: [
      { key: 'total_benes', label: 'Total Beneficiaries' },
    ]
  },
  {
    title: 'Coverage Type',
    metrics: [
      { key: 'ma_and_other', label: 'Medicare Advantage & Other' },
      { key: 'original_medicare', label: 'Original Medicare' },
    ]
  },
  {
    title: 'Eligibility',
    metrics: [
      { key: 'aged_total', label: 'Aged (65+)' },
      { key: 'disabled_total', label: 'Disabled' },
      { key: 'dual_total', label: 'Dual Eligible' },
    ]
  },
  {
    title: 'Age Distribution',
    metrics: [
      { key: 'age_65_to_69', label: 'Age 65-69' },
      { key: 'age_70_to_74', label: 'Age 70-74' },
      { key: 'age_75_to_79', label: 'Age 75-79' },
      { key: 'age_80_to_84', label: 'Age 80-84' },
      { key: 'age_85_to_89', label: 'Age 85-89' },
      { key: 'age_90_to_94', label: 'Age 90-94' },
      { key: 'age_gt_94', label: 'Age 95+' },
    ]
  },
  {
    title: 'Gender',
    metrics: [
      { key: 'male_total', label: 'Male' },
      { key: 'female_total', label: 'Female' },
    ]
  },
  {
    title: 'Race & Ethnicity',
    metrics: [
      { key: 'white_total', label: 'White' },
      { key: 'black_total', label: 'Black' },
      { key: 'hispanic_total', label: 'Hispanic' },
      { key: 'api_total', label: 'Asian/Pacific Islander' },
      { key: 'native_indian_total', label: 'Native American' },
      { key: 'other_total', label: 'Other' },
    ]
  },
  {
    title: 'Prescription Drug Coverage',
    metrics: [
      { key: 'prescription_drug_total', label: 'With Drug Coverage' },
      { key: 'prescription_drug_pdp', label: 'PDP Only' },
      { key: 'prescription_drug_mapd', label: 'MAPD' },
    ]
  }
];

export default function CMSEnrollmentPanel({ data, loading, error, latestMonth }) {
  const [selectedMetric, setSelectedMetric] = useState('ma_and_other');

  // Filter to latest month for summary cards
  const latestMonthData = useMemo(() => {
    if (!data || !latestMonth) return [];
    return data.filter(r => r.month === latestMonth);
  }, [data, latestMonth]);

  // Aggregate for summary cards
  const summary = useMemo(() => {
    const agg = {};
    METRIC_GROUPS.forEach(group => {
      group.metrics.forEach(m => { agg[m.key] = 0; });
    });
    latestMonthData.forEach(row => {
      METRIC_GROUPS.forEach(group => {
        group.metrics.forEach(m => { agg[m.key] += row[m.key] || 0; });
      });
    });
    return agg;
  }, [latestMonthData]);

  // Calculate percentages
  const percentages = useMemo(() => {
    const total = summary.total_benes || 0;
    const percs = {};
    METRIC_GROUPS.forEach(group => {
      group.metrics.forEach(m => {
        percs[m.key] = total > 0 ? ((summary[m.key] || 0) / total * 100).toFixed(1) : '0.0';
      });
    });
    return percs;
  }, [summary]);

  // Prepare monthly trend data for the selected metric
  const monthlyTrend = useMemo(() => {
    if (!data) return [];
    // Group by month, aggregate across counties
    const byMonth = {};
    data.forEach(row => {
      if (!row.month) return;
      if (!byMonth[row.month]) {
        byMonth[row.month] = { month: row.month };
        METRIC_GROUPS.forEach(group => {
          group.metrics.forEach(m => { byMonth[row.month][m.key] = 0; });
        });
      }
      METRIC_GROUPS.forEach(group => {
        group.metrics.forEach(m => { byMonth[row.month][m.key] += row[m.key] || 0; });
      });
    });
    // Sort by month ascending
    return Object.values(byMonth).sort((a, b) => {
      const [ay, am] = a.month.split('-').map(Number);
      const [by, bm] = b.month.split('-').map(Number);
      return ay !== by ? ay - by : am - bm;
    });
  }, [data]);

  if (loading) return <div className={styles.panel}><Spinner message="Loading CMS enrollment data..." /></div>;
  if (error) return <div className={styles.panel}>Error: {error}</div>;
  if (!data || !latestMonth) return <div className={styles.panel}><Spinner message="Loading CMS enrollment data..." /></div>;

  return (
    <div className={styles.panel}>
      <div className={styles.twoColumnLayout}>
        {/* Left Column - Scrollable Metrics */}
        <div className={styles.metricsColumn}>
          {METRIC_GROUPS.map(group => (
            <div key={group.title} className={styles.metricGroup}>
              <h4 className={styles.groupTitle}>{group.title}</h4>
              <div className={styles.metricsList}>
                {group.metrics.map(metric => (
                  <div
                    key={metric.key}
                    className={
                      styles.metricItem +
                      (selectedMetric === metric.key ? ' ' + styles.selected : '')
                    }
                    onClick={() => setSelectedMetric(metric.key)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedMetric === metric.key}
                    title={`Show monthly trend for ${metric.label}`}
                  >
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <div className={styles.metricValues}>
                      <span className={styles.metricValue}>
                        {summary[metric.key]?.toLocaleString()}
                      </span>
                      <span className={styles.metricPercentage}>
                        ({percentages[metric.key]}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column - Sticky Chart */}
        <div className={styles.chartColumn}>
          <CMSEnrollmentTrendChart
            data={monthlyTrend}
            metric={selectedMetric}
          />
        </div>
      </div>
    </div>
  );
} 