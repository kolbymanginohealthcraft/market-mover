import { useState, useEffect } from "react";
import styles from "../DiagnosesTab.module.css";
import Spinner from "../../../components/Buttons/Spinner";
import { apiUrl } from '../../../utils/api';

export default function ProceduresByMonth({ provider, radiusInMiles, nearbyProviders }) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (provider?.dhc && nearbyProviders) {
      fetchMonthlyData();
    }
  }, [provider?.dhc, nearbyProviders]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all provider DHCs in the market (main provider + nearby providers)
      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)].filter(Boolean);
      
      // Get all provider DHCs in the market (main provider + nearby providers)
      
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
      
      // Now fetch procedure data by month
      const response = await fetch(apiUrl('/api/procedures-volume'), {
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
        if (result.data && result.data.length > 0) {
          setMonthlyData(result.data);
        } else {
          setError("No monthly procedure data found for the specified NPIs in the last 12 months");
        }
      } else {
        setError(result.message || "Failed to fetch monthly procedure data");
      }
    } catch (err) {
      console.error("Error fetching monthly procedure data:", err);
      setError("Failed to fetch monthly procedure data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading monthly procedure data..." />;
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
        <h3>No Monthly Procedure Data Available</h3>
        <p>No procedure data found by month for the last 12 months.</p>
      </div>
    );
  }

  // Format the data for display
  const formattedData = monthlyData.map(row => {
    let monthDisplay = 'Unknown Month';
    try {
      if (row.date_string) {
        const date = new Date(row.date_string);
        if (!isNaN(date.getTime())) {
          monthDisplay = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          });
        } else {
          monthDisplay = row.date_string;
        }
      } else if (row.date__month_grain) {
        monthDisplay = row.date__month_grain.toString();
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      monthDisplay = row.date_string || row.date__month_grain?.toString() || 'Unknown Month';
    }
    
    return {
      month: monthDisplay,
      count: parseInt(row.total_count).toLocaleString(),
      rawCount: parseInt(row.total_count)
    };
  });

  const totalCount = formattedData.reduce((sum, row) => sum + row.rawCount, 0);
  const averageCount = Math.round(totalCount / formattedData.length);

  return (
    <div className={styles.componentContainer}>
      <div className={styles.componentHeader}>
        <h3>Procedures by Month</h3>
        <p>Monthly breakdown of procedure volume for the last 12 months in {radiusInMiles}mi radius market</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <h4>Total Procedures</h4>
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
                <th>Procedure Count</th>
                <th>Percentage of Total</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {formattedData.map((row, index) => {
                const percentage = ((row.rawCount / totalCount) * 100).toFixed(1);
                const previousCount = index < formattedData.length - 1 ? formattedData[index + 1].rawCount : null;
                const trend = previousCount ? ((row.rawCount - previousCount) / previousCount * 100).toFixed(1) : null;
                
                return (
                  <tr key={index}>
                    <td>{row.month}</td>
                    <td>{row.count}</td>
                    <td>{percentage}%</td>
                    <td>
                      {trend ? (
                        <span className={trend > 0 ? styles.trendUp : styles.trendDown}>
                          {trend > 0 ? '+' : ''}{trend}%
                        </span>
                      ) : 'N/A'}
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