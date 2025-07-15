import React, { useMemo } from "react";
import Spinner from "./Buttons/Spinner";

function formatPercent(num) {
  if (num === null || num === undefined || isNaN(num)) return "N/A";
  return `${(num * 100).toFixed(1)}%`;
}

function formatNumber(num) {
  if (num === null || num === undefined) return "N/A";
  return new Intl.NumberFormat().format(Math.round(num));
}

const styles = {
  container: {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    margin: '0 auto'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  summaryItem: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    borderLeft: '4px solid #007bff'
  },
  summaryLabel: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '5px',
    fontWeight: '500'
  },
  summaryValue: {
    display: 'block',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#333'
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057'
  },
  tableCell: {
    padding: '12px 8px',
    borderBottom: '1px solid #dee2e6',
    color: '#333'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  error: {
    background: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    padding: '15px',
    color: '#721c24'
  },
  noData: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px'
  }
};

export default function MAEnrollmentPanel({ data, loading, error }) {
  console.log("🔍 MAEnrollmentPanel props:", { data, loading, error });
  console.log("🔍 Data type:", typeof data, "Data length:", data?.length);

  // Calculate market totals from county-level data (ma_penetration table)
  const marketTotals = useMemo(() => {
    if (!data || data.length === 0) {
      return { total_enrollment: 0, total_eligibles: 0, total_organizations: 0 };
    }

    // Use county-level totals from ma_penetration table, ensuring each county is counted only once
    const countyTotals = new Map(); // fips -> { enrolled, eligibles }
    
    data.forEach(row => {
      const fips = row.fips;
      if (!countyTotals.has(fips)) {
        countyTotals.set(fips, {
          enrolled: row.enrolled || 0,
          eligibles: row.eligibles || 0
        });
      }
    });

    // Sum up all county totals
    const totals = Array.from(countyTotals.values()).reduce((sum, county) => ({
      total_enrollment: sum.total_enrollment + county.enrolled,
      total_eligibles: sum.total_eligibles + county.eligibles
    }), { total_enrollment: 0, total_eligibles: 0 });

    // Count unique parent organizations for the table
    const uniqueOrgs = new Set();
    data.forEach(row => {
      if (row.parent_org) {
        uniqueOrgs.add(row.parent_org);
      }
    });

    return {
      ...totals,
      total_organizations: uniqueOrgs.size
    };
  }, [data]);

  // Aggregate plan-level data by parent organization for the detailed table
  const aggregatedData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const orgMap = new Map();

    data.forEach(row => {
      const parentOrg = row.parent_org || 'Unknown';
      
      if (!orgMap.has(parentOrg)) {
        orgMap.set(parentOrg, {
          parent_org: parentOrg,
          total_enrollment: 0,
          plan_count: 0,
          contract_count: 0,
          counties: new Set()
        });
      }

      const org = orgMap.get(parentOrg);
      // Use plan-level enrollment data for the detailed breakdown
      org.total_enrollment += (row.enrollment || 0);
      org.plan_count += 1;
      org.contract_count += (row.contract_name ? 1 : 0);
      org.counties.add(row.fips);
    });

    // Convert to array and calculate penetration using county-level eligibles
    const result = Array.from(orgMap.values())
      .map(org => {
        // Calculate eligibles for this org by summing county-level eligibles for counties they operate in
        const countyTotals = new Map();
        data.forEach(row => {
          if (org.counties.has(row.fips)) {
            countyTotals.set(row.fips, row.eligibles || 0);
          }
        });
        const totalEligibles = Array.from(countyTotals.values()).reduce((sum, eligibles) => sum + eligibles, 0);
        
        return {
          ...org,
          counties: Array.from(org.counties),
          total_eligibles: totalEligibles,
          penetration: totalEligibles > 0 ? (org.total_enrollment / totalEligibles) : 0
        };
      })
      .sort((a, b) => b.total_enrollment - a.total_enrollment); // Sort by enrollment descending

    return result;
  }, [data]);

  const marketPenetration = marketTotals.total_eligibles > 0 
    ? (marketTotals.total_enrollment / marketTotals.total_eligibles) 
    : 0;

  console.log("🔍 Component state:", { loading, error, hasData: !!data?.length, aggregatedCount: aggregatedData.length });

  if (loading) {
    console.log("🔍 Showing loading spinner");
    return <Spinner message="Loading MA Enrollment data..." />;
  }
  
  if (error) {
    console.log("🔍 Showing error:", error);
    return <div style={styles.error}>❌ {error}</div>;
  }
  
  if (!data || data.length === 0) {
    console.log("🔍 Showing no data message");
    return <div style={styles.noData}>No MA Enrollment data available for this market</div>;
  }

  console.log("🔍 Rendering component with data");

  return (
    <div style={styles.container}>
      <h3>Medicare Advantage Enrollment by Organization</h3>
      
      {/* Market Summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryItem}>
          <label style={styles.summaryLabel}>Total Enrollment</label>
          <span style={styles.summaryValue}>{formatNumber(marketTotals.total_enrollment)}</span>
        </div>
        <div style={styles.summaryItem}>
          <label style={styles.summaryLabel}>Total Eligibles</label>
          <span style={styles.summaryValue}>{formatNumber(marketTotals.total_eligibles)}</span>
        </div>
        <div style={styles.summaryItem}>
          <label style={styles.summaryLabel}>Market Penetration</label>
          <span style={styles.summaryValue}>{formatPercent(marketPenetration)}</span>
        </div>
        <div style={styles.summaryItem}>
          <label style={styles.summaryLabel}>Organizations</label>
          <span style={styles.summaryValue}>{marketTotals.total_organizations}</span>
        </div>
      </div>

      {/* Organization Details */}
      <div style={{ overflowX: "auto", marginTop: "20px" }}>
        <table style={styles.dataTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Parent Organization</th>
              <th style={styles.tableHeader}>Enrollment</th>
              <th style={styles.tableHeader}>Plans</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((org, i) => (
              <tr key={i} style={styles.tableRow}>
                <td style={styles.tableCell}>{org.parent_org}</td>
                <td style={styles.tableCell}>{formatNumber(org.total_enrollment)}</td>
                <td style={styles.tableCell}>{org.plan_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 