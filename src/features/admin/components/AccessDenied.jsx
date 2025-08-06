import React from 'react';
import Button from '../../../components/Buttons/Button';
import styles from './AccessDenied.module.css';

export const AccessDenied = ({ onNavigate }) => {
  return (
    <div className={styles.page}>
      <div className={styles.accessDenied}>
        <h1>🔒 Access Denied</h1>
        <p>You need team admin privileges to access this dashboard.</p>
        <Button variant="blue" onClick={onNavigate}>
          Go to User Settings
        </Button>
      </div>
    </div>
  );
}; 