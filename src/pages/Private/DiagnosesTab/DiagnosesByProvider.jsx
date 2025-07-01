import { useState, useEffect } from "react";
import styles from "../DiagnosesTab.module.css";
import Spinner from "../../../components/Buttons/Spinner";

export default function DiagnosesByProvider({ provider, radiusInMiles, nearbyProviders }) {
  const [providerData, setProviderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (provider?.dhc && nearbyProviders) {
      fetchProviderData();
    }
  }, [provider?.dhc, nearbyProviders]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all provider DHCs in the market (main provider + nearby providers)
      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)].filter(Boolean);
      
      console.log(`🔍 Getting NPIs for ${allProviderDhcs.length} providers in ${radiusInMiles}mi radius`);
      
      // First, get the related NPIs for all providers in the market
      const npisResponse = await fetch("/api/related-npis", {
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
      
      // Now fetch diagnosis data by provider
      const response = await fetch("/api/diagnoses-by-provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npis: npis
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProviderData(result.data);
      } else {
        setError(result.message || "Failed to fetch provider diagnosis data");
      }
    } catch (err) {
      console.error("Error fetching provider diagnosis data:", err);
      setError("Failed to fetch provider diagnosis data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading provider diagnosis data..." />;
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
        <h3>No Provider Diagnosis Data Available</h3>
        <p>No diagnosis data found by provider for the last 12 months.</p>
      </div>
    );
  }

  const totalCount = providerData.reduce((sum, row) => sum + parseInt(row.total_count), 0);

  const debugNpiData = async () => {
    try {
      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)].filter(Boolean);
      
      const npisResponse = await fetch("/api/related-npis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dhc_ids: allProviderDhcs }),
      });
      
      const npisResult = await npisResponse.json();
      const npis = npisResult.data.map(row => row.npi);
      
      const debugResponse = await fetch("/api/diagnoses-debug-npis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npis }),
      });
      
      const debugResult = await debugResponse.json();
      console.log("🔍 NPI Debug Data:", debugResult);
      alert(`Debug info logged to console. Summary: ${debugResult.data.summary.with12MonthData}/${debugResult.data.summary.totalRequested} NPIs have 12-month data, ${debugResult.data.summary.with24MonthData}/${debugResult.data.summary.totalRequested} NPIs have 24-month data.`);
    } catch (err) {
      console.error("Debug error:", err);
      alert("Debug failed - check console for details");
    }
  };

  return (
    <div className={styles.componentContainer}>
      <div className={styles.componentHeader}>
        <h3>Diagnoses by Provider</h3>
        <p>Breakdown of diagnosis volume by individual providers in {radiusInMiles}mi radius market</p>
        <button 
          onClick={debugNpiData} 
          style={{ 
            marginTop: '10px', 
            padding: '5px 10px', 
            fontSize: '12px', 
            background: '#f0f0f0', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Debug NPI Data
        </button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider NPI</th>
                <th>Diagnosis Count</th>
                <th>Percentage of Total</th>
                <th>Average per Month</th>
              </tr>
            </thead>
            <tbody>
              {providerData.map((row, index) => {
                const count = parseInt(row.total_count);
                const percentage = ((count / totalCount) * 100).toFixed(1);
                const avgPerMonth = Math.round(count / 12);
                
                return (
                  <tr key={index}>
                    <td>{row.billing_provider_npi}</td>
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