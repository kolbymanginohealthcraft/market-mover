import React from 'react';
import styles from './CMSEnrollmentInfo.module.css';

export const CMSEnrollmentInfo = ({ latestMonth }) => {
  return (
    <div className={styles.info}>
      <h4>About This Data</h4>
      <p>
        This tab provides comprehensive Medicare enrollment data directly from the Centers for Medicare & Medicaid Services (CMS). 
        The data includes detailed demographic breakdowns by county, including age distribution, race/ethnicity, 
        dual eligibility status, and prescription drug coverage.
      </p>
      <div className={styles.dataSource}>
        <strong>Data Source:</strong> CMS Medicare Enrollment Data API<br/>
        <strong>Coverage:</strong> All Medicare beneficiaries by county<br/>
        <strong>Updates:</strong> Annual and monthly data releases<br/>
        <strong>Latest Data:</strong> {latestMonth || 'N/A'}
      </div>
    </div>
  );
}; 