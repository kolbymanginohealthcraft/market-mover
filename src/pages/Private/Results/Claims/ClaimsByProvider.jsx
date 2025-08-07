import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import { apiUrl } from '../../../../utils/api';

export default function ClaimsByProvider({ provider, radiusInMiles, nearbyProviders, claimType, dataType }) {
  const [providerData, setProviderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (provider?.dhc && nearbyProviders) {
      fetchProviderData();
    }
  }, [provider?.dhc, nearbyProviders, claimType, dataType]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all provider DHCs in the market (main provider + nearby providers)
      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)].filter(Boolean);
      
      console.log(`🔍 Getting NPIs for ${allProviderDhcs.length} providers in ${radiusInMiles}mi radius`);
      
      // First, get the related NPIs for all providers in the market
      const npisResponse = await fetch(apiUrl("/api/related-npis"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dhc_ids: allProviderDhcs
        }),
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
      
      // Now fetch claims data by provider
      const response = await fetch(apiUrl("/api/claims-by-provider"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npis: npis,
          claimType: claimType,
          dataType: dataType
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProviderData(result.data);
      } else {
        console.error("❌ Backend error:", result);
        setError(result.message || "Failed to fetch provider claims data");
      }
    } catch (err) {
      console.error("❌ Error fetching provider claims data:", err);
      setError(`Failed to fetch provider claims data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message={`Loading provider ${dataType} data for ${claimType} claims...`} />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Provider Data</h3>
        <p>{error}</p>
        <button onClick={fetchProviderData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!providerData || providerData.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h3>No Provider Claims Data Available</h3>
        <p>No {dataType} data found for {claimType} claims by provider for the last 12 months.</p>
      </div>
    );
  }

  const totalCount = providerData.reduce((sum, row) => sum + parseInt(row.total_count || row.inbound_count || 0), 0);
  const averageCount = Math.round(totalCount / providerData.length);

  return (
    <div className={styles.componentContainer}>
      <div className={styles.componentHeader}>
        <h3>{dataType.charAt(0).toUpperCase() + dataType.slice(1)} by Provider - {claimType.charAt(0).toUpperCase() + claimType.slice(1)} Claims</h3>
        <p>Breakdown of {dataType} volume by individual providers for {claimType} claims in {radiusInMiles}mi radius market</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <h4>Total Providers</h4>
          <p className={styles.summaryValue}>{providerData.length.toLocaleString()}</p>
          <p className={styles.summaryLabel}>With {dataType} data</p>
        </div>
        <div className={styles.summaryCard}>
          <h4>Total {dataType.charAt(0).toUpperCase() + dataType.slice(1)}</h4>
          <p className={styles.summaryValue}>{totalCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Across all providers</p>
        </div>
        <div className={styles.summaryCard}>
          <h4>Average per Provider</h4>
          <p className={styles.summaryValue}>{averageCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>{dataType} count</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider NPI</th>
                <th>{dataType.charAt(0).toUpperCase() + dataType.slice(1)} Count</th>
                <th>Percentage of Total</th>
                <th>Average per Month</th>
              </tr>
            </thead>
            <tbody>
              {providerData.map((row, index) => {
                const count = parseInt(row.total_count || row.inbound_count || 0);
                const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
                const avgPerMonth = Math.round(count / 12);
                
                return (
                  <tr key={index}>
                    <td>{row.billing_provider_npi || row.outbound_billing_provider_npi}</td>
                    <td>{count.toLocaleString()}</td>
                    <td>{percentage}%</td>
                    <td>{avgPerMonth.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 