import React, { useState } from 'react';
import styles from "./CMSEnrollmentTab.module.css";
import CMSEnrollmentPanel from "../../components/CMSEnrollmentPanel";
import CMSEnrollmentTrendChart from "../../components/CMSEnrollmentTrendChart";
import useCMSEnrollmentData from "../../hooks/useCMSEnrollmentData";

export default function CMSEnrollmentTab({ provider, radiusInMiles }) {
  // Fetch all months for the most recent year
  const { data, loading, error, latestMonth } = useCMSEnrollmentData(provider, radiusInMiles);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>CMS Medicare Enrollment</h2>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              Experimental enrollment data from CMS
            </span>
          </div>
        </div>
        <CMSEnrollmentPanel 
          data={data} 
          loading={loading} 
          error={error}
          latestMonth={latestMonth}
        />
        <div className={styles.info}>
          <h4>About This Data</h4>
          <p>
            This experimental tab uses Medicare enrollment data directly from the Centers for Medicare & Medicaid Services (CMS). 
            The data includes detailed demographic breakdowns by county, including age distribution, race/ethnicity, 
            dual eligibility status, and prescription drug coverage.
          </p>
          <p>
            <strong>Data Source:</strong> CMS Medicare Enrollment Data API<br/>
            <strong>Coverage:</strong> All Medicare beneficiaries by county<br/>
            <strong>Updates:</strong> Annual and monthly data releases
          </p>
        </div>
      </div>
    </div>
  );
} 