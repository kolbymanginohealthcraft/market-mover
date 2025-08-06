import { useState } from 'react';
import styles from './ModeSelector.module.css';

export default function ModeSelector({ currentMode, onModeChange }) {
  return (
    <div className={styles.modeSelector}>
      <div className={styles.modeContainer}>
        <button
          className={`${styles.modeButton} ${currentMode === 'provider' ? styles.active : ''}`}
          onClick={() => onModeChange('provider')}
        >
          <div className={styles.modeIcon}>🏥</div>
          <div className={styles.modeContent}>
            <div className={styles.modeTitle}>Provider Mode</div>
            <div className={styles.modeDescription}>
              Find providers and analyze their markets
            </div>
          </div>
        </button>
        
        <button
          className={`${styles.modeButton} ${currentMode === 'supplier' ? styles.active : ''}`}
          onClick={() => onModeChange('supplier')}
        >
          <div className={styles.modeIcon}>🔍</div>
          <div className={styles.modeContent}>
            <div className={styles.modeTitle}>Supplier Mode</div>
            <div className={styles.modeDescription}>
              Find all providers who deliver services
            </div>
          </div>
        </button>
      </div>
    </div>
  );
} 