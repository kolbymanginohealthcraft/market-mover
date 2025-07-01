import styles from "./ProceduresTab.module.css";

export default function ProceduresTab({ provider }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🔧</div>
        <h2>Procedures</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Procedure volume and performance metrics will be available here.
        </p>
      </div>
    </div>
  );
} 