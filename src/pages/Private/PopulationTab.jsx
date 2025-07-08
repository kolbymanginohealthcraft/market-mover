import React, { useState } from 'react';
import CensusDataPanel from "../../components/CensusDataPanel";
import styles from "./PopulationTab.module.css";

export default function PopulationTab({ provider, radiusInMiles }) {
  const [showBanner, setShowBanner] = useState(true);

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
          <div className={styles.bannerIcon}>👥</div>
          <div className={styles.bannerContent}>
            <h3>Population Analysis & Demographics</h3>
            <p>
              This section provides census-based population data and demographic insights for your market area. As we continue developing, you'll see population trends, age distribution analysis, income demographics, and much more that will help you understand and plan for your market demographics.
            </p>
          </div>
        </div>
      )}

      <CensusDataPanel 
        provider={provider}
        radiusInMiles={radiusInMiles}
      />
    </div>
  );
} 