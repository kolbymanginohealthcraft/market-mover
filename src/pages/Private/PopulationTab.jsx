import React from 'react';
import CensusDataPanel from "../../components/CensusDataPanel";
import styles from "./PopulationTab.module.css";

export default function PopulationTab({ provider, radiusInMiles }) {
  return (
    <div className={styles.container}>
      <CensusDataPanel 
        provider={provider}
        radiusInMiles={radiusInMiles}
      />
    </div>
  );
} 