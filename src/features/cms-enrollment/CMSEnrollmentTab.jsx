import React, { useState } from 'react';
import { CMSEnrollmentHeader } from './components/CMSEnrollmentHeader';
import { CMSEnrollmentControls } from './components/CMSEnrollmentControls';
import { CMSEnrollmentOverview } from './components/CMSEnrollmentOverview';
import { CMSEnrollmentTrends } from './components/CMSEnrollmentTrends';
import { CMSEnrollmentDemographics } from './components/CMSEnrollmentDemographics';
import { CMSEnrollmentPayers } from './components/CMSEnrollmentPayers';
import { CMSEnrollmentInfo } from './components/CMSEnrollmentInfo';
import { useCMSEnrollmentData } from './hooks/useCMSEnrollmentData';
import { useCMSEnrollmentBenchmarks } from './hooks/useCMSEnrollmentBenchmarks';
import { useCMSEnrollmentViews } from './hooks/useCMSEnrollmentViews';
import styles from './CMSEnrollmentTab.module.css';

export default function CMSEnrollmentTab({ provider, radiusInMiles }) {
  // Custom hooks for different concerns
  const {
    data,
    loading,
    error,
    latestMonth,
    months,
    summaryStats,
    demographicData
  } = useCMSEnrollmentData(provider, radiusInMiles);

  const {
    selectedBenchmark,
    setSelectedBenchmark,
    showBenchmarkDropdown,
    setShowBenchmarkDropdown,
    benchmarkData,
    benchmarkError,
    getCurrentBenchmark,
    getBenchmarkValue,
    renderBenchmarkAverage,
    buildBenchmarkOptions,
    getSelectedBenchmarkDisplay
  } = useCMSEnrollmentBenchmarks(data);

  const {
    selectedView,
    setSelectedView,
    selectedTimeframe,
    setSelectedTimeframe,
    selectedMetric,
    setSelectedMetric
  } = useCMSEnrollmentViews();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading CMS enrollment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CMSEnrollmentHeader 
        summaryStats={summaryStats}
        latestMonth={latestMonth}
      />

      <CMSEnrollmentControls 
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        selectedBenchmark={selectedBenchmark}
        setSelectedBenchmark={setSelectedBenchmark}
        showBenchmarkDropdown={showBenchmarkDropdown}
        setShowBenchmarkDropdown={setShowBenchmarkDropdown}
        selectedTimeframe={selectedTimeframe}
        setSelectedTimeframe={setSelectedTimeframe}
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
        buildBenchmarkOptions={buildBenchmarkOptions}
        getSelectedBenchmarkDisplay={getSelectedBenchmarkDisplay}
        benchmarkError={benchmarkError}
      />

      <div className={styles.content}>
        {selectedView === 'overview' && (
          <CMSEnrollmentOverview 
            summaryStats={summaryStats}
            demographicData={demographicData}
            getCurrentBenchmark={getCurrentBenchmark}
            getBenchmarkValue={getBenchmarkValue}
            renderBenchmarkAverage={renderBenchmarkAverage}
          />
        )}

        {selectedView === 'trends' && (
          <CMSEnrollmentTrends 
            data={data}
            months={months}
            selectedMetric={selectedMetric}
            selectedTimeframe={selectedTimeframe}
          />
        )}

        {selectedView === 'demographics' && (
          <CMSEnrollmentDemographics 
            demographicData={demographicData}
            summaryStats={summaryStats}
          />
        )}

        {selectedView === 'payers' && (
          <CMSEnrollmentPayers />
        )}
      </div>

      <CMSEnrollmentInfo 
        latestMonth={latestMonth}
      />
    </div>
  );
} 