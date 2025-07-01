import styles from "./StaffingTab.module.css";

export default function StaffingTab({ provider }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>👥</div>
        <h2>Staffing</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Staffing metrics and workforce analytics will be available here.
        </p>
      </div>
    </div>
  );
} 