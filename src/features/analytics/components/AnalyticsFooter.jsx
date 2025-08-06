import React from 'react';
import styles from './AnalyticsFooter.module.css';

export const AnalyticsFooter = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.note}>
        <h3>📊 Technical Metrics</h3>
        <p>
          For detailed technical analytics including login trends, session duration, 
          database performance, and API usage, visit the{' '}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
            Supabase Dashboard
          </a>
          .
        </p>
      </div>
    </div>
  );
}; 