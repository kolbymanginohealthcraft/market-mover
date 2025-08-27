import React from 'react';
import CensusDataPanel from "./CensusDataPanel";
import styles from "./PopulationTab.module.css";

export default function PopulationTab({ provider, radiusInMiles, censusData, counties, censusTracts }) {
  return (
    <CensusDataPanel 
      provider={provider}
      radiusInMiles={radiusInMiles}
      censusData={censusData}
      counties={counties}
      censusTracts={censusTracts}
    />
  );
} 