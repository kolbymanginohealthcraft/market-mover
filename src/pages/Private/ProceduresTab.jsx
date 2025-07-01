import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../components/Buttons/Spinner";
import ProceduresByMonth from "./ProceduresTab/ProceduresByMonth";
import ProceduresByProvider from "./ProceduresTab/ProceduresByProvider";
import ProceduresByServiceLine from "./ProceduresTab/ProceduresByServiceLine";

export default function ProceduresTab({ provider, radiusInMiles, nearbyProviders }) {
  const [activeTab, setActiveTab] = useState("month");
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // No longer need the old data fetching logic since each component handles its own data

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Procedure Volume <span className={styles.subheader}>Market analysis for the last 12 months</span></h2>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${activeTab === "month" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("month")}
          >
            By Month
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "provider" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("provider")}
          >
            By Provider
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "serviceLine" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("serviceLine")}
          >
            By Service Line
          </button>
        </div>
        <input
          type="text"
          className={styles.searchBar}
          placeholder="Search..."
          disabled
        />
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "month" && <ProceduresByMonth provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />}
        {activeTab === "provider" && <ProceduresByProvider provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />}
        {activeTab === "serviceLine" && <ProceduresByServiceLine provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />}
      </div>
    </div>
  );
} 