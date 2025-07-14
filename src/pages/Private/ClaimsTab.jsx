import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../components/Buttons/Spinner";
import ClaimsByMonth from "./ClaimsTab/ClaimsByMonth";
import ClaimsByProvider from "./ClaimsTab/ClaimsByProvider";
import ClaimsByServiceLine from "./ClaimsTab/ClaimsByServiceLine";
import Banner from "../../components/Banner";

export default function ClaimsTab({ provider, radiusInMiles, nearbyProviders }) {
  const [showBanner, setShowBanner] = useState(true);
  const [activeTab, setActiveTab] = useState("month");
  const [claimType, setClaimType] = useState("rendered"); // "rendered" or "referred"
  const [dataType, setDataType] = useState("diagnosis"); // "diagnosis" or "procedure"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine available data types based on claim type
  const availableDataTypes = claimType === "referred" 
    ? ["diagnosis", "procedure", "overall"] 
    : ["diagnosis", "procedure"];

  // Update data type if current selection is not available
  useEffect(() => {
    if (!availableDataTypes.includes(dataType)) {
      setDataType(availableDataTypes[0]);
    }
  }, [claimType, dataType, availableDataTypes]);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <div className={styles.container}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      <Banner
        title="Enhanced Claims Analysis Coming Soon"
        message="We're building comprehensive claims analysis powered by a robust multi-year all-payer database. Soon you'll have access to claim volume trends, cost analysis, and service line breakdowns. This tool will help you identify market opportunities and make data-driven strategic decisions with unprecedented granularity."
        icon="🚀"
        onClose={handleCloseBanner}
      />

      {/* Claim Type Selection */}
      <div className={styles.claimTypeSelection}>
        <div className={styles.selectionGroup}>
          <label className={styles.selectionLabel}>Claim Type:</label>
          <div className={styles.selectionButtons}>
            <button
              className={`${styles.selectionButton} ${claimType === "rendered" ? styles.activeSelection : ""}`}
              onClick={() => setClaimType("rendered")}
            >
              Rendered
            </button>
            <button
              className={`${styles.selectionButton} ${claimType === "referred" ? styles.activeSelection : ""}`}
              onClick={() => setClaimType("referred")}
            >
              Referred
            </button>
          </div>
        </div>

        <div className={styles.selectionGroup}>
          <label className={styles.selectionLabel}>Data Type:</label>
          <div className={styles.selectionButtons}>
            {availableDataTypes.map(type => (
              <button
                key={type}
                className={`${styles.selectionButton} ${dataType === type ? styles.activeSelection : ""}`}
                onClick={() => setDataType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.timeframeInfo}>
          Market analysis for the last 12 months
        </div>
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
        {activeTab === "month" && (
          <ClaimsByMonth 
            provider={provider} 
            radiusInMiles={radiusInMiles} 
            nearbyProviders={nearbyProviders}
            claimType={claimType}
            dataType={dataType}
          />
        )}
        {activeTab === "provider" && (
          <ClaimsByProvider 
            provider={provider} 
            radiusInMiles={radiusInMiles} 
            nearbyProviders={nearbyProviders}
            claimType={claimType}
            dataType={dataType}
          />
        )}
        {activeTab === "serviceLine" && (
          <ClaimsByServiceLine 
            provider={provider} 
            radiusInMiles={radiusInMiles} 
            nearbyProviders={nearbyProviders}
            claimType={claimType}
            dataType={dataType}
          />
        )}
      </div>
    </div>
  );
} 