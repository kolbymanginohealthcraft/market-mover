import React from 'react';
import styles from './OverviewTab.module.css';

export default function OverviewTab({ provider }) {
  if (!provider) {
    return <p>Loading provider data...</p>;
  }

  return (
    <div className={styles.container}>
      {/* Temporary Banner - Coming Soon */}
      <div className={styles.comingSoonBanner}>
        <div className={styles.bannerIcon}>📊</div>
        <div className={styles.bannerContent}>
          <h3>Customizable Dashboard Coming Soon</h3>
          <p>
            This overview page is currently in a basic state, but we are working on features that will let you customize your dashboard and choose which summary metrics are most relevant to you. In the future, you'll be able to select and arrange key data points to create a view that fits your workflow and preferences.
          </p>
        </div>
      </div>

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
    </div>
  );
}
