import React from 'react';
import styles from './AdminHeader.module.css';

export const AdminHeader = () => {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <p className={styles.subtitle}>
        Manage your team, colors, and subscription settings
      </p>
    </div>
  );
}; 