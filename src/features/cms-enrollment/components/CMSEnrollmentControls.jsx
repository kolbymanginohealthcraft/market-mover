import React from 'react';
import ButtonGroup from '../../../components/Buttons/ButtonGroup';
import styles from './CMSEnrollmentControls.module.css';

export const CMSEnrollmentControls = ({
  selectedView,
  setSelectedView,
  selectedBenchmark,
  setSelectedBenchmark,
  showBenchmarkDropdown,
  setShowBenchmarkDropdown,
  selectedTimeframe,
  setSelectedTimeframe,
  selectedMetric,
  setSelectedMetric,
  buildBenchmarkOptions,
  getSelectedBenchmarkDisplay,
  benchmarkError
}) => {
  return (
    <div className={styles.controls}>
      <div className={styles.viewControls}>
        <ButtonGroup
          options={[
            { label: 'Overview', value: 'overview' },
            { label: 'Trends', value: 'trends' },
            { label: 'Demographics', value: 'demographics' },
            { label: 'Payers', value: 'payers' }
          ]}
          selected={selectedView}
          onSelect={setSelectedView}
          size="md"
          variant="blue"
        />
      </div>
      
      <div className={styles.benchmarkControls}>
        <div className={styles.benchmarkDropdown}>
          <label>Benchmark:</label>
          <div className={styles.dropdownContainer}>
            <button 
              className={styles.dropdownButton}
              onClick={() => setShowBenchmarkDropdown(!showBenchmarkDropdown)}
            >
              {getSelectedBenchmarkDisplay()} ▼
            </button>
            {showBenchmarkDropdown && (
              <div className={styles.dropdown}>
                {buildBenchmarkOptions().map(option => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownItem} ${selectedBenchmark === option.value ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedBenchmark(option.value);
                      setShowBenchmarkDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {benchmarkError && (
          <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
            Benchmark Error: {benchmarkError}
          </div>
        )}
      </div>
      
      {selectedView === 'trends' && (
        <div className={styles.trendControls}>
          <div className={styles.controlGroup}>
            <label>Metric:</label>
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className={styles.select}
            >
              <option value="ma_and_other">Medicare Advantage & Other</option>
              <option value="original_medicare">Original Medicare</option>
              <option value="dual_total">Dual Eligible</option>
              <option value="aged_total">Aged (65+)</option>
              <option value="disabled_total">Disabled</option>
              <option value="prescription_drug_total">With Drug Coverage</option>
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Timeframe:</label>
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className={styles.select}
            >
              <option value="latest">Latest Month</option>
              <option value="monthly">Monthly Trends</option>
              <option value="yearly">Yearly Trends</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}; 