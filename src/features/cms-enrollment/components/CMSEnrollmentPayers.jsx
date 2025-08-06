import React from 'react';
import styles from './CMSEnrollmentPayers.module.css';

export const CMSEnrollmentPayers = () => {
  return (
    <div className={styles.payersSection}>
      <div className={styles.emptyState}>
        <h3>Payer Enrollment Data</h3>
        <p>Detailed enrollment breakdowns by payer will be available soon.</p>
        <div className={styles.comingSoon}>
          <span>🚧 Coming Soon</span>
        </div>
      </div>
    </div>
  );
}; 