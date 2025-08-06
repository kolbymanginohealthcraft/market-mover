import React from 'react';
import styles from './FeedbackCard.module.css';

export const FeedbackCard = ({ title, stats }) => {
  return (
    <div className={styles.feedbackCard}>
      <h3>{title}</h3>
      <div className={styles.feedbackStats}>
        <div className={styles.feedbackStat}>
          <span className={styles.statValue}>
            {stats?.total || 0}
          </span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.feedbackStat}>
          <span className={styles.statValue}>
            {stats?.pending || 0}
          </span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <div className={styles.feedbackStat}>
          <span className={styles.statValue}>
            {stats?.approved || 0}
          </span>
          <span className={styles.statLabel}>Approved</span>
        </div>
      </div>
    </div>
  );
}; 