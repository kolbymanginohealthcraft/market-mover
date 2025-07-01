import styles from "./SafetyTab.module.css";

export default function SafetyTab({ provider }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🛡️</div>
        <h2>Safety</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Safety metrics and quality indicators will be available here.
        </p>
      </div>
    </div>
  );
} 