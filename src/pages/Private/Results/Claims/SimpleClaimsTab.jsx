import { useState, useEffect } from "react";
import styles from "./ClaimsTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import { apiUrl } from '../../../../utils/api';
import { BarChart3, FileText } from "lucide-react";

// Helper function to format currency values
function formatCurrency(value) {
  if (value == null || value === undefined) return '$0';
  
  let numValue;
  if (typeof value === 'object' && value.constructor && value.constructor.name === 'Big') {
    numValue = parseFloat(value.toString());
  } else {
    numValue = parseFloat(value);
  }
  
  if (isNaN(numValue)) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
}

// Helper function to format numbers
function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  return parseInt(value).toLocaleString();
}

// Helper to format time period display
function formatTimePeriod(timePeriod) {
  if (!timePeriod || !timePeriod.from || !timePeriod.to) {
    return 'Loading...';
  }
  return `${timePeriod.from} - ${timePeriod.to}`;
}

export default function SimpleClaimsTab({ provider, activeTab, setActiveTab }) {
  // Core state
  const [npis, setNpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Claims data state
  const [timePeriod, setTimePeriod] = useState(null);
  const [volumeMetrics, setVolumeMetrics] = useState(null);
  const [topProcedures, setTopProcedures] = useState(null);
  const [diagnosisMetrics, setDiagnosisMetrics] = useState(null);
  const [topDiagnoses, setTopDiagnoses] = useState(null);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);

  // Fetch NPIs for this provider only
  useEffect(() => {
    async function fetchNPIs() {
      if (!provider?.dhc) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(apiUrl('/api/related-npis'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: [provider.dhc] })
        });
        
        if (!response.ok) throw new Error('Failed to fetch NPIs');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch NPIs');
        
        setNpis(result.data || []);
      } catch (err) {
        console.error('Error fetching NPIs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNPIs();
  }, [provider?.dhc]);

  // Fetch claims data when NPIs are loaded
  useEffect(() => {
    async function fetchClaimsData() {
      if (!npis || npis.length === 0) return;

      setClaimsLoading(true);
      setClaimsError(null);

      try {
        const response = await fetch(apiUrl('/api/provider-claims'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npis: npis.map(n => n.npi)
          })
        });

        if (!response.ok) throw new Error('Failed to fetch claims data');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch claims data');
        
        setTimePeriod(result.data.timePeriod);
        setVolumeMetrics(result.data.volumeMetrics);
        setTopProcedures(result.data.topProcedures || []);
        setDiagnosisMetrics(result.data.diagnosisMetrics);
        setTopDiagnoses(result.data.topDiagnoses || []);
      } catch (err) {
        console.error('Error fetching claims data:', err);
        setClaimsError(err.message);
      } finally {
        setClaimsLoading(false);
      }
    }

    fetchClaimsData();
  }, [npis]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
        <p>Loading provider data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Provider</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!npis || npis.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <h3>No NPIs Found</h3>
        <p>No NPIs found for this provider. Claims data is not available.</p>
      </div>
    );
  }

  return (
    <>
      {/* Content */}
      {claimsLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
          <p>Loading claims data...</p>
        </div>
      ) : claimsError ? (
        <div className={styles.errorContainer}>
          <h3>Error Loading Claims Data</h3>
          <p>{claimsError}</p>
        </div>
      ) : (
        <>
          {/* Procedures Tab */}
          {activeTab === 'procedures' && volumeMetrics && (
            <div className={styles.tabContent}>
              {/* Compact Summary Cards */}
              <div className={styles.compactStats}>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Time Period</div>
                  <div className={styles.compactStatValue}>{formatTimePeriod(timePeriod)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Total Procedures</div>
                  <div className={styles.compactStatValue}>{formatNumber(volumeMetrics.totalProcedures)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Total Charges</div>
                  <div className={styles.compactStatValue}>{formatCurrency(volumeMetrics.totalCharges)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Unique Procedures</div>
                  <div className={styles.compactStatValue}>{formatNumber(volumeMetrics.uniqueProcedures)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Months with Data</div>
                  <div className={styles.compactStatValue}>{volumeMetrics.monthsWithData}</div>
                </div>
              </div>

              {/* Top Procedures Table */}
              {topProcedures && topProcedures.length > 0 && (
                <div className={styles.dataTable}>
                  <div className={styles.tableHeader}>
                    <h3>Top Procedures</h3>
                  </div>
                  <div className={styles.tableContainer}>
                    <table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Service Line</th>
                          <th>Count</th>
                          <th>Charges</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProcedures.map((proc, idx) => (
                          <tr key={idx}>
                            <td>{proc.code}</td>
                            <td>{proc.code_description || '-'}</td>
                            <td>{proc.service_line_description || '-'}</td>
                            <td>{formatNumber(proc.procedure_count)}</td>
                            <td>{formatCurrency(proc.total_charges)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Diagnoses Tab */}
          {activeTab === 'diagnoses' && diagnosisMetrics && (
            <div className={styles.tabContent}>
              {/* Compact Summary Cards */}
              <div className={styles.compactStats}>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Time Period</div>
                  <div className={styles.compactStatValue}>{formatTimePeriod(timePeriod)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Total Diagnoses</div>
                  <div className={styles.compactStatValue}>{formatNumber(diagnosisMetrics.totalDiagnoses)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Unique Diagnoses</div>
                  <div className={styles.compactStatValue}>{formatNumber(diagnosisMetrics.uniqueDiagnoses)}</div>
                </div>
                <div className={styles.compactStatCard}>
                  <div className={styles.compactStatLabel}>Months with Data</div>
                  <div className={styles.compactStatValue}>{diagnosisMetrics.monthsWithData}</div>
                </div>
              </div>

              {/* Top Diagnoses Table */}
              {topDiagnoses && topDiagnoses.length > 0 && (
                <div className={styles.dataTable}>
                  <div className={styles.tableHeader}>
                    <h3>Top Diagnoses</h3>
                  </div>
                  <div className={styles.tableContainer}>
                    <table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topDiagnoses.map((diag, idx) => (
                          <tr key={idx}>
                            <td>{diag.code}</td>
                            <td>{diag.code_description || '-'}</td>
                            <td>{formatNumber(diag.diagnosis_count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
