import React from 'react';
import Button from '../../../components/Buttons/Button';
import styles from './AnalyticsHeader.module.css';

export const AnalyticsHeader = ({ onRefresh }) => {
  return (
    <div className={styles.header}>
      <h1>📊 Analytics Dashboard</h1>
      <p className={styles.subtitle}>
        Platform usage insights and user engagement metrics
      </p>
      <div className={styles.actions}>
        <Button onClick={onRefresh} variant="accent" size="sm">
          🔄 Refresh Data
        </Button>
        <Button variant="blue" size="sm">
          📈 View Supabase Analytics
        </Button>
      </div>
    </div>
  );
}; 