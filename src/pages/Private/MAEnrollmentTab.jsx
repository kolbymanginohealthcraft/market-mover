import React, { useState } from 'react';
import styles from "./MAEnrollmentTab.module.css";

export default function MAEnrollmentTab({ provider }) {
  const [showBanner, setShowBanner] = useState(true);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <div className={styles.container}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      {showBanner && (
        <div className={styles.comingSoonBanner}>
          <button className={styles.closeButton} onClick={handleCloseBanner}>
            ×
          </button>
          <div className={styles.bannerIcon}>📊</div>
          <div className={styles.bannerContent}>
            <h3>Medicare Advantage Enrollment Analysis</h3>
            <p>
              This section will explore the critical transition from traditional Medicare to Medicare Advantage as it becomes more prevalent year over year. As we continue developing, you'll see comprehensive trends in CMS enrollment statistics, MA penetration rates compared to national averages, predictive enrollment modeling, and deep market dynamics analysis that will help you understand and plan for the evolving healthcare landscape toward managed care models.
            </p>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.icon}>📋</div>
        <h2>MA Enrollment</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Medicare Advantage enrollment data and trends will be available here.
        </p>
      </div>
    </div>
  );
} 