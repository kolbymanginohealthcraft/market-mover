import { useState, useEffect, useMemo } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import ClaimsByMonth from "./ClaimsByMonth";
import ClaimsByProvider from "./ClaimsByProvider";
import ClaimsByServiceLine from "./ClaimsByServiceLine";
import { apiUrl } from '../../../../utils/api';

// Cache for NPIs to avoid redundant API calls
const npiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(providerDhcs) {
  return providerDhcs.sort().join(',');
}

function getCachedNPIs(providerDhcs) {
  const key = getCacheKey(providerDhcs);
  const cached = npiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.npis;
  }
  return null;
}

function setCachedNPIs(providerDhcs, npis) {
  const key = getCacheKey(providerDhcs);
  npiCache.set(key, {
    npis,
    timestamp: Date.now()
  });
}

export default function ClaimsTab({ provider, radiusInMiles, nearbyProviders }) {
  const [activeTab, setActiveTab] = useState("month");
  const [claimType, setClaimType] = useState("rendered"); // "rendered" or "referred"
  const [dataType, setDataType] = useState("diagnosis"); // "diagnosis" or "procedure"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedNPIs, setCachedNPIs] = useState(null);

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

  // Fetch NPIs once and cache them for all components
  useEffect(() => {
    async function fetchNPIs() {
      if (!provider?.dhc || !nearbyProviders) return;

      // Get all provider DHCs in the market (main provider + nearby providers)
      // Only include numeric DHCs (exclude market IDs like 'market-123')
      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)]
        .filter(Boolean)
        .filter(dhc => !isNaN(parseInt(dhc)));

      if (allProviderDhcs.length === 0) {
        setError("No valid provider DHCs found in this market");
        return;
      }

      // Check cache first
      const cached = getCachedNPIs(allProviderDhcs);
      if (cached) {
        setCachedNPIs(cached);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 Getting NPIs for ${allProviderDhcs.length} providers in ${radiusInMiles}mi radius`);
        
        const npisResponse = await fetch(apiUrl("/api/related-npis"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dhc_ids: allProviderDhcs })
        });

        const npisResult = await npisResponse.json();

        if (!npisResult.success) {
          throw new Error(npisResult.error || "Failed to fetch related NPIs");
        }

        const npis = npisResult.data.map(row => row.npi);

        if (npis.length === 0) {
          setError("No NPIs found for providers in this market");
          return;
        }

        // Cache the NPIs
        setCachedNPIs(allProviderDhcs, npis);
        setCachedNPIs(npis);
        console.log(`✅ Cached ${npis.length} NPIs for reuse across tabs`);

      } catch (err) {
        console.error("❌ Error fetching NPIs:", err);
        setError(`Failed to fetch NPIs: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchNPIs();
  }, [provider?.dhc, nearbyProviders, radiusInMiles]);

  // Shared props for all components
  const sharedProps = useMemo(() => ({
    provider,
    radiusInMiles,
    nearbyProviders,
    claimType,
    dataType,
    cachedNPIs,
    loading: loading || !cachedNPIs,
    error
  }), [provider, radiusInMiles, nearbyProviders, claimType, dataType, cachedNPIs, loading, error]);

  if (loading) {
    return <Spinner message="Loading provider data..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
          <ClaimsByMonth {...sharedProps} />
        )}
        {activeTab === "provider" && (
          <ClaimsByProvider {...sharedProps} />
        )}
        {activeTab === "serviceLine" && (
          <ClaimsByServiceLine {...sharedProps} />
        )}
      </div>
    </div>
  );
} 