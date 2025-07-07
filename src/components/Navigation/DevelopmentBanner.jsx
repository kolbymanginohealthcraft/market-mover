import styles from './DevelopmentBanner.module.css';

export default function DevelopmentBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>🚧</span>
        <span className={styles.text}>
          This app is still in development. Please pardon any messy layouts as final finishing touches are still underway.
        </span>
      </div>
    </div>
  );
} 