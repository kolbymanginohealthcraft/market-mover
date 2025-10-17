import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClaimsTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import { apiUrl } from '../../../../utils/api';
import { ChevronDown, Filter, BarChart3, Users, Calendar, Activity, ArrowRight } from "lucide-react";

// Helper function to format currency values
function formatCurrency(value) {
  if (value == null || value === undefined) return '$0';
  
  // Handle BigQuery Big objects
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

export default function SimpleClaimsTab({ provider }) {
  const navigate = useNavigate();
  
  // Core state
  const [npis, setNpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Claims data state
  const [claimsData, setClaimsData] = useState(null);
  const [claimsSummary, setClaimsSummary] = useState(null);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);
  
  // Filter state
  const [tableName, setTableName] = useState("volume_procedure");
  const [aggregation, setAggregation] = useState("billing_provider");
  const [filters, setFilters] = useState({});
  
  // Drill-down state
  const [drillDownHistory, setDrillDownHistory] = useState([]);
  const [isDrilledDown, setIsDrilledDown] = useState(false);

  // UI state
  const [activeVisualization, setActiveVisualization] = useState("summary");

  // Aggregation types
  const AGGREGATION_TYPES = {
    billing_provider: { label: "By Billing Provider", icon: Users },
    performing_provider: { label: "By Performing Provider", icon: Activity },
    service_line: { label: "By Service Line", icon: BarChart3 },
    temporal: { label: "By Time Period", icon: Calendar }
  };

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
        const response = await fetch(apiUrl('/api/claims-data'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npis: npis.map(n => n.npi),
            tableName,
            aggregation,
            filters,
            originalAggregation: 'billing_provider',
            limit: 100
          })
        });

        if (!response.ok) throw new Error('Failed to fetch claims data');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch claims data');
        
        setClaimsData(result.data || []);
        setClaimsSummary(result.summary || null);
      } catch (err) {
        console.error('Error fetching claims data:', err);
        setClaimsError(err.message);
      } finally {
        setClaimsLoading(false);
      }
    }

    fetchClaimsData();
  }, [npis, tableName, aggregation, filters]);

  // Drill-down functions
  const handleRowClick = (row) => {
    const drillDownStep = createDrillDownStep(row);
    if (drillDownStep) {
      setDrillDownHistory(prev => [...prev, drillDownStep]);
      setIsDrilledDown(true);
      applyDrillDownFilter(drillDownStep);
    }
  };

  const createDrillDownStep = (row) => {
    switch (aggregation) {
      case "billing_provider":
        return {
          type: "provider",
          value: row.npi,
          label: `${row.provider_name} (${row.npi})`,
          filter: { providerNpi: row.npi }
        };
      case "performing_provider":
        return {
          type: "provider",
          value: row.npi,
          label: `${row.provider_name} (${row.npi})`,
          filter: { performingProviderNpi: row.npi }
        };
      case "service_line":
        return {
          type: "service_line",
          value: row.service_line_code,
          label: `${row.service_line_description} (${row.service_line_code})`,
          filter: { serviceLine: row.service_line_code }
        };
      case "temporal":
        return {
          type: "temporal",
          value: row.date_string,
          label: `Month: ${row.date_string}`,
          filter: { dateMonth: row.date_string }
        };
      default:
        return null;
    }
  };

  const applyDrillDownFilter = (step) => {
    setFilters(prev => ({
      ...prev,
      ...step.filter
    }));
    
    const nextAggregation = getNextAggregation(step.type);
    if (nextAggregation) {
      setAggregation(nextAggregation);
    }
  };

  const getNextAggregation = (currentType) => {
    switch (currentType) {
      case "provider":
        return "service_line";
      case "service_line":
        return "temporal";
      default:
        return null;
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      // Reset to initial state
      setDrillDownHistory([]);
      setIsDrilledDown(false);
      setFilters({});
      setAggregation("billing_provider");
    } else {
      // Go back to a specific drill level
      const newHistory = drillDownHistory.slice(0, index + 1);
      setDrillDownHistory(newHistory);
      
      // Rebuild filters from history
      const newFilters = {};
      newHistory.forEach(step => {
        Object.assign(newFilters, step.filter);
      });
      setFilters(newFilters);
      
      // Set appropriate aggregation
      const lastStep = newHistory[newHistory.length - 1];
      const nextAgg = getNextAggregation(lastStep.type);
      if (nextAgg) {
        setAggregation(nextAgg);
      }
    }
  };

  const handleSeeMarketAnalysis = () => {
    navigate(`/app/${provider.dhc}/market/claims`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner />
          <p>Loading provider data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error loading provider data: {error}</p>
        </div>
      </div>
    );
  }

  if (!npis || npis.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>No NPIs found for this provider. Claims data is not available.</p>
        </div>
      </div>
    );
  }

  const AggregationIcon = AGGREGATION_TYPES[aggregation]?.icon || BarChart3;

  return (
    <div className={styles.container}>
      {/* Market Analysis CTA */}
      <div className={styles.marketCta}>
        <div className={styles.marketCtaContent}>
          <p>Want to see how this provider compares to the market?</p>
          <button onClick={handleSeeMarketAnalysis} className={styles.marketCtaButton}>
            <span>View Market Analysis</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Header with aggregation selector */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <AggregationIcon size={20} />
          <h2>{AGGREGATION_TYPES[aggregation]?.label || 'Claims Data'}</h2>
        </div>
        
        <div className={styles.headerRight}>
          <select 
            value={aggregation}
            onChange={(e) => {
              setAggregation(e.target.value);
              setDrillDownHistory([]);
              setIsDrilledDown(false);
              setFilters({});
            }}
            className={styles.aggregationSelect}
          >
            {Object.entries(AGGREGATION_TYPES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Breadcrumb navigation for drill-downs */}
      {isDrilledDown && drillDownHistory.length > 0 && (
        <div className={styles.breadcrumb}>
          <button onClick={() => handleBreadcrumbClick(-1)} className={styles.breadcrumbItem}>
            All Data
          </button>
          {drillDownHistory.map((step, index) => (
            <span key={index}>
              <span className={styles.breadcrumbSeparator}>/</span>
              <button 
                onClick={() => handleBreadcrumbClick(index)}
                className={styles.breadcrumbItem}
              >
                {step.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Summary cards */}
      {activeVisualization === "summary" && claimsSummary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Claims</div>
            <div className={styles.summaryValue}>{claimsSummary.totalClaims?.toLocaleString() || '0'}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Amount</div>
            <div className={styles.summaryValue}>{formatCurrency(claimsSummary.totalAmount)}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Unique Services</div>
            <div className={styles.summaryValue}>{claimsSummary.uniqueServices?.toLocaleString() || '0'}</div>
          </div>
        </div>
      )}

      {/* Data table */}
      {claimsLoading ? (
        <div className={styles.loading}>
          <Spinner />
          <p>Loading claims data...</p>
        </div>
      ) : claimsError ? (
        <div className={styles.error}>
          <p>Error loading claims data: {claimsError}</p>
        </div>
      ) : claimsData && claimsData.length > 0 ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {aggregation === "billing_provider" && (
                  <>
                    <th>Provider Name</th>
                    <th>NPI</th>
                    <th>Claims</th>
                    <th>Amount</th>
                  </>
                )}
                {aggregation === "performing_provider" && (
                  <>
                    <th>Provider Name</th>
                    <th>NPI</th>
                    <th>Claims</th>
                    <th>Amount</th>
                  </>
                )}
                {aggregation === "service_line" && (
                  <>
                    <th>Service Line</th>
                    <th>Code</th>
                    <th>Claims</th>
                    <th>Amount</th>
                  </>
                )}
                {aggregation === "temporal" && (
                  <>
                    <th>Period</th>
                    <th>Claims</th>
                    <th>Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {claimsData.map((row, index) => (
                <tr key={index} onClick={() => handleRowClick(row)} className={styles.clickableRow}>
                  {aggregation === "billing_provider" && (
                    <>
                      <td>{row.provider_name || 'Unknown'}</td>
                      <td>{row.npi}</td>
                      <td>{row.total_claims?.toLocaleString() || '0'}</td>
                      <td>{formatCurrency(row.total_amount)}</td>
                    </>
                  )}
                  {aggregation === "performing_provider" && (
                    <>
                      <td>{row.provider_name || 'Unknown'}</td>
                      <td>{row.npi}</td>
                      <td>{row.total_claims?.toLocaleString() || '0'}</td>
                      <td>{formatCurrency(row.total_amount)}</td>
                    </>
                  )}
                  {aggregation === "service_line" && (
                    <>
                      <td>{row.service_line_description || 'Unknown'}</td>
                      <td>{row.service_line_code}</td>
                      <td>{row.total_claims?.toLocaleString() || '0'}</td>
                      <td>{formatCurrency(row.total_amount)}</td>
                    </>
                  )}
                  {aggregation === "temporal" && (
                    <>
                      <td>{row.date_string}</td>
                      <td>{row.total_claims?.toLocaleString() || '0'}</td>
                      <td>{formatCurrency(row.total_amount)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.noData}>
          <p>No claims data available for the selected filters.</p>
        </div>
      )}
    </div>
  );
}

