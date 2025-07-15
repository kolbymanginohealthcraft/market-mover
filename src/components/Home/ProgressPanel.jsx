import styles from './ProgressPanel.module.css';

export default function ProgressPanel({ progressLoading, streaks, progress, roi }) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.sectionSubtitle}>🔥 Your Streak</h3>
      {progressLoading ? (
        <div className={styles.innerBlock}>Loading streak data...</div>
      ) : (
        <div className={styles.innerBlock}>
          {streaks.daily_login?.current || 0}-Day Streak! Keep it going.
        </div>
      )}
    </div>
  );
} 