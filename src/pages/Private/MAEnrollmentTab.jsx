import styles from "./MAEnrollmentTab.module.css";

export default function MAEnrollmentTab({ provider }) {
  return (
    <div className={styles.container}>
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