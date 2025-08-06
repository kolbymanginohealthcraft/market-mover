import React from 'react';
import styles from './DemographicsSection.module.css';

export const DemographicsSection = ({ 
  data, 
  colors, 
  totalPopulation, 
  formatNumber 
}) => {
  return (
    <div className={styles.demographicsCard}>
      <div className={styles.demographicsList}>
        {data.map((item, idx) => (
          <div key={item.name} className={styles.demographicsItem}>
            <div className={styles.demographicsBar}>
              <div 
                className={styles.demographicsBarFill} 
                style={{ 
                  width: `${(item.value / totalPopulation) * 100}%`,
                  backgroundColor: colors[idx % colors.length]
                }}
              ></div>
            </div>
            <div className={styles.demographicsLabel}>
              <span className={styles.demographicsName}>{item.name}</span>
              <span className={styles.demographicsValue}>
                {formatNumber(item.value)} ({((item.value / totalPopulation) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 