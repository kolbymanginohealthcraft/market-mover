import CensusDataPanel from "../../components/CensusDataPanel";
import styles from "./PopulationTab.module.css";

export default function PopulationTab({ provider, radiusInMiles }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Population & Demographics</h2>
        <p className={styles.subtitle}>
          Census data for {provider.name} market ({radiusInMiles} mile radius)
        </p>
      </div>

      {/* Temporary Banner - Population Analysis */}
      <div className={styles.comingSoonBanner}>
        <div className={styles.bannerIcon}>👥</div>
        <div className={styles.bannerContent}>
          <h3>Population Analysis & Demographics</h3>
          <p>
            This section provides census-based population data and demographic insights for your market area. Currently showing basic demographic information, we are working on additional features that will include population trends, age distribution analysis, income demographics, and other relevant market indicators to help you better understand the population characteristics in your service area.
          </p>
        </div>
      </div>

      <CensusDataPanel 
        provider={provider}
        radiusInMiles={radiusInMiles}
      />
    </div>
  );
} 