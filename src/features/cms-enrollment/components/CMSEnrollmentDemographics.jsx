import React from 'react';
import styles from './CMSEnrollmentDemographics.module.css';

export const CMSEnrollmentDemographics = ({
  demographicData,
  summaryStats
}) => {
  if (!demographicData || !summaryStats) return null;

  return (
    <div className={styles.demographicsSection}>
      <div className={styles.demographicsHeader}>
        <h2>Demographic Breakdown</h2>
        <p>Detailed demographic analysis of Medicare beneficiaries</p>
      </div>

      <div className={styles.demographicsGrid}>
        <div className={styles.demographicCard}>
          <h3>Age Distribution</h3>
          <div className={styles.ageChart}>
            {Object.entries(demographicData.ageGroups).map(([ageGroup, count]) => {
              const percentage = summaryStats.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
              return (
                <div key={ageGroup} className={styles.ageItem}>
                  <div className={styles.ageLabel}>{ageGroup}</div>
                  <div className={styles.ageBar}>
                    <div 
                      className={styles.ageBarFill} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className={styles.ageValue}>
                    {count.toLocaleString()} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.demographicCard}>
          <h3>Gender Distribution</h3>
          <div className={styles.genderChart}>
            <div className={styles.genderItem}>
              <div className={styles.genderLabel}>Male</div>
              <div className={styles.genderBar}>
                <div 
                  className={styles.genderBarFill} 
                  style={{ 
                    width: `${summaryStats.totalBenes > 0 ? (demographicData.gender.male / summaryStats.totalBenes * 100) : 0}%` 
                  }}
                ></div>
              </div>
              <div className={styles.genderValue}>
                {demographicData.gender.male.toLocaleString()}
              </div>
            </div>
            <div className={styles.genderItem}>
              <div className={styles.genderLabel}>Female</div>
              <div className={styles.genderBar}>
                <div 
                  className={styles.genderBarFill} 
                  style={{ 
                    width: `${summaryStats.totalBenes > 0 ? (demographicData.gender.female / summaryStats.totalBenes * 100) : 0}%` 
                  }}
                ></div>
              </div>
              <div className={styles.genderValue}>
                {demographicData.gender.female.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.demographicCard}>
          <h3>Race & Ethnicity</h3>
          <div className={styles.raceChart}>
            {Object.entries(demographicData.race).map(([race, count]) => {
              const percentage = summaryStats.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
              return (
                <div key={race} className={styles.raceItem}>
                  <div className={styles.raceLabel}>
                    {race.charAt(0).toUpperCase() + race.slice(1)}
                  </div>
                  <div className={styles.raceBar}>
                    <div 
                      className={styles.raceBarFill} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className={styles.raceValue}>
                    {count.toLocaleString()} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}; 