import styles from "./FinancialTab.module.css";

export default function FinancialTab({ provider }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>💰</div>
        <h2>Financial</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Financial performance and revenue metrics will be available here.
        </p>
      </div>
    </div>
  );
} 