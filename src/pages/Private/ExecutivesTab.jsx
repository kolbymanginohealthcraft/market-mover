import styles from "./ExecutivesTab.module.css";

export default function ExecutivesTab({ provider }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>👔</div>
        <h2>Executives</h2>
        <p>Coming Soon</p>
        <p className={styles.description}>
          Executive leadership and organizational structure will be available here.
        </p>
      </div>
    </div>
  );
} 