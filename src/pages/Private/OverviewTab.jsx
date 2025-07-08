import React, { useState } from 'react';
import styles from './OverviewTab.module.css';

export default function OverviewTab({ provider }) {
  const [showBanner, setShowBanner] = useState(true);

  if (!provider) {
    return <p>Loading provider data...</p>;
  }

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <div className={styles.container}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      {showBanner && (
        <div className={styles.comingSoonBanner}>
          <button className={styles.closeButton} onClick={handleCloseBanner}>
            ×
          </button>
          <div className={styles.bannerIcon}>📊</div>
          <div className={styles.bannerContent}>
            <h3>Customizable Dashboard Coming Soon</h3>
            <p>
              Soon you'll be able to personalize your dashboard with the metrics that matter most to you, arrange data points to fit your workflow, and create a view that perfectly matches your strategic needs. Your early feedback helps us shape the future of provider intelligence!
            </p>
          </div>
        </div>
      )}

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
