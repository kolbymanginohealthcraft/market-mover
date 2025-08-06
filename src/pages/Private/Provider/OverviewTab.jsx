import React, { useState } from 'react';
import styles from './OverviewTab.module.css';
import Banner from '../../../components/Banner';

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
      <Banner
        title="Customizable Dashboard Coming Soon"
        message="Soon you'll be able to personalize your dashboard with the metrics that matter most to you, arrange data points to fit your workflow, and create a view that perfectly matches your strategic needs. Your early feedback helps us shape the future of provider intelligence!"
        icon="📊"
        onClose={handleCloseBanner}
      />

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
