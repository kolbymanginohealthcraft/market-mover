import React from 'react';
import { BenchmarkDropdown } from './BenchmarkDropdown';
import { MetricCard } from './MetricCard';
import styles from './CensusMetrics.module.css';

export const CensusMetrics = ({ 
  marketTotals, 
  currentBenchmark, 
  selectedBenchmark, 
  setSelectedBenchmark, 
  benchmarkOptions,
  formatCurrency,
  formatPercent 
}) => {
  const renderBenchmarkAverage = (value, formatter = formatCurrency) => {
    if (!value) return null;
    
    return (
      <span 
        key={`${selectedBenchmark}-${value}`} 
        className={styles.benchmarkAverage}
      >
        {formatter(value)}
      </span>
    );
  };

  return (
    <>
      {/* Benchmark Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Benchmark Comparison</h3>
        <div className={styles.benchmarkControls}>
          <div className={styles.benchmarkRow}>
            <label>Compare to:</label>
            <BenchmarkDropdown 
              selectedBenchmark={selectedBenchmark}
              setSelectedBenchmark={setSelectedBenchmark}
              options={benchmarkOptions}
            />
          </div>
        </div>
      </div>

      {/* Economic Indicators */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Economic Profile</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            label="Median Income"
            value={marketTotals.median_income}
            formatter={formatCurrency}
            benchmark={currentBenchmark?.median_income}
            benchmarkFormatter={formatCurrency}
          />
          
          <MetricCard
            label="Per Capita Income"
            value={marketTotals.per_capita_income}
            formatter={formatCurrency}
            benchmark={currentBenchmark?.per_capita_income}
            benchmarkFormatter={formatCurrency}
          />
          
          <MetricCard
            label="Poverty Rate"
            value={marketTotals.poverty_rate}
            formatter={formatPercent}
            benchmark={currentBenchmark?.poverty_rate}
            benchmarkFormatter={formatPercent}
          />
        </div>
      </div>

      {/* Housing & Cost of Living */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Housing & Cost of Living</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            label="Median Home Value"
            value={marketTotals.median_home_value}
            formatter={formatCurrency}
            benchmark={currentBenchmark?.median_home_value}
            benchmarkFormatter={formatCurrency}
          />
          
          <MetricCard
            label="Median Rent"
            value={marketTotals.median_rent}
            formatter={formatCurrency}
            benchmark={currentBenchmark?.median_rent}
            benchmarkFormatter={formatCurrency}
          />
          
          <MetricCard
            label="Homeownership Rate"
            value={marketTotals.homeownership_rate}
            formatter={formatPercent}
            benchmark={currentBenchmark?.homeownership_rate}
            benchmarkFormatter={formatPercent}
          />
        </div>
      </div>

      {/* Health & Disability */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Health & Disability</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            label="Uninsured Rate"
            value={marketTotals.uninsured_rate}
            formatter={formatPercent}
            benchmark={currentBenchmark?.uninsured_rate}
            benchmarkFormatter={formatPercent}
          />
          
          <MetricCard
            label="Disability Rate"
            value={marketTotals.disability_rate}
            formatter={formatPercent}
            benchmark={currentBenchmark?.disability_rate}
            benchmarkFormatter={formatPercent}
          />
        </div>
      </div>

      {/* Education */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Education</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            label="Bachelor's+ Rate"
            value={marketTotals.bachelors_plus_rate}
            formatter={formatPercent}
            benchmark={currentBenchmark?.bachelors_plus_rate}
            benchmarkFormatter={formatPercent}
          />
        </div>
      </div>
    </>
  );
}; 