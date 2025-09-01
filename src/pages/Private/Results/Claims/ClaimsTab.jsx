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

function setCachedNPIsInCache(providerDhcs, npis) {
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
  const [tableName, setTableName] = useState("volume_procedure");
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
        setCachedNPIsInCache(allProviderDhcs, npis);
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

             {/* Compact Filter Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
           <div className={styles.filterRow}>
             <div className={styles.filterItem}>
               <label>Data Source:</label>
                <select
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className={styles.select}
                >
                  {Object.entries(AVAILABLE_TABLES).map(([key, value]) => (
                   <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
          </div>

             <div className={styles.filterItem}>
               <label>Perspective:</label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value)}
                  className={styles.select}
                >
                  {Object.entries(PROVIDER_PERSPECTIVES).map(([key, value]) => (
                   <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
        </div>
      </div>

                     {/* Compact Dynamic Filters */}
          {Object.keys(availableFilters).length > 0 && (
            <>
               {/* Service Hierarchy Filters */}
               <div className={styles.filterRow}>
                    {availableFilters.serviceCategories && availableFilters.serviceCategories.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Service Category:</label>
                        <select
                          value={filters.serviceCategory || ''}
                          onChange={(e) => {
                            const selectedCategory = e.target.value;
                            setFilters(prev => ({
                              ...prev,
                              serviceCategory: selectedCategory || undefined,
                              // Clear dependent filters when parent changes
                              serviceLine: undefined,
                              subServiceLine: undefined,
                              code: undefined
                            }));
                          }}
                          className={styles.select}
                        >
                       <option value="">All Service Categories</option>
                       {availableFilters.serviceCategories.map((category, index) => (
                            <option key={`${category.code}-${index}`} value={category.code}>
                              {category.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.serviceLines && availableFilters.serviceLines.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Service Line:</label>
                        <select
                          value={filters.serviceLine || ''}
                          onChange={(e) => {
                            const selectedServiceLine = e.target.value;
                            setFilters(prev => ({
                              ...prev,
                              serviceLine: selectedServiceLine || undefined,
                              // Clear dependent filters when parent changes
                              subServiceLine: undefined,
                              code: undefined
                            }));
                          }}
                          className={styles.select}
                          disabled={!filters.serviceCategory}
                        >
                       <option value="">
                         {filters.serviceCategory ? 'All Service Lines' : 'Select Service Category First'}
                       </option>
                       {availableFilters.serviceLines
                         .filter(line => !filters.serviceCategory || line.parentCode === filters.serviceCategory)
                         .map((serviceLine, index) => (
                            <option key={`${serviceLine.code}-${index}`} value={serviceLine.code}>
                              {serviceLine.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.subServiceLines && availableFilters.subServiceLines.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Sub-Service Line:</label>
                        <select
                          value={filters.subServiceLine || ''}
                          onChange={(e) => {
                            const selectedSubServiceLine = e.target.value;
                            setFilters(prev => ({
                              ...prev,
                              subServiceLine: selectedSubServiceLine || undefined,
                              // Clear dependent filters when parent changes
                              code: undefined
                            }));
                          }}
                          className={styles.select}
                          disabled={!filters.serviceLine}
                        >
                       <option value="">
                         {filters.serviceLine ? 'All Sub-Service Lines' : 'Select Service Line First'}
                       </option>
                       {availableFilters.subServiceLines
                         .filter(subServiceLine => 
                           (!filters.serviceCategory || subServiceLine.grandparentCode === filters.serviceCategory) &&
                           (!filters.serviceLine || subServiceLine.parentCode === filters.serviceLine)
                         )
                         .map((subServiceLine, index) => (
                         <option key={`${subServiceLine.code}-${index}`} value={subServiceLine.code}>
                           {subServiceLine.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.codes && availableFilters.codes.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Procedure/Diagnosis Code:</label>
                        <select
                          value={filters.code || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            code: e.target.value || undefined
                          }))}
                          className={styles.select}
                          disabled={!filters.subServiceLine}
                        >
                       <option value="">
                         {filters.subServiceLine ? 'All Codes' : 'Select Sub-Service Line First'}
                       </option>
                       {availableFilters.codes
                         .filter(code => 
                           (!filters.serviceCategory || code.level1Code === filters.serviceCategory) &&
                           (!filters.serviceLine || code.level2Code === filters.serviceLine) &&
                           (!filters.subServiceLine || code.level3Code === filters.subServiceLine)
                         )
                         .slice(0, 1000) // Limit to first 1000 for performance
                         .map((code, index) => (
                           <option key={`${code.code}-${index}`} value={code.code}>
                             {code.description}
                           </option>
                         ))}
                        </select>
                      </div>
                    )}
                  </div>

               {/* Payor and Facility Filters */}
               <div className={styles.filterRow}>
                 {availableFilters.payorGroups && availableFilters.payorGroups.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Payor:</label>
                     <select
                       value={filters.payorGroup || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         payorGroup: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.payorGroups.map(payorGroup => (
                         <option key={payorGroup} value={payorGroup}>
                           {payorGroup}
                         </option>
                       ))}
                     </select>
                </div>
              )}

                    {availableFilters.placeOfService && availableFilters.placeOfService.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Place of Service:</label>
                        <select
                          value={filters.placeOfService || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            placeOfService: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                       <option value="">All</option>
                          {availableFilters.placeOfService.map((pos, index) => (
                            <option key={`${pos.code}-${index}`} value={pos.code}>
                              {pos.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.siteOfCare && availableFilters.siteOfCare.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Site of Care:</label>
                        <select
                          value={filters.siteOfCare || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            siteOfCare: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                       <option value="">All</option>
                          {availableFilters.siteOfCare.map((site, index) => (
                            <option key={`${site.code}-${index}`} value={site.code}>
                              {site.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
               </div>

               {/* Billing and Patient Filters */}
               <div className={styles.filterRow}>
                    {availableFilters.billFacilityType && availableFilters.billFacilityType.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Bill Facility Type:</label>
                        <select
                          value={filters.billFacilityType || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            billFacilityType: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                       <option value="">All</option>
                          {availableFilters.billFacilityType.map((facility, index) => (
                            <option key={`${facility.code}-${index}`} value={facility.code}>
                              {facility.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.billClassificationType && availableFilters.billClassificationType.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Bill Classification:</label>
                        <select
                       value={filters.billClassificationDescription ? `${filters.billClassificationType}|${filters.billClassificationDescription}` : (filters.billClassificationType || '')}
                       onChange={(e) => {
                         const selectedValue = e.target.value;
                         console.log('Bill Classification selected:', selectedValue);
                         
                         if (selectedValue === '') {
                           setFilters(prev => ({
                             ...prev,
                             billClassificationType: undefined,
                             billClassificationDescription: undefined
                           }));
                           return;
                         }
                         
                         // Parse the combined value (code|description)
                         const [code, description] = selectedValue.split('|');
                         
                         if (code && description) {
                           console.log('Selected classification:', { code, description });
                           setFilters(prev => ({
                             ...prev,
                             billClassificationType: code,
                             billClassificationDescription: description
                           }));
                         } else {
                           // Fallback for backward compatibility
                           const selectedClassification = availableFilters.billClassificationType.find(
                             c => c.code === selectedValue
                           );
                           
                           if (selectedClassification) {
                             console.log('Selected classification (fallback):', selectedClassification);
                             setFilters(prev => ({
                               ...prev,
                               billClassificationType: selectedValue,
                               billClassificationDescription: selectedClassification.description
                             }));
                           } else {
                             setFilters(prev => ({
                               ...prev,
                               billClassificationType: selectedValue || undefined,
                               billClassificationDescription: undefined
                             }));
                           }
                         }
                       }}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.billClassificationType.map((classification, index) => {
                         const optionValue = `${classification.code}|${classification.description}`;
                         const isSelected = filters.billClassificationDescription === classification.description;
                         if (isSelected) {
                           console.log('Selected classification:', classification);
                         }
                         return (
                           <option key={`${classification.code}-${classification.description}-${index}`} value={optionValue}>
                             {classification.description}
                           </option>
                         );
                       })}
                     </select>
                   </div>
                 )}

                 {availableFilters.billFrequencyTypes && availableFilters.billFrequencyTypes.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Bill Frequency:</label>
                     <select
                       value={filters.billFrequencyType || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                         billFrequencyType: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                       <option value="">All</option>
                       {availableFilters.billFrequencyTypes.map((frequency, index) => (
                         <option key={`${frequency.code}-${index}`} value={frequency.code}>
                           {frequency.description}
                            </option>
                          ))}
                        </select>
                </div>
              )}

                    {availableFilters.patientGenders && availableFilters.patientGenders.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Patient Gender:</label>
                        <select
                          value={filters.patientGender || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            patientGender: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                       <option value="">All</option>
                          {availableFilters.patientGenders.map(gender => (
                            <option key={gender} value={gender}>
                              {gender}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableFilters.patientAgeBrackets && availableFilters.patientAgeBrackets.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Patient Age:</label>
                        <select
                          value={filters.patientAgeBracket || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            patientAgeBracket: e.target.value || undefined
                          }))}
                          className={styles.select}
                        >
                       <option value="">All</option>
                          {availableFilters.patientAgeBrackets.map(ageBracket => (
                            <option key={ageBracket} value={ageBracket}>
                              {ageBracket}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

               {/* Patient Geographic Filters */}
               <div className={styles.filterRow}>
                 {availableFilters.patientUsRegions && availableFilters.patientUsRegions.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Patient US Region:</label>
                      <select
                       value={filters.patientUsRegion || ''}
                        onChange={(e) => {
                          const selectedRegion = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            patientUsRegion: selectedRegion || undefined,
                            // Clear dependent filters when parent changes
                            patientUsDivision: undefined,
                            patientState: undefined,
                            patientZip3: undefined
                          }));
                        }}
                        className={styles.select}
                      >
                       <option value="">All US Regions</option>
                       {availableFilters.patientUsRegions.map(region => (
                         <option key={region} value={region}>
                           {region}
                          </option>
                        ))}
                      </select>
                    </div>
                 )}

                 {availableFilters.patientUsDivisions && availableFilters.patientUsDivisions.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Patient US Division:</label>
                     <select
                       value={filters.patientUsDivision || ''}
                       onChange={(e) => {
                         const selectedDivision = e.target.value;
                         setFilters(prev => ({
                           ...prev,
                           patientUsDivision: selectedDivision || undefined,
                           // Clear dependent filters when parent changes
                           patientState: undefined,
                           patientZip3: undefined
                         }));
                       }}
                       className={styles.select}
                       disabled={!filters.patientUsRegion}
                     >
                       <option value="">
                         {filters.patientUsRegion ? 'All US Divisions' : 'Select US Region First'}
                       </option>
                       {availableFilters.patientUsDivisions
                         .filter(division => !filters.patientUsRegion || division.parentCode === filters.patientUsRegion)
                         .map((division, index) => (
                           <option key={`${division.code}-${index}`} value={division.code}>
                             {division.description}
                           </option>
                         ))}
                     </select>
                  </div>
                 )}

                 {availableFilters.patientStates && availableFilters.patientStates.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Patient State:</label>
                     <select
                       value={filters.patientState || ''}
                       onChange={(e) => {
                         const selectedState = e.target.value;
                         setFilters(prev => ({
                           ...prev,
                           patientState: selectedState || undefined,
                           // Clear dependent filters when parent changes
                           patientZip3: undefined
                         }));
                       }}
                       className={styles.select}
                       disabled={!filters.patientUsDivision}
                     >
                       <option value="">
                         {filters.patientUsDivision ? 'All States' : 'Select US Division First'}
                       </option>
                       {availableFilters.patientStates
                         .filter(state => 
                           (!filters.patientUsRegion || state.grandparentCode === filters.patientUsRegion) &&
                           (!filters.patientUsDivision || state.parentCode === filters.patientUsDivision)
                         )
                         .map((state, index) => (
                           <option key={`${state.code}-${index}`} value={state.code}>
                             {state.description}
                           </option>
                         ))}
                     </select>
                </div>
              )}

                 {availableFilters.patientZip3s && availableFilters.patientZip3s.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Patient ZIP3:</label>
                     <select
                       value={filters.patientZip3 || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         patientZip3: e.target.value || undefined
                       }))}
                       className={styles.select}
                       disabled={!filters.patientState}
                     >
                       <option value="">
                         {filters.patientState ? 'All ZIP3 Codes' : 'Select State First'}
                       </option>
                       {availableFilters.patientZip3s
                         .filter(zip3 => 
                           (!filters.patientUsRegion || zip3.level1Code === filters.patientUsRegion) &&
                           (!filters.patientUsDivision || zip3.level2Code === filters.patientUsDivision) &&
                           (!filters.patientState || zip3.level3Code === filters.patientState)
                         )
                         .slice(0, 500) // Limit to first 500 for performance
                         .map((zip3, index) => (
                           <option key={`${zip3.code}-${index}`} value={zip3.code}>
                             {zip3.description}
                           </option>
                         ))}
                     </select>
                </div>
              )}
               </div>

               {/* Claim and DRG Filters */}
               <div className={styles.filterRow}>
                 {availableFilters.claimTypes && availableFilters.claimTypes.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Claim Type:</label>
                     <select
                       value={filters.claimType || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         claimType: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.claimTypes.map((claimType, index) => (
                         <option key={`${claimType}-${index}`} value={claimType}>
                           {claimType}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {availableFilters.drgMdcs && availableFilters.drgMdcs.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>DRG MDC:</label>
                     <select
                       value={filters.drgMdc || ''}
                       onChange={(e) => {
                         const selectedMdc = e.target.value;
                         setFilters(prev => ({
                           ...prev,
                           drgMdc: selectedMdc || undefined,
                           // Clear dependent filters when parent changes
                           drgCode: undefined
                         }));
                       }}
                       className={styles.select}
                     >
                       <option value="">All DRG MDCs</option>
                       {availableFilters.drgMdcs.map((mdc, index) => (
                         <option key={`${mdc.code}-${index}`} value={mdc.code}>
                           {mdc.description}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {availableFilters.drgCodes && availableFilters.drgCodes.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>DRG Code:</label>
                     <select
                       value={filters.drgCode || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         drgCode: e.target.value || undefined
                       }))}
                       className={styles.select}
                       disabled={!filters.drgMdc}
                     >
                       <option value="">
                         {filters.drgMdc ? 'All DRG Codes' : 'Select DRG MDC First'}
                       </option>
                       {availableFilters.drgCodes
                         .filter(drg => !filters.drgMdc || drg.parentCode === filters.drgMdc)
                         .map((drg, index) => (
                           <option key={`${drg.code}-${index}`} value={drg.code}>
                             {drg.description}
                           </option>
                         ))}
                     </select>
                   </div>
                 )}

                 {availableFilters.drgMedSurgs && availableFilters.drgMedSurgs.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>DRG Med/Surg:</label>
                     <select
                       value={filters.drgMedSurg || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         drgMedSurg: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.drgMedSurgs.map(medSurg => (
                         <option key={medSurg} value={medSurg}>
                           {medSurg}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}
               </div>

               {/* Procedure/Diagnosis Code Filters */}
               <div className={styles.filterRow}>
                 {availableFilters.codeSystems && availableFilters.codeSystems.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Code System:</label>
                     <select
                       value={filters.codeSystem || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         codeSystem: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.codeSystems.map((codeSystem, index) => (
                         <option key={`${codeSystem}-${index}`} value={codeSystem}>
                           {codeSystem}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}



                 {availableFilters.codeSummaries && availableFilters.codeSummaries.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Code Summary:</label>
                     <select
                       value={filters.codeSummary || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         codeSummary: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.codeSummaries.map((codeSummary, index) => (
                         <option key={`${codeSummary}-${index}`} value={codeSummary}>
                           {codeSummary}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {availableFilters.isSurgeries && availableFilters.isSurgeries.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Is Surgery:</label>
                     <select
                       value={filters.isSurgery !== undefined ? filters.isSurgery.toString() : ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         isSurgery: e.target.value === '' ? undefined : e.target.value === 'true'
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.isSurgeries.map(isSurgery => (
                         <option key={isSurgery.toString()} value={isSurgery.toString()}>
                           {isSurgery ? 'Yes' : 'No'}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}
               </div>

               {/* Revenue Code Filters */}
               <div className={styles.filterRow}>
                 {availableFilters.revenueCodes && availableFilters.revenueCodes.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Revenue Code:</label>
                     <select
                       value={filters.revenueCode || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         revenueCode: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.revenueCodes.map((revenue, index) => (
                         <option key={`${revenue.code}-${index}`} value={revenue.code}>
                           {revenue.description}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {availableFilters.revenueCodeGroups && availableFilters.revenueCodeGroups.length > 0 && (
                   <div className={styles.filterItem}>
                     <label>Revenue Code Group:</label>
                     <select
                       value={filters.revenueCodeGroup || ''}
                       onChange={(e) => setFilters(prev => ({
                         ...prev,
                         revenueCodeGroup: e.target.value || undefined
                       }))}
                       className={styles.select}
                     >
                       <option value="">All</option>
                       {availableFilters.revenueCodeGroups.map(group => (
                         <option key={group} value={group}>
                           {group}
                         </option>
                       ))}
                     </select>
                   </div>
                 )}
               </div>
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
               <h4>Total Procedures</h4>
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
             <div className={styles.tableHeader}>
            <h3>Claims Data</h3>
               <div className={styles.aggregationSelector}>
                 <label>View by:</label>
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