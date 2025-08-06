import React from 'react';
import styles from './CMSEnrollmentHeader.module.css';

export const CMSEnrollmentHeader = ({ summaryStats, latestMonth }) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <h1>CMS Medicare Enrollment</h1>
          <p>Comprehensive Medicare enrollment data from the Centers for Medicare & Medicaid Services</p>
        </div>
        <div className={styles.headerStats}>
          {summaryStats && (
            <>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{summaryStats.totalBenes.toLocaleString()}</span>
                <span className={styles.statLabel}>Total Beneficiaries</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{summaryStats.maPercentage}%</span>
                <span className={styles.statLabel}>Medicare Advantage</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{summaryStats.dualPercentage}%</span>
                <span className={styles.statLabel}>Dual Eligible</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 