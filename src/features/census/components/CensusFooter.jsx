import React from 'react';
import styles from './CensusFooter.module.css';

export const CensusFooter = ({ marketTotals, radiusInMiles, provider }) => {
  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <p className={styles.source}>
          Source: U.S. Census Bureau American Community Survey ({marketTotals.acs_year} 5-Year Estimates)
        </p>
        <p className={styles.note}>
          Data represents census tract-level demographics within {radiusInMiles} miles of {provider.name}
        </p>
      </div>
    </div>
  );
}; 