import React from 'react';
import styles from './CensusHeader.module.css';

export const CensusHeader = ({ marketTotals, formatNumber, radiusInMiles, provider }) => {
  // Calculate population density
  const landAreaSquareMiles = marketTotals.total_land_area_meters ? 
    marketTotals.total_land_area_meters / 2589988.11 : 0;
  const density = landAreaSquareMiles > 0 ? marketTotals.total_population / landAreaSquareMiles : 0;
  const populationDensity = density ? `${Math.round(density).toLocaleString()}/mi²` : 'N/A';

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <h2>Market Demographics</h2>
        <p className={styles.subtitle}>
          {marketTotals.total_tracts} census tracts • Census tracts are small, permanent statistical subdivisions of counties averaging 4,000 residents
        </p>
      </div>

      <div className={styles.headerStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatNumber(marketTotals.total_population)}</div>
          <div className={styles.statLabel}>Total Population</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatNumber(marketTotals.population_65_plus || 0)}</div>
          <div className={styles.statLabel}>
            65+ Population ({(marketTotals.population_65_plus / marketTotals.total_population * 100).toFixed(1)}%)
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{populationDensity}</div>
          <div className={styles.statLabel}>Population Density</div>
        </div>
      </div>
    </div>
  );
}; 