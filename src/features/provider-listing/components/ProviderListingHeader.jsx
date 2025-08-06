import React, { useState } from 'react';
import Banner from '../../../components/Banner';
import styles from './ProviderListingHeader.module.css';

export const ProviderListingHeader = ({ provider, radiusInMiles, isInSavedMarket }) => {
  const [showBanner, setShowBanner] = useState(true);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <div className={styles.header}>
      {showBanner && isInSavedMarket && (
        <Banner
          title="Saved Market Mode"
          message="You're viewing providers in a saved market. Use the tagging system to organize providers as partners or competitors."
          onClose={handleCloseBanner}
          color="blue"
        />
      )}
      
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <h1>Nearby Providers</h1>
          <p>
            {provider?.name} • {radiusInMiles} mile radius • {provider?.city}, {provider?.state}
          </p>
        </div>
      </div>
    </div>
  );
}; 