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

      <CensusDataPanel 
        provider={provider}
        radiusInMiles={radiusInMiles}
      />
    </div>
  );
} 