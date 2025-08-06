import React, { useMemo } from 'react';
import { DemographicsSection } from './DemographicsSection';
import styles from './CensusDemographics.module.css';

export const CensusDemographics = ({ marketTotals, formatNumber }) => {
  // Age group data - ordered by age
  const agePieData = useMemo(() => [
    { name: 'Under 18', value: marketTotals.population_under_18 || 0 },
    { name: '18-64', value: Math.max(0, (marketTotals.total_population || 0) - (marketTotals.population_65_plus || 0) - (marketTotals.population_under_18 || 0)) },
    { name: '65+', value: marketTotals.population_65_plus || 0 },
  ], [marketTotals]);

  const agePieColors = ['#8884d8', '#82ca9d', '#ffc658'];

  // Race/ethnicity data - ordered by count descending
  const racePieData = useMemo(() => [
    { name: 'White', value: marketTotals.white || 0 },
    { name: 'Black', value: marketTotals.black || 0 },
    { name: 'Asian', value: marketTotals.asian || 0 },
    { name: 'Hispanic/Latino', value: marketTotals.hispanic || 0 },
    { name: 'Some Other Race', value: marketTotals.some_other_race || 0 },
    { name: 'Two or More Races', value: marketTotals.two_or_more || 0 },
    { name: 'Native American', value: marketTotals.native_american || 0 },
    { name: 'Pacific Islander', value: marketTotals.pacific_islander || 0 },
  ].sort((a, b) => b.value - a.value), [marketTotals]);

  const racePieColors = ['#ff6b6b', '#4ecdc4', '#b8860b', '#45b7d1', '#feca57', '#a569bd', '#34495e', '#96ceb4'];

  return (
    <>
      {/* Age Distribution */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Age Distribution</h3>
        <DemographicsSection 
          data={agePieData}
          colors={agePieColors}
          totalPopulation={marketTotals.total_population}
          formatNumber={formatNumber}
        />
      </div>
      
      {/* Race & Ethnicity Distribution */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Race & Ethnicity</h3>
        <DemographicsSection 
          data={racePieData}
          colors={racePieColors}
          totalPopulation={marketTotals.total_population}
          formatNumber={formatNumber}
        />
      </div>
    </>
  );
}; 