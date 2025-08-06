import React from 'react';
import TeamColorManager from '../../../components/TeamColorManager';
import styles from './TeamColorsTab.module.css';

export const TeamColorsTab = () => {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Team Color Palette</h2>
      <TeamColorManager />
    </div>
  );
}; 