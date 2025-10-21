import { useState, useEffect, Fragment } from 'react';
import { Building, TrendingUp, Filter, Download, ChevronRight, ChevronDown, BarChart3, Calendar, MapPin } from 'lucide-react';
import styles from './ReferralPathways.module.css';
import { apiUrl } from '../../../utils/api';
import ReferralPathwaysMap from './ReferralPathwaysMap';

const ReferralPathways = () => {
  // State
  const [inboundNPI, setInboundNPI] = useState('1043205479'); // Default NPI
  const [metadata, setMetadata] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const groupByLevel = 'outbound_facility_provider_taxonomy_classification'; // Fixed to taxonomy classification
  const [leadUpPeriodMax, setLeadUpPeriodMax] = useState(3); // Default 3 days
  const [maxDistance, setMaxDistance] = useState(100); // Default 100 miles
  const [referralSources, setReferralSources] = useState([]);
  const [trends, setTrends] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedView, setExpandedView] = useState('table'); // 'table' or 'map' for drill-down
  const [facilityDetails, setFacilityDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sources'); // 'sources' or 'trends'
  const [inboundFacilityInfo, setInboundFacilityInfo] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch metadata on mount to get max_date
  useEffect(() => {
    fetchMetadata();
    fetchInboundFacilityLocation();
  }, []);

  // Fetch inbound facility location for map (optional - won't break if fails)
  const fetchInboundFacilityLocation = async () => {
    if (!inboundNPI) return;
    
    try {
      const response = await fetch(apiUrl(`/api/referral-pathways/facility-location/${inboundNPI}`));
      
      if (!response.ok) {
        console.log('Inbound facility location not available (optional)');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setInboundFacilityInfo({
          npi: inboundNPI,
          name: result.data.definitive_name,
          latitude: result.data.latitude,
          longitude: result.data.longitude
        });
      }
    } catch (err) {
      console.log('Inbound facility location fetch skipped (optional)');
    }
  };

  // Refetch inbound facility location when NPI changes
  useEffect(() => {
    fetchInboundFacilityLocation();
  }, [inboundNPI]);

  // Calculate date range once we have metadata
  useEffect(() => {
    if (metadata?.maxDate) {
      const maxDateValue = metadata.maxDate.value || metadata.maxDate;
      console.log('📅 Raw max_date from metadata:', maxDateValue);
      
      // Parse YYYY-MM-DD string directly to avoid timezone issues
      // The data is already in month-grain format (YYYY-MM-01)
      let maxDateStr = maxDateValue;
      if (typeof maxDateValue !== 'string') {
        maxDateStr = new Date(maxDateValue).toISOString().substring(0, 10);
      }
      
      // Extract year and month from YYYY-MM-DD
      const [year, month] = maxDateStr.split('-').map(Number);
      console.log('📅 Parsed year/month:', year, month);
      
      // Calculate 11 months back for a 12-month range
      let fromYear = year;
      let fromMonth = month - 11;
      
      // Handle year rollover
      while (fromMonth <= 0) {
        fromMonth += 12;
        fromYear -= 1;
      }
      
      console.log('📅 From year/month:', fromYear, fromMonth);
      
      // Format as YYYY-MM-01 for the queries (month grain)
      const fromDateStr = `${fromYear}-${String(fromMonth).padStart(2, '0')}-01`;
      const toDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      
      console.log('📅 Final date range:', fromDateStr, 'to', toDateStr);
      
      setDateRange({
        from: fromDateStr,
        to: toDateStr
      });
    }
  }, [metadata]);

  // Fetch metadata
  const fetchMetadata = async () => {
    try {
      const response = await fetch(apiUrl('/api/referral-pathways/metadata'));
      const result = await response.json();
      
      if (result.success) {
        setMetadata(result.data);
      } else {
        setError('Failed to fetch metadata');
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError('Failed to fetch metadata');
    }
  };

  // Fetch referral sources
  const fetchReferralSources = async () => {
    if (!inboundNPI || !dateRange.from || !dateRange.to) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/referral-pathways/referral-sources'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboundNPI,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          groupByField: groupByLevel,
          leadUpPeriodMax,
          filters,
          limit: 100
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setReferralSources(result.data);
        setExpandedRow(null); // Reset expanded rows
        setFacilityDetails({}); // Clear facility details
      } else {
        setError(result.message || 'Failed to fetch referral sources');
      }
    } catch (err) {
      console.error('Error fetching referral sources:', err);
      setError('Failed to fetch referral sources');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trends
  const fetchTrends = async () => {
    if (!inboundNPI || !dateRange.from || !dateRange.to) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/referral-pathways/trends'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboundNPI,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          leadUpPeriodMax,
          filters
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTrends(result.data);
      } else {
        setError(result.message || 'Failed to fetch trends');
      }
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError('Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  };

  // Fetch facility details for drill-down
  const fetchFacilityDetails = async (row) => {
    const cacheKey = JSON.stringify({
      groupByLevel,
      row: row[groupByLevel]
    });

    // Check if already fetched
    if (facilityDetails[cacheKey]) {
      return;
    }

    setLoading(true);

    try {
      const filterParams = {};
      
      // Add appropriate filter based on current grouping level
      if (groupByLevel === 'outbound_facility_provider_taxonomy_classification') {
        filterParams.taxonomyClassification = row.outbound_facility_provider_taxonomy_classification;
      } else if (groupByLevel === 'outbound_facility_provider_taxonomy_specialization') {
        filterParams.taxonomySpecialization = row.outbound_facility_provider_taxonomy_specialization;
      } else if (groupByLevel === 'outbound_facility_provider_state') {
        filterParams.state = row.outbound_facility_provider_state;
      } else if (groupByLevel === 'outbound_facility_provider_county') {
        filterParams.county = row.outbound_facility_provider_county;
      }

      const response = await fetch(apiUrl('/api/referral-pathways/facility-details'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboundNPI,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          leadUpPeriodMax,
          ...filterParams,
          limit: 50
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Fetched ${result.data.length} facility details for drill-down`);
        console.log('Sample facility:', result.data[0]);
        
        // Calculate distances and filter
        let facilitiesWithDistance = result.data.map(facility => {
          const distance = inboundFacilityInfo?.latitude && facility.latitude
            ? calculateDistance(
                inboundFacilityInfo.latitude,
                inboundFacilityInfo.longitude,
                facility.latitude,
                facility.longitude
              )
            : null;
          
          return {
            ...facility,
            distance: distance ? Math.round(distance * 10) / 10 : null // One decimal place
          };
        });

        // Filter by max distance
        facilitiesWithDistance = facilitiesWithDistance.filter(f => 
          f.distance === null || f.distance <= maxDistance
        );

        // Sort by distance (closest first), then by referrals
        facilitiesWithDistance.sort((a, b) => {
          if (a.distance === null && b.distance === null) return (b.total_referrals || 0) - (a.total_referrals || 0);
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        console.log(`✅ After distance filter: ${facilitiesWithDistance.length} facilities within ${maxDistance} miles`);
        
        setFacilityDetails(prev => ({
          ...prev,
          [cacheKey]: facilitiesWithDistance
        }));
      }
    } catch (err) {
      console.error('Error fetching facility details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle row expansion
  const handleRowClick = (row, index) => {
    const newExpandedRow = expandedRow === index ? null : index;
    setExpandedRow(newExpandedRow);
    setExpandedView('table'); // Reset to table view when expanding

    // Fetch facility details if expanding
    if (newExpandedRow !== null) {
      fetchFacilityDetails(row);
    }
  };

  // Clear facility details cache when distance changes (so it re-filters)
  useEffect(() => {
    setFacilityDetails({});
    setExpandedRow(null);
  }, [maxDistance]);

  // Run analysis
  const handleRunAnalysis = () => {
    if (activeTab === 'sources') {
      fetchReferralSources();
    } else {
      fetchTrends();
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async (column) => {
    try {
      const response = await fetch(apiUrl('/api/referral-pathways/filter-options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboundNPI,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          column
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAvailableFilters(prev => ({
          ...prev,
          [column]: result.data
        }));
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (referralSources.length === 0) return;

    const headers = Object.keys(referralSources[0]).join(',');
    const rows = referralSources.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-pathways-${inboundNPI}-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return '$' + Math.round(num).toLocaleString();
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Format date as YYYY-MM (month only, no day)
  const formatMonthDisplay = (dateString) => {
    if (!dateString) return '-';
    // If it's already in YYYY-MM-DD format, extract just YYYY-MM
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString.substring(0, 7);
    }
    // If it's already YYYY-MM, return as is
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      return dateString;
    }
    return dateString;
  };

  // Display name is always "Provider Type" since we locked the grouping
  const getGroupDisplayName = () => 'Provider Type';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Building size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Referral Pathways Analysis</h1>
            <p className={styles.subtitle}>
              Analyze which facilities are sending patients to your organization
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlsRow}>
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Building size={14} />
              Inbound Facility NPI
            </label>
            <input
              type="text"
              value={inboundNPI}
              onChange={(e) => setInboundNPI(e.target.value)}
              className={styles.input}
              placeholder="Enter NPI"
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Calendar size={14} />
              Date From
            </label>
            <input
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className={styles.input}
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Calendar size={14} />
              Date To
            </label>
            <input
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className={styles.input}
            />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <TrendingUp size={14} />
              Max Lead Time: {leadUpPeriodMax} days
            </label>
            <input
              type="range"
              min="1"
              max="90"
              value={leadUpPeriodMax}
              onChange={(e) => setLeadUpPeriodMax(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>1 day</span>
              <span>90 days</span>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <MapPin size={14} />
              Max Distance: {maxDistance} miles
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>10 mi</span>
              <span>500 mi</span>
            </div>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <button 
            onClick={handleRunAnalysis}
            className={styles.runButton}
            disabled={loading || !inboundNPI || !dateRange.from || !dateRange.to}
          >
            {loading ? 'Loading...' : 'Run Analysis'}
          </button>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            <Filter size={14} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {metadata && dateRange.from && dateRange.to && (
        <div className={styles.infoPanel}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Data as of:</span>
            <span className={styles.infoValue}>
              {formatMonthDisplay(metadata.maxDate.value || metadata.maxDate)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Analyzing:</span>
            <span className={styles.infoValue}>
              Last 12 months ({formatMonthDisplay(dateRange.from)} to {formatMonthDisplay(dateRange.to)})
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Max Lead Time:</span>
            <span className={styles.infoValue}>{leadUpPeriodMax} days</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Max Distance:</span>
            <span className={styles.infoValue}>{maxDistance} miles</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'sources' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <Building size={14} />
          Referral Sources
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'trends' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp size={14} />
          Monthly Trends
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'sources' && (
          <div className={styles.sourcesTab}>
            {referralSources.length > 0 && (
              <div className={styles.tableActions}>
                <div className={styles.tableInfo}>
                  Showing {referralSources.length} {getGroupDisplayName().toLowerCase()} groups
                </div>
                <button onClick={exportToCSV} className={styles.exportButton}>
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            )}

            {referralSources.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.expandColumn}></th>
                      <th>{getGroupDisplayName()}</th>
                      <th className={styles.numberColumn}>Facilities</th>
                      <th className={styles.numberColumn}>Total Referrals</th>
                      <th className={styles.numberColumn}>Total Charges</th>
                      <th className={styles.numberColumn}>Months Active</th>
                      <th className={styles.dateColumn}>Latest Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralSources.map((row, index) => {
                      const cacheKey = JSON.stringify({
                        groupByLevel,
                        row: row[groupByLevel]
                      });
                      const details = facilityDetails[cacheKey];
                      const isExpanded = expandedRow === index;
                      const canExpand = true; // Always allow expansion to see individual facilities
                      
                      // Create unique key based on grouping field value
                      const uniqueKey = `${groupByLevel}-${row[groupByLevel]}`;

                      return (
                        <Fragment key={uniqueKey}>
                          <tr 
                            onClick={() => handleRowClick(row, index)}
                            className={`${canExpand ? styles.clickableRow : ''} ${isExpanded ? styles.expandedRow : ''}`}
                          >
                            <td className={styles.expandColumn}>
                              {canExpand && (
                                isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                              )}
                            </td>
                            <td className={styles.nameColumn}>
                              {row[groupByLevel] || 'Unknown'}
                            </td>
                            <td className={styles.numberColumn}>{formatNumber(row.unique_facilities)}</td>
                            <td className={styles.numberColumn}>{formatNumber(row.total_referrals)}</td>
                            <td className={styles.numberColumn}>{formatCurrency(row.total_charges)}</td>
                            <td className={styles.numberColumn}>{row.months_with_activity}</td>
                            <td className={styles.dateColumn}>{formatMonthDisplay(row.latest_referral)}</td>
                          </tr>

                          {/* Expanded Details */}
                          {isExpanded && details && (
                            <tr>
                              <td colSpan="7" className={styles.detailsCell}>
                                <div className={styles.detailsContainer}>
                                  <div className={styles.detailsHeader}>
                                    <h4 className={styles.detailsTitle}>
                                      Top Facilities ({details.length})
                                    </h4>
                                    <div className={styles.detailsTabs}>
                                      <button
                                        className={`${styles.detailsTab} ${expandedView === 'table' ? styles.detailsTabActive : ''}`}
                                        onClick={() => setExpandedView('table')}
                                      >
                                        Table
                                      </button>
                                      <button
                                        className={`${styles.detailsTab} ${expandedView === 'map' ? styles.detailsTabActive : ''}`}
                                        onClick={() => setExpandedView('map')}
                                      >
                                        <MapPin size={12} />
                                        Map
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {expandedView === 'table' ? (
                                    <table className={styles.detailsTable}>
                                    <thead>
                                      <tr>
                                        <th>Facility Name</th>
                                        <th>NPI(s)</th>
                                        <th>Location</th>
                                        <th className={styles.numberColumn}>Distance</th>
                                        <th className={styles.numberColumn}>Referrals</th>
                                        <th className={styles.numberColumn}>Avg Monthly</th>
                                        <th className={styles.numberColumn}>Charges</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {details.map((facility, idx) => (
                                        <tr key={`${facility.definitive_id || facility.outbound_facility_provider_npi}-${idx}`}>
                                          <td>
                                            <div>{facility.definitive_name || facility.outbound_facility_provider_name}</div>
                                            {facility.original_names && facility.original_names.length > 0 && (
                                              <div className={styles.alternativeName} style={{ fontSize: '11px', marginTop: '2px' }}>
                                                {facility.original_names.join(', ')}
                                              </div>
                                            )}
                                          </td>
                                          <td className={styles.npiText}>
                                            {facility.npis && facility.npis.length > 1 ? (
                                              <>
                                                {facility.npis.join(', ')}
                                                <div style={{ fontSize: '10px', color: '#a0aec0' }}>({facility.npis.length} NPIs)</div>
                                              </>
                                            ) : (
                                              facility.npis?.[0] || facility.outbound_facility_provider_npi
                                            )}
                                            {facility.definitive_id && (
                                              <div style={{ fontSize: '10px', color: '#a0aec0' }}>ID: {facility.definitive_id}</div>
                                            )}
                                          </td>
                                          <td>
                                            {facility.outbound_facility_provider_city}, {facility.outbound_facility_provider_state}
                                          </td>
                                          <td className={styles.numberColumn}>
                                            {facility.distance ? `${facility.distance} mi` : '-'}
                                          </td>
                                          <td className={styles.numberColumn}>{formatNumber(facility.total_referrals)}</td>
                                          <td className={styles.numberColumn}>{formatNumber(facility.avg_monthly_referrals)}</td>
                                          <td className={styles.numberColumn}>{formatCurrency(facility.total_charges)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  ) : (
                                    <div className={styles.detailsMapContainer}>
                                      <ReferralPathwaysMap 
                                        facilities={details}
                                        inboundFacility={inboundFacilityInfo}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && (
                <div className={styles.emptyState}>
                  <Building size={48} />
                  <p>No referral sources found. Click "Run Analysis" to get started.</p>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className={styles.trendsTab}>
            {trends.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className={styles.numberColumn}>Unique Facilities</th>
                      <th className={styles.numberColumn}>Total Referrals</th>
                      <th className={styles.numberColumn}>Total Charges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((row) => (
                      <tr key={row.month}>
                        <td>{formatMonthDisplay(row.month)}</td>
                        <td className={styles.numberColumn}>{formatNumber(row.unique_facilities)}</td>
                        <td className={styles.numberColumn}>{formatNumber(row.total_referrals)}</td>
                        <td className={styles.numberColumn}>{formatCurrency(row.total_charges)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && (
                <div className={styles.emptyState}>
                  <TrendingUp size={48} />
                  <p>No trend data found. Click "Run Analysis" to get started.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing referral pathways...</p>
        </div>
      )}
    </div>
  );
};

export default ReferralPathways;


