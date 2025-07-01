import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../components/Buttons/Spinner";
import DiagnosesByMonth from "./DiagnosesTab/DiagnosesByMonth";
import DiagnosesByProvider from "./DiagnosesTab/DiagnosesByProvider";
import DiagnosesByServiceLine from "./DiagnosesTab/DiagnosesByServiceLine";

export default function DiagnosesTab({ provider, radiusInMiles, nearbyProviders }) {
  const [activeTab, setActiveTab] = useState("month");
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // No longer need the old data fetching logic since each component handles its own data

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Diagnosis Volume</h2>
        <p>Comprehensive diagnosis analysis for the last 12 months</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
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

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "month" && <DiagnosesByMonth provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />}
        {activeTab === "provider" && <DiagnosesByProvider provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />}
        {activeTab === "serviceLine" && <DiagnosesByServiceLine provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />}
      </div>
    </div>
  );
} 