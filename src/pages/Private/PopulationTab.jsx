import CensusDataPanel from "../../components/CensusDataPanel";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./PopulationTab.module.css";

export default function PopulationTab({ provider, radiusInMiles }) {
  if (!provider) {
    return <Spinner message="Loading provider data..." />;
  }

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