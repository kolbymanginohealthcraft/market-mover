import styles from './WelcomePanel.module.css';

export default function WelcomePanel({ userFirstName, progressLoading, streaks, quote, greetingText }) {
  return (
    <div className={styles.welcomePanel}>
      <div className={styles.welcomeContent}>
        <div className={styles.welcomeText}>
          <h1 className={styles.greeting}>
            {greetingText}
          </h1>
          <p className={styles.subtext}>{quote}</p>
        </div>
        
        <div className={styles.streakCard}>
          {progressLoading ? (
            <div className={styles.streakLoading}>Loading...</div>
          ) : (
            <>
              <div className={styles.streakIcon}>🔥</div>
              <div className={styles.streakInfo}>
                <div className={styles.streakDays}>{streaks.daily_login?.current || 0}</div>
                <div className={styles.streakLabel}>Day Streak</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 