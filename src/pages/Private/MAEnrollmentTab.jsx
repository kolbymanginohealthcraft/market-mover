import React, { useState } from 'react';
import styles from "./MAEnrollmentTab.module.css";
import Banner from "../../components/Banner";

export default function MAEnrollmentTab({ provider }) {
  const [showBanner, setShowBanner] = useState(true);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <div className={styles.container}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      <Banner
        title="Medicare Advantage Enrollment Analysis"
        message="This section will explore the critical transition from traditional Medicare to Medicare Advantage as it becomes more prevalent year over year. As we continue developing, you'll see comprehensive trends in CMS enrollment statistics, MA penetration rates compared to national averages, predictive enrollment modeling, and deep market dynamics analysis that will help you understand and plan for the evolving healthcare landscape toward managed care models."
        icon="📊"
        onClose={handleCloseBanner}
      />

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