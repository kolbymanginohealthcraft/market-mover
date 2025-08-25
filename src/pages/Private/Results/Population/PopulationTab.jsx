import React from 'react';
import CensusDataPanel from "./CensusDataPanel";
import styles from "./PopulationTab.module.css";

export default function PopulationTab({ provider, radiusInMiles }) {
  return (
    <CensusDataPanel 
      provider={provider}
      radiusInMiles={radiusInMiles}
    />
  );
} 