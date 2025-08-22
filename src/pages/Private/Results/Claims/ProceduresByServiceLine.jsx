import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import { apiUrl } from '../../../../utils/api';

export default function ProceduresByServiceLine({ provider, radiusInMiles, nearbyProviders }) {
  const [serviceLineData, setServiceLineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (provider?.dhc && nearbyProviders) {
      fetchServiceLineData();
    }
  }, [provider?.dhc, nearbyProviders]);

  const fetchServiceLineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all provider DHCs in the market (main provider + nearby providers)
      // Only include numeric DHCs (exclude market IDs like 'market-123')
      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)]
        .filter(Boolean)
        .filter(dhc => !isNaN(parseInt(dhc)));
      
      // Check if we have any valid DHCs before making the API call
      if (allProviderDhcs.length === 0) {
        setError("No valid provider DHCs found in this market");
        return;
      }
      
      // First, get the related NPIs for all providers in the market
      const npisResponse = await fetch(apiUrl('/api/related-npis'), {
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
      
      // Now fetch procedure data by service line
      const response = await fetch(apiUrl('/api/procedures-by-service-line'), {
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
        setServiceLineData(result.data);
      } else {
        setError(result.message || "Failed to fetch service line procedure data");
      }
    } catch (err) {
      console.error("Error fetching service line procedure data:", err);
      setError("Failed to fetch service line procedure data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading service line procedure data..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Service Line Data</h3>
        <p>{error}</p>
        <button onClick={fetchServiceLineData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!serviceLineData || serviceLineData.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h3>No Service Line Procedure Data Available</h3>
        <p>No procedure data found by service line for the last 12 months.</p>
      </div>
    );
  }

  const totalCount = serviceLineData.reduce((sum, row) => sum + parseInt(row.total_count), 0);
  const averageCount = Math.round(totalCount / serviceLineData.length);

  return (
    <div className={styles.componentContainer}>
      <div className={styles.componentHeader}>
        <h3>Procedures by Service Line</h3>
        <p>Breakdown of procedure volume by service line in {radiusInMiles}mi radius market</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <h4>Total Service Lines</h4>
          <p className={styles.summaryValue}>{serviceLineData.length.toLocaleString()}</p>
          <p className={styles.summaryLabel}>With procedure data</p>
        </div>
        <div className={styles.summaryCard}>
          <h4>Total Procedures</h4>
          <p className={styles.summaryValue}>{totalCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Across all service lines</p>
        </div>
        <div className={styles.summaryCard}>
          <h4>Average per Service Line</h4>
          <p className={styles.summaryValue}>{averageCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Procedure count</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Service Line</th>
                <th>Procedure Count</th>
                <th>Percentage of Total</th>
                <th>Average per Month</th>
              </tr>
            </thead>
            <tbody>
              {serviceLineData.map((row, index) => {
                const count = parseInt(row.total_count);
                const percentage = ((count / totalCount) * 100).toFixed(1);
                const avgPerMonth = Math.round(count / 24);
                
                return (
                  <tr key={index}>
                    <td>{row.service_line_description || 'Unknown'}</td>
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