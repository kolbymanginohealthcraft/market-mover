import React from 'react';
import styles from './OverviewTab.module.css';

export default function OverviewTab({ provider }) {
  if (!provider) return <p>Loading provider data...</p>;

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <h2>{provider.name}</h2>
        <p className={styles.type}>{provider.type}</p>
        {provider.network && <p className={styles.network}>{provider.network}</p>}
      </div>

      <div className={styles.profileDetails}>
        <div>
          <label>Address</label>
          <p>
            {provider.street},<br />
            {provider.city}, {provider.state} {provider.zip}
          </p>
        </div>

        <div>
          <label>Phone</label>
          <p>{provider.phone || '—'}</p>
        </div>
      </div>
    </div>
  );
}
