import { useState, useEffect, useMemo } from "react";
import styles from "./ClaimsTab.module.css";
import Spinner from "../../../../components/Buttons/Spinner";
import { apiUrl } from '../../../../utils/api';
import { ChevronDown, Filter, BarChart3, Users, MapPin, Calendar, Activity } from "lucide-react";

// Cache for NPIs to avoid redundant API calls
const npiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to format currency values
function formatCurrency(value) {
  if (value == null || value === undefined) return '$0.00';
  
  // Handle BigQuery Big objects
  let numValue;
  if (typeof value === 'object' && value.constructor && value.constructor.name === 'Big') {
    numValue = parseFloat(value.toString());
  } else {
    numValue = parseFloat(value);
  }
  
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

function getCacheKey(providerDhcs) {
  return providerDhcs.sort().join(',');
}

function getCachedNPIs(providerDhcs) {
  const key = getCacheKey(providerDhcs);
  const cached = npiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.npis;
  }
  return null;
}

function setCachedNPIs(providerDhcs, npis) {
  const key = getCacheKey(providerDhcs);
  npiCache.set(key, {
    npis,
    timestamp: Date.now()
  });
}

export default function ClaimsTab({ provider, radiusInMiles, nearbyProviders }) {
  // Core state
  const [cachedNPIs, setCachedNPIs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Claims data state
  const [claimsData, setClaimsData] = useState(null);
  const [claimsSummary, setClaimsSummary] = useState(null);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);
  
  // Filter state
  const [tableName, setTableName] = useState("volume_diagnosis");
  const [perspective, setPerspective] = useState("billing");
  const [aggregation, setAggregation] = useState("provider");
  const [filters, setFilters] = useState({});
  
  // Drill-down state
  const [drillDownHistory, setDrillDownHistory] = useState([]);
  const [isDrilledDown, setIsDrilledDown] = useState(false);
  
  // Available options state
  const [availableTables, setAvailableTables] = useState([]);
  const [availableFilters, setAvailableFilters] = useState({});
  const [metadataLoading, setMetadataLoading] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState("summary");

  // Available tables mapping - Simplified to only volume tables
  const AVAILABLE_TABLES = {
    volume_diagnosis: { label: "Diagnosis Volume", type: "Commercial" },
    volume_procedure: { label: "Procedure Volume", type: "Commercial" }
  };

  // Provider perspectives - Simplified to only supported perspectives
  const PROVIDER_PERSPECTIVES = {
    billing: { label: "Billing Provider", icon: Users },
    performing: { label: "Performing Provider", icon: Activity }
  };

  // Aggregation types
  const AGGREGATION_TYPES = {
    provider: { label: "By Provider", icon: Users },
    service_line: { label: "By Service Line", icon: BarChart3 },
    temporal: { label: "By Time Period", icon: Calendar },
    geographic: { label: "By Geography", icon: MapPin }
  };

  // Fetch NPIs once and cache them
  useEffect(() => {
    async function fetchNPIs() {
      if (!provider?.dhc || !nearbyProviders) return;

      const allProviderDhcs = [provider.dhc, ...nearbyProviders.map(p => p.dhc)]
        .filter(Boolean)
        .filter(dhc => !isNaN(parseInt(dhc)));

      if (allProviderDhcs.length === 0) {
        setError("No valid provider DHCs found in this market");
        return;
      }

      // Check cache first
      const cached = getCachedNPIs(allProviderDhcs);
      if (cached) {
        setCachedNPIs(cached);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 Getting NPIs for ${allProviderDhcs.length} providers in ${radiusInMiles}mi radius`);
        
        const npisResponse = await fetch(apiUrl("/api/related-npis"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dhc_ids: allProviderDhcs })
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

        // Cache the NPIs
        setCachedNPIs(allProviderDhcs, npis);
        setCachedNPIs(npis);
        console.log(`✅ Cached ${npis.length} NPIs for reuse across tabs`);

      } catch (err) {
        console.error("❌ Error fetching NPIs:", err);
        setError(`Failed to fetch NPIs: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchNPIs();
  }, [provider?.dhc, nearbyProviders, radiusInMiles]);

  // Fetch available filters when NPIs are available
  useEffect(() => {
    if (!cachedNPIs || cachedNPIs.length === 0) return;

    async function fetchAvailableFilters() {
      setMetadataLoading(true);
      try {
        const response = await fetch(apiUrl("/api/claims-filters"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            npis: cachedNPIs,
            tableName,
            perspective
          })
        });

        const result = await response.json();
        if (result.success) {
          setAvailableFilters(result.data);
        } else {
          console.error("Failed to fetch available filters:", result);
        }
      } catch (err) {
        console.error("Error fetching available filters:", err);
      } finally {
        setMetadataLoading(false);
      }
    }

    fetchAvailableFilters();
  }, [cachedNPIs, tableName, perspective]);

  // Fetch claims data when filters change
  useEffect(() => {
    if (!cachedNPIs || cachedNPIs.length === 0) return;

    async function fetchClaimsData() {
      setClaimsLoading(true);
      setClaimsError(null);

      try {
        const response = await fetch(apiUrl("/api/claims-data"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            npis: cachedNPIs,
            tableName,
            perspective,
            aggregation,
            filters,
            limit: 100
          })
        });

        const result = await response.json();
        if (result.success) {
          setClaimsData(result.data);
          setClaimsSummary(result.summary);
        } else {
          setClaimsError(result.message || "Failed to fetch claims data");
          setClaimsSummary(null);
        }
      } catch (err) {
        console.error("Error fetching claims data:", err);
        setClaimsError(`Failed to fetch claims data: ${err.message}`);
      } finally {
        setClaimsLoading(false);
      }
    }

    fetchClaimsData();
  }, [cachedNPIs, tableName, perspective, aggregation, filters]);

  // Update filters when table or perspective changes
  useEffect(() => {
    setFilters({});
  }, [tableName, perspective]);

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
      case "provider":
        return {
          type: "provider",
          value: row.npi,
          label: `${row.provider_name} (${row.npi})`,
          filter: { providerNpi: row.npi }
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
      case "geographic":
        return {
          type: "geographic",
          value: row.state,
          label: `${row.state}, ${row.county}`,
          filter: { state: row.state, county: row.county }
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
    
    // Auto-select appropriate aggregation for drill-down
    const nextAggregation = getNextAggregation(step.type);
    if (nextAggregation) {
      setAggregation(nextAggregation);
    }
  };

  const getNextAggregation = (currentType) => {
    const aggregationFlow = {
      "provider": "service_line",
      "service_line": "temporal", 
      "temporal": "geographic",
      "geographic": "provider"
    };
    return aggregationFlow[currentType];
  };

  const clearDrillDown = () => {
    setDrillDownHistory([]);
    setIsDrilledDown(false);
    setFilters({});
  };

  const drillDownToStep = (stepIndex) => {
    const newHistory = drillDownHistory.slice(0, stepIndex + 1);
    setDrillDownHistory(newHistory);
    setIsDrilledDown(true);
    
    // Apply all filters up to this step
    const combinedFilters = newHistory.reduce((acc, step) => ({
      ...acc,
      ...step.filter
    }), {});
    setFilters(combinedFilters);
  };

  // Loading state
  if (loading) {
    return <Spinner message="Loading provider NPIs..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Claims Data</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!cachedNPIs || cachedNPIs.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <h3>No Claims Data Available</h3>
        <p>No NPIs found for providers in this market area.</p>
      </div>
    );
  }

  return (
    <div className={styles.claimsContainer}>
      {/* Header with summary */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Claims Analysis</h2>
          <p className={styles.subtitle}>
            Analyzing {cachedNPIs.length} providers in {radiusInMiles}mi radius
          </p>
        </div>
        <div className={styles.headerRight}>
            <button
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={showFilters ? styles.rotated : ''} />
            </button>
          </div>
        </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterSection}>
            <h4>Data Source</h4>
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <label>Table</label>
                <select
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className={styles.select}
                >
                  {Object.entries(AVAILABLE_TABLES).map(([key, value]) => (
                    <optgroup key={key} label={value.type}>
                      <option value={key}>{value.label}</option>
                    </optgroup>
                  ))}
                </select>
          </div>

              <div className={styles.filterGroup}>
                <label>Provider Perspective</label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value)}
                  className={styles.select}
                >
                  {Object.entries(PROVIDER_PERSPECTIVES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
        </div>

              <div className={styles.filterGroup}>
                <label>Aggregation</label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className={styles.select}
                >
                  {Object.entries(AGGREGATION_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
        </div>
      </div>

          {/* Dynamic filters based on available data */}
          {Object.keys(availableFilters).length > 0 && (
            <>
              {/* Service Hierarchy */}
              {(availableFilters.serviceCategories?.length > 0 || availableFilters.serviceLines?.length > 0 || availableFilters.subServiceLines?.length > 0) && (
                <div className={styles.filterSection}>
                  <h4>Service Hierarchy</h4>
                  <div className={styles.filterGrid}>
                    {availableFilters.serviceCategories && availableFilters.serviceCategories.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Service Category</label>
                        <select
                          value={filters.serviceCategory || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            serviceCategory: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Service Categories</option>
                          {availableFilters.serviceCategories?.map((category, index) => (
                            <option key={`${category.code}-${index}`} value={category.code}>
                              {category.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.serviceLines && availableFilters.serviceLines.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Service Line</label>
                        <select
                          value={filters.serviceLine || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            serviceLine: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Service Lines</option>
                          {availableFilters.serviceLines.map((serviceLine, index) => (
                            <option key={`${serviceLine.code}-${index}`} value={serviceLine.code}>
                              {serviceLine.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.subServiceLines && availableFilters.subServiceLines.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Sub-Service Line</label>
                        <select
                          value={filters.subServiceLine || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            subServiceLine: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Sub-Service Lines</option>
                          {availableFilters.subServiceLines.map((subService, index) => (
                            <option key={`${subService.code}-${index}`} value={subService.code}>
                              {subService.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Care Settings */}
              {(availableFilters.placeOfService?.length > 0 || availableFilters.siteOfCare?.length > 0 || availableFilters.billFacilityType?.length > 0 || availableFilters.billClassificationType?.length > 0) && (
                <div className={styles.filterSection}>
                  <h4>Care Settings</h4>
                  <div className={styles.filterGrid}>
                    {availableFilters.placeOfService && availableFilters.placeOfService.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Place of Service</label>
                        <select
                          value={filters.placeOfService || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            placeOfService: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Places of Service</option>
                          {availableFilters.placeOfService.map((pos, index) => (
                            <option key={`${pos.code}-${index}`} value={pos.code}>
                              {pos.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.siteOfCare && availableFilters.siteOfCare.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Site of Care</label>
                        <select
                          value={filters.siteOfCare || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            siteOfCare: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Sites of Care</option>
                          {availableFilters.siteOfCare.map((site, index) => (
                            <option key={`${site.code}-${index}`} value={site.code}>
                              {site.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.billFacilityType && availableFilters.billFacilityType.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Bill Facility Type</label>
                        <select
                          value={filters.billFacilityType || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            billFacilityType: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Facility Types</option>
                          {availableFilters.billFacilityType.map((facility, index) => (
                            <option key={`${facility.code}-${index}`} value={facility.code}>
                              {facility.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.billClassificationType && availableFilters.billClassificationType.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Bill Classification Type</label>
                        <select
                          value={filters.billClassificationType || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            billClassificationType: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Classification Types</option>
                          {availableFilters.billClassificationType.map((classification, index) => (
                            <option key={`${classification.code}-${index}`} value={classification.code}>
                              {classification.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Demographics */}
              {(availableFilters.patientGenders?.length > 0 || availableFilters.patientAgeBrackets?.length > 0) && (
                <div className={styles.filterSection}>
                  <h4>Patient Demographics</h4>
                  <div className={styles.filterGrid}>
                    {availableFilters.patientGenders && availableFilters.patientGenders.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Patient Gender</label>
                        <select
                          value={filters.patientGender || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            patientGender: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Genders</option>
                          {availableFilters.patientGenders.map(gender => (
                            <option key={gender} value={gender}>
                              {gender}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.patientAgeBrackets && availableFilters.patientAgeBrackets.length > 0 && (
                      <div className={styles.filterGroup}>
                        <label>Patient Age Bracket</label>
                        <select
                          value={filters.patientAgeBracket || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            patientAgeBracket: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                          <option value="">All Age Brackets</option>
                          {availableFilters.patientAgeBrackets.map(ageBracket => (
                            <option key={ageBracket} value={ageBracket}>
                              {ageBracket}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payor Information */}
              {availableFilters.payorGroups && availableFilters.payorGroups.length > 0 && (
                <div className={styles.filterSection}>
                  <h4>Payor Information</h4>
                  <div className={styles.filterGrid}>
                    <div className={styles.filterGroup}>
                      <label>Payor Group</label>
                      <select
                        value={filters.payorGroup || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          payorGroup: e.target.value || undefined
                        }))}
                        className={styles.select}
                      >
                        <option value="">All Payor Groups</option>
                        {availableFilters.payorGroups.map(payorGroup => (
                          <option key={payorGroup} value={payorGroup}>
                            {payorGroup}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Drill-down breadcrumb */}
          {isDrilledDown && drillDownHistory.length > 0 && (
            <div className={styles.drillDownBreadcrumb}>
              <h4>Drill-down Path</h4>
              <div className={styles.breadcrumbPath}>
                <button 
                  className={styles.breadcrumbItem}
                  onClick={() => clearDrillDown()}
                >
                  All Data
                </button>
                {drillDownHistory.map((step, index) => (
                  <div key={index} className={styles.breadcrumbStep}>
                    <span className={styles.breadcrumbArrow}>→</span>
                    <button 
                      className={styles.breadcrumbItem}
                      onClick={() => drillDownToStep(index)}
                    >
                      {step.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Loading State */}
      {claimsLoading && (
        <div className={styles.loadingContainer}>
          <Spinner message={`Loading ${aggregation} data for ${AVAILABLE_TABLES[tableName]?.label} from ${PROVIDER_PERSPECTIVES[perspective]?.label} perspective...`} />
        </div>
      )}

      {/* Error State */}
      {claimsError && (
        <div className={styles.errorContainer}>
          <h3>Error Loading Claims Data</h3>
          <p>{claimsError}</p>
        </div>
      )}

      {/* Data Display */}
      {claimsData && !claimsLoading && !claimsError && (
        <div className={styles.dataContainer}>
          {/* Summary Stats */}
          <div className={styles.summaryStats}>
            <div className={styles.statCard}>
              <h4>Total Claims</h4>
              <p>{claimsSummary ? claimsSummary.grand_total_claims?.toLocaleString() : claimsData.reduce((sum, item) => sum + (item.total_claims || item.count || 0), 0).toLocaleString()}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Total Charges</h4>
              <p>{claimsSummary ? formatCurrency(claimsSummary.grand_total_charges) : formatCurrency(claimsData.reduce((sum, item) => sum + (item.total_charges || 0), 0))}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Unique Providers</h4>
              <p>{claimsSummary ? claimsSummary.total_unique_providers : new Set(claimsData.map(item => item.npi || item.unique_providers).filter(Boolean)).size}</p>
            </div>
            <div className={styles.statCard}>
              <h4>Records Displayed</h4>
              <p>{claimsSummary ? `${claimsSummary.displayed_records} of ${claimsSummary.total_unique_providers}` : claimsData.length}</p>
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.dataTable}>
            <h3>Claims Data</h3>
            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    {aggregation === "provider" && (
                      <>
                        <th>Provider</th>
                        <th>Specialty</th>
                        <th>Location</th>
                        <th>Total Claims</th>
                        <th>Total Charges</th>
                        <th>Avg Monthly</th>
                      </>
                    )}
                    {aggregation === "service_line" && (
                      <>
                        <th>Service Line</th>
                        <th>Total Claims</th>
                        <th>Total Charges</th>
                        <th>Unique Providers</th>
                      </>
                    )}
                    {aggregation === "temporal" && (
                      <>
                        <th>Month</th>
                        <th>Total Claims</th>
                        <th>Total Charges</th>
                        <th>Unique Providers</th>
                      </>
                    )}
                    {aggregation === "geographic" && (
                      <>
                        <th>State</th>
                        <th>County</th>
                        <th>CBSA</th>
                        <th>Total Claims</th>
                        <th>Total Charges</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {claimsData.slice(0, 20).map((row, index) => (
                    <tr 
                      key={index} 
                      className={styles.clickableRow}
                      onClick={() => handleRowClick(row)}
                      title="Click to drill down"
                    >
                      {aggregation === "provider" && (
                        <>
                          <td>
                            <div>
                              <strong>{row.provider_name || 'Unknown'}</strong>
                              <small>{row.npi}</small>
                            </div>
                          </td>
                          <td>{row.taxonomy_classification || 'Unknown'}</td>
                          <td>{row.city}, {row.state}</td>
                          <td>{row.total_claims?.toLocaleString()}</td>
                          <td>{formatCurrency(row.total_charges)}</td>
                          <td>{row.avg_monthly_claims?.toLocaleString()}</td>
                        </>
                      )}
                      {aggregation === "service_line" && (
                        <>
                          <td>{row.service_line_description || row.service_line_code}</td>
                          <td>{row.total_claims?.toLocaleString()}</td>
                          <td>{formatCurrency(row.total_charges)}</td>
                          <td>{row.unique_providers}</td>
                        </>
                      )}
                      {aggregation === "temporal" && (
                        <>
                          <td>{row.date_string}</td>
                          <td>{row.total_claims?.toLocaleString()}</td>
                          <td>{formatCurrency(row.total_charges)}</td>
                          <td>{row.unique_providers}</td>
                        </>
                      )}
                      {aggregation === "geographic" && (
                        <>
                          <td>{row.state}</td>
                          <td>{row.county}</td>
                          <td>{row.cbsa_name}</td>
                          <td>{row.total_claims?.toLocaleString()}</td>
                          <td>{formatCurrency(row.total_charges)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {claimsData.length > 20 && (
              <p className={styles.tableNote}>
                Showing first 20 of {claimsData.length} records
              </p>
            )}
          </div>
        </div>
        )}
      </div>
  );
} 