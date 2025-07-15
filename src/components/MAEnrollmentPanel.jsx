import React from 'react';
import styles from './MAEnrollmentPanel.module.css';

export default function MAEnrollmentPanel({ data, loading, error, type = "ALL" }) {
  if (loading) return <div className={styles.panel}>Loading enrollment data...</div>;
  if (error) return <div className={styles.panel}>Error: {error}</div>;
  if (!data || data.length === 0) return <div className={styles.panel}>No enrollment data available.</div>;

  const getTypeLabel = (type) => {
    switch (type) {
      case "MA": return "Medicare Advantage";
      case "PDP": return "Prescription Drug Plans";
      case "ALL": return "All Plans";
      default: return "All Plans";
    }
  };

  const getContractTypeLabel = (contractType) => {
    switch (contractType) {
      case "MA": return "Medicare Advantage";
      case "PDP": return "Prescription Drug Plans";
      default: return contractType || "Unknown";
    }
  };

  // Group by parent organization
  const orgGroups = {};
  
  data.forEach(row => {
    const parentOrg = row.parent_org || 'Unknown';
    
    if (!orgGroups[parentOrg]) {
      orgGroups[parentOrg] = {
        parent_org: parentOrg,
        total_enrollment: 0
      };
    }
    
    // Add enrollment from each plan
    orgGroups[parentOrg].total_enrollment += row.enrollment || 0;
  });

  const orgList = Object.values(orgGroups)
    .sort((a, b) => b.total_enrollment - a.total_enrollment);

  const totalEnrollment = orgList.reduce((sum, org) => sum + org.total_enrollment, 0);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>Enrollment Data - {getTypeLabel(type)}</h3>
        <p>Showing {orgList.length} organizations</p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Total Enrollment:</span>
          <span className={styles.value}>
            {totalEnrollment.toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Organizations:</span>
          <span className={styles.value}>
            {orgList.length}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Penetration Rate:</span>
          <span className={styles.value}>
            {(() => {
              // Calculate total eligibles and enrolled from the raw data
              const countyTypeTotals = {};
              data.forEach(row => {
                const key = `${row.fips}_${row.contract_type}`;
                if (!countyTypeTotals[key]) {
                  countyTypeTotals[key] = {
                    eligibles: row.eligibles || 0,
                    enrolled: row.enrolled || 0
                  };
                }
              });
              
              const totalEligibles = Object.values(countyTypeTotals).reduce((sum, county) => sum + county.eligibles, 0);
              const totalEnrolled = Object.values(countyTypeTotals).reduce((sum, county) => sum + county.enrolled, 0);
              
              return totalEligibles > 0 ? `${((totalEnrolled / totalEligibles) * 100).toFixed(1)}%` : 'N/A';
            })()}
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Parent Organization</th>
              <th>Enrollment</th>
            </tr>
          </thead>
          <tbody>
            {orgList.map((org, index) => (
              <tr key={index}>
                <td>{org.parent_org || 'N/A'}</td>
                <td>{org.total_enrollment.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 