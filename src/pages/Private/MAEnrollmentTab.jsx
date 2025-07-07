import styles from "./MAEnrollmentTab.module.css";

export default function MAEnrollmentTab({ provider }) {
  return (
    <div className={styles.container}>
      {/* Temporary Banner - MA Enrollment Analysis */}
      <div className={styles.comingSoonBanner}>
        <div className={styles.bannerIcon}>📊</div>
        <div className={styles.bannerContent}>
          <h3>Medicare Advantage Enrollment Analysis</h3>
          <p>
            This section will explore the important transition from traditional Medicare to Medicare Advantage as it becomes more prevalent year over year. We will show trends in CMS enrollment statistics and track MA penetration rates compared to national averages in your market. This analysis will help you understand enrollment patterns and market dynamics as the healthcare landscape continues to evolve toward managed care models.
          </p>
        </div>
      </div>

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