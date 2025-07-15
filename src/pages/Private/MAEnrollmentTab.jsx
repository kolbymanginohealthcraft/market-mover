import React from 'react';
import styles from "./MAEnrollmentTab.module.css";
import MAEnrollmentPanel from "../../components/MAEnrollmentPanel";
import useMAEnrollmentData from "../../hooks/useMAEnrollmentData";

export default function MAEnrollmentTab({ provider, radiusInMiles }) {
  // Use the latest available publish date for Dallas area
  const publishDate = '2025-03-01';
  const { data, loading, error } = useMAEnrollmentData(provider, radiusInMiles, publishDate);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>MA Enrollment</h2>
          <p>Medicare Advantage enrollment data for {publishDate}</p>
        </div>
        
        <MAEnrollmentPanel 
          data={data} 
          loading={loading} 
          error={error}
        />
      </div>
    </div>
  );
} 