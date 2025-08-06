import React from 'react';
import styles from './ActivityList.module.css';

export const ActivityList = ({ activities, getActivityIcon }) => {
  return (
    <div className={styles.activityBreakdown}>
      <h3>Top Activities</h3>
      <div className={styles.activityList}>
        {activities.map(([activity, count]) => (
          <div key={activity} className={styles.activityItem}>
            <span className={styles.activityIcon}>
              {getActivityIcon(activity)}
            </span>
            <span className={styles.activityName}>
              {activity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className={styles.activityCount}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 