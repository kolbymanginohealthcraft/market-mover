import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import { apiUrl } from '../../../../utils/api';

export default function ClaimsByMonth({ provider, radiusInMiles, nearbyProviders, claimType, dataType, cachedNPIs, loading: parentLoading, error: parentError }) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedNPIs && !parentLoading && !parentError) {
      fetchMonthlyData();
    }
  }, [cachedNPIs, claimType, dataType, parentLoading, parentError]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Using cached NPIs for claims data: ${cachedNPIs.length} NPIs`);
      
      // Use cached NPIs instead of fetching them again
      const npis = cachedNPIs;
      
      // Now fetch claims data by month
      const response = await fetch(apiUrl("/api/claims-volume"), {
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
        if (result.data && result.data.length > 0) {
          setMonthlyData(result.data);
        } else {
          setError(`No monthly ${dataType} data found for ${claimType} claims in the last 12 months`);
        }
      } else {
        console.error("❌ Backend error:", result);
        setError(result.message || "Failed to fetch monthly claims data");
      }
    } catch (err) {
      console.error("❌ Error fetching monthly claims data:", err);
      setError(`Failed to fetch monthly claims data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message={`Loading monthly ${dataType} data for ${claimType} claims...`} />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Monthly Data</h3>
        <p>{error}</p>
        <button onClick={fetchMonthlyData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h3>No Monthly Claims Data Available</h3>
        <p>No {dataType} data found for {claimType} claims by month for the last 12 months.</p>
      </div>
    );
  }

  // Format the data for display
  const formattedData = monthlyData.map(row => {
    let monthDisplay = 'Unknown Month';
    try {
      if (row.date_string) {
        // Parse the date string and ensure it's treated as local time, not UTC
        // BigQuery DATE fields are in YYYY-MM-DD format
        const [year, month, day] = row.date_string.split('-').map(Number);
        if (year && month && day) {
          // Create date in local timezone to avoid UTC conversion issues
          const date = new Date(year, month - 1, day); // month is 0-indexed in JS
          monthDisplay = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
        } else {
          monthDisplay = row.date_string;
        }
      } else if (row.date__month_grain) {
        // If we have the raw date field, parse it directly
        const date = new Date(row.date__month_grain);
        if (!isNaN(date.getTime())) {
          monthDisplay = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
        } else {
          monthDisplay = row.date__month_grain.toString();
        }
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      monthDisplay = row.date_string || row.date__month_grain?.toString() || 'Unknown Month';
    }
    
    return {
      month: monthDisplay,
      count: parseInt(row.total_count || row.inbound_count || 0).toLocaleString(),
      rawCount: parseInt(row.total_count || row.inbound_count || 0)
    };
  });

  const totalCount = formattedData.reduce((sum, row) => sum + row.rawCount, 0);
  const averageCount = Math.round(totalCount / formattedData.length);

  return (
    <div className={styles.componentContainer}>
      <div className={styles.componentHeader}>
        <h3>{dataType.charAt(0).toUpperCase() + dataType.slice(1)} by Month - {claimType.charAt(0).toUpperCase() + claimType.slice(1)} Claims</h3>
        <p>Monthly breakdown of {dataType} volume for {claimType} claims in {radiusInMiles}mi radius market</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <h4>Total {dataType.charAt(0).toUpperCase() + dataType.slice(1)}</h4>
          <p className={styles.summaryValue}>{totalCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Last 12 months</p>
        </div>
        <div className={styles.summaryCard}>
          <h4>Average per Month</h4>
          <p className={styles.summaryValue}>{averageCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Monthly average</p>
        </div>
        <div className={styles.summaryCard}>
          <h4>Latest Month</h4>
          <p className={styles.summaryValue}>{formattedData[0]?.count || 'N/A'}</p>
          <p className={styles.summaryLabel}>{formattedData[0]?.month || 'N/A'}</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>{dataType.charAt(0).toUpperCase() + dataType.slice(1)} Count</th>
                <th>Percentage of Total</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {formattedData.map((row, index) => {
                const percentage = totalCount > 0 ? ((row.rawCount / totalCount) * 100).toFixed(1) : '0.0';
                const previousCount = index < formattedData.length - 1 ? formattedData[index + 1].rawCount : 0;
                const trend = previousCount > 0 ? ((row.rawCount - previousCount) / previousCount * 100).toFixed(1) : '0.0';
                const trendIcon = row.rawCount > previousCount ? '↗' : row.rawCount < previousCount ? '↘' : '→';
                const trendColor = row.rawCount > previousCount ? '#22c55e' : row.rawCount < previousCount ? '#ef4444' : '#6b7280';
                
                return (
                  <tr key={index}>
                    <td>{row.month}</td>
                    <td>{row.count}</td>
                    <td>{percentage}%</td>
                    <td style={{ color: trendColor }}>
                      {trendIcon} {trend}%
                    </td>
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