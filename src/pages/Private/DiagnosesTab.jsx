import { useState, useEffect } from "react";
import styles from "./DiagnosesTab.module.css";
import Spinner from "../../components/Buttons/Spinner";

export default function DiagnosesTab({ provider }) {
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiagnosisData();
  }, []);

  const fetchDiagnosisData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/diagnoses-volume");
      const result = await response.json();
      
      if (result.success) {
        setDiagnosisData(result.data);
      } else {
        setError(result.message || "Failed to fetch diagnosis data");
      }
    } catch (err) {
      console.error("Error fetching diagnosis data:", err);
      setError("Failed to fetch diagnosis data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading diagnosis volume data..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Diagnosis Data</h3>
        <p>{error}</p>
        <button onClick={fetchDiagnosisData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!diagnosisData || diagnosisData.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h3>No Diagnosis Data Available</h3>
        <p>No diagnosis volume data found for the last 12 months.</p>
      </div>
    );
  }

  // Debug: Log the raw data to see the date format
  console.log("Raw diagnosis data:", diagnosisData);
  console.log("First row keys:", diagnosisData.length > 0 ? Object.keys(diagnosisData[0]) : 'No data');

  // Format the data for display
  const formattedData = diagnosisData.map(row => {
    console.log("Processing row:", row);
    
    // Try to parse the date string from BigQuery
    let monthDisplay = 'Unknown Month';
    try {
      if (row.date_string) {
        // Parse the date string (likely in YYYY-MM-DD format)
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
        // Fallback to the original field
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Diagnosis Volume</h2>
        <p>Monthly diagnosis counts for the last 12 months</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <h3>Total Diagnoses</h3>
          <p className={styles.summaryValue}>{totalCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Last 12 months</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Average per Month</h3>
          <p className={styles.summaryValue}>{averageCount.toLocaleString()}</p>
          <p className={styles.summaryLabel}>Monthly average</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Latest Month</h3>
          <p className={styles.summaryValue}>{formattedData[0]?.count || 'N/A'}</p>
          <p className={styles.summaryLabel}>{formattedData[0]?.month || 'N/A'}</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h3>Monthly Breakdown</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Diagnosis Count</th>
                <th>Percentage of Total</th>
              </tr>
            </thead>
            <tbody>
              {formattedData.map((row, index) => {
                const percentage = ((row.rawCount / totalCount) * 100).toFixed(1);
                return (
                  <tr key={index}>
                    <td>{row.month}</td>
                    <td>{row.count}</td>
                    <td>{percentage}%</td>
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