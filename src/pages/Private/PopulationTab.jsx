import React, { useState } from 'react';
import CensusDataPanel from "../../components/CensusDataPanel";
import styles from "./PopulationTab.module.css";
import Banner from "../../components/Banner";

export default function PopulationTab({ provider, radiusInMiles }) {
  const [showBanner, setShowBanner] = useState(true);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <div className={styles.container}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      <Banner
        title="Population Analysis & Demographics"
        message="This section provides census-based population data and demographic insights for your market area. As we continue developing, you'll see population trends, age distribution analysis, income demographics, and much more that will help you understand and plan for your market demographics."
        icon="👥"
        onClose={handleCloseBanner}
      />

      <CensusDataPanel 
        provider={provider}
        radiusInMiles={radiusInMiles}
      />
    </div>
  );
} 