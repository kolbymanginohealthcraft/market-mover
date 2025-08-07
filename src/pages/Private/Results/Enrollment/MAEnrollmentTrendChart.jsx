import React, { useMemo } from 'react';
import styles from './MAEnrollmentTrendChart.module.css';

export default function MAEnrollmentTrendChart({ data, loading, error, startDate, endDate, type = "ALL" }) {
  console.log("🔍 MAEnrollmentTrendChart data:", data);
  console.log("🔍 Data length:", data?.length);
  if (data && data.length > 0) {
    console.log("🔍 Sample data row:", data[0]);
    console.log("🔍 Sample publish_date:", data[0].publish_date, typeof data[0].publish_date);
  }

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

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Normalize dates to strings for proper grouping
    const normalizedData = data.map(row => {
      let dateStr;
      if (typeof row.publish_date === 'object' && row.publish_date !== null) {
        // Handle BigQuery date objects
        if (row.publish_date.value) {
          dateStr = row.publish_date.value;
        } else if (row.publish_date.toISOString) {
          dateStr = row.publish_date.toISOString().split('T')[0];
        } else {
          console.warn('Unknown date object format:', row.publish_date);
          dateStr = String(row.publish_date);
        }
      } else {
        dateStr = String(row.publish_date);
      }
      
      return {
        ...row,
        publish_date: dateStr
      };
    });

    // Group by publish date
    const groupedByDate = {};
    normalizedData.forEach(row => {
      const date = row.publish_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(row);
    });

    // Convert to chart format
    const result = Object.entries(groupedByDate).map(([date, rows]) => {
      console.log("🔍 Processing date:", date, "with", rows.length, "rows");
      
      // Group organizations within this date
      const orgGroups = {};
      rows.forEach(row => {
        const parentOrg = row.parent_org || 'Unknown';
        if (!orgGroups[parentOrg]) {
          orgGroups[parentOrg] = {
            parent_org: parentOrg,
            org_enrollment: 0
          };
        }
        orgGroups[parentOrg].org_enrollment += row.org_enrollment || 0;
      });

      // Parse the date string properly
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      console.log("🔍 Parsed date:", date, "->", dateObj, "isValid:", !isNaN(dateObj.getTime()));

      return {
        date: dateObj,
        dateStr: date,
        organizations: Object.values(orgGroups).sort((a, b) => b.org_enrollment - a.org_enrollment)
      };
    }).sort((a, b) => a.date - b.date);

    console.log("🔍 Final chart data:", result);
    return result;
  }, [data]);

  if (loading) return <div className={styles.chart}>Loading trend data...</div>;
  if (error) return <div className={styles.chart}>Error: {error}</div>;
  if (!data || data.length === 0) return <div className={styles.chart}>No trend data available.</div>;

  const totalEnrollment = chartData.reduce((sum, dateGroup) => 
    sum + dateGroup.organizations.reduce((dateSum, org) => dateSum + org.org_enrollment, 0), 0
  );

  return (
    <div className={styles.chart}>
      <div className={styles.header}>
        <h3>Enrollment Trends - {getTypeLabel(type)}</h3>
      </div>

      <div className={styles.chartContainer}>
        {chartData.map((dateGroup, dateIndex) => (
          <div key={dateIndex} className={styles.barGroup}>
            <div className={styles.dateLabel}>
              {(() => {
                if (isNaN(dateGroup.date.getTime())) {
                  return dateGroup.dateStr || 'Invalid Date';
                }
                return dateGroup.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                });
              })()}
            </div>
            
            <div className={styles.barContainer}>
              {dateGroup.organizations.map((org, orgIndex) => {
                const totalForDate = dateGroup.organizations.reduce((sum, o) => sum + o.org_enrollment, 0);
                const percentage = totalForDate > 0 ? (org.org_enrollment / totalForDate) * 100 : 0;
                
                // Calculate cumulative height for stacking
                let cumulativeHeight = 0;
                for (let i = 0; i < orgIndex; i++) {
                  const prevOrg = dateGroup.organizations[i];
                  const prevPercentage = totalForDate > 0 ? (prevOrg.org_enrollment / totalForDate) * 100 : 0;
                  cumulativeHeight += prevPercentage;
                }
                
                return (
                  <div
                    key={`${org.parent_org}`}
                    className={styles.barSegment}
                    style={{
                      height: `${percentage}%`,
                      backgroundColor: `hsl(${(orgIndex * 137.5) % 360}, 70%, 60%)`,
                      position: 'absolute',
                      bottom: `${cumulativeHeight}%`,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                      minHeight: '20px',
                      zIndex: orgIndex
                    }}
                    title={`${org.parent_org}: ${org.org_enrollment.toLocaleString()}`}
                  >
                    {org.org_enrollment > 0 && percentage > 5 && (
                      <span>{org.org_enrollment.toLocaleString()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <h4>Organizations</h4>
        <div className={styles.legendItems}>
          {(() => {
            const allOrgs = new Set();
            chartData.forEach(dateGroup => {
              dateGroup.organizations.forEach(org => {
                allOrgs.add(org.parent_org);
              });
            });
            
            return Array.from(allOrgs).map((parentOrg, index) => (
              <div key={parentOrg} className={styles.legendItem}>
                <div 
                  className={styles.legendColor}
                  style={{
                    backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)`
                  }}
                />
                <span className={styles.legendText}>
                  {parentOrg}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
} 