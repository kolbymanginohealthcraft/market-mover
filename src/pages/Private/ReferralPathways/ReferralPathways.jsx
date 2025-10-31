import { useState, useEffect, Fragment } from 'react';
import { Building, TrendingUp, Download, ChevronRight, ChevronDown, MapPin, ArrowRight, X } from 'lucide-react';
import styles from './ReferralPathways.module.css';
import { apiUrl } from '../../../utils/api';
import ReferralPathwaysMap from './ReferralPathwaysMap';

const ReferralPathways = () => {
  // State
  // Search direction:
  // - 'receiver': Find who sends patients TO this facility (inbound_facility_provider_npi in DB)
  // - 'sender': Find where this facility sends patients TO (outbound_facility_provider_npi in DB)
  const [searchDirection, setSearchDirection] = useState('receiver'); // 'receiver' or 'sender'
  const [activeDirection, setActiveDirection] = useState(null); // Direction of currently displayed results
  const [receiverNPI, setReceiverNPI] = useState('1043205479'); // Default NPI for receiver (inbound_facility_provider_npi)
  const [senderNPI, setSenderNPI] = useState('1457393035'); // Default NPI for sender (outbound_facility_provider_npi)
  const [metadata, setMetadata] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const groupByLevel = 'outbound_facility_provider_taxonomy_classification'; // Fixed to taxonomy classification
  const [leadUpPeriodMax, setLeadUpPeriodMax] = useState(3); // Default 3 days
  const [maxDistance, setMaxDistance] = useState(100); // Default 100 miles
  const [allFacilities, setAllFacilities] = useState([]); // All facilities loaded upfront
  const [groupedData, setGroupedData] = useState([]); // Grouped by provider type for display
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedView, setExpandedView] = useState('table'); // 'table' or 'map' for drill-down
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inboundFacilityInfo, setInboundFacilityInfo] = useState(null);
  const [activeFacilityInfo, setActiveFacilityInfo] = useState(null); // Facility info for currently displayed results
  const [searchMedicareOnly, setSearchMedicareOnly] = useState(false); // Toggle between pathways_provider_overall and medicare_pathways_provider_overall
  
  // Downstream analysis modal
  const [downstreamModal, setDownstreamModal] = useState(null); // { facility, data } or null
  const [downstreamLoading, setDownstreamLoading] = useState(false);

  // Fetch metadata on mount to get max_date
  useEffect(() => {
    fetchMetadata();
    fetchInboundFacilityLocation();
  }, []);

  // Re-fetch metadata when Medicare toggle changes
  useEffect(() => {
    fetchMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMedicareOnly]);

  // Fetch facility location for map (optional - won't break if fails)
  const fetchInboundFacilityLocation = async () => {
    // Get the current facility NPI based on search direction
    // 'receiver' = inbound_facility_provider_npi, 'sender' = outbound_facility_provider_npi
    const currentNPI = searchDirection === 'receiver' ? receiverNPI : senderNPI;
    if (!currentNPI) return;
    
    try {
      const response = await fetch(apiUrl(`/api/referral-pathways/facility-location/${currentNPI}`));
      
      if (!response.ok) {
        console.log('Facility location not available (optional)');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setInboundFacilityInfo({
          npi: currentNPI,
          name: result.data.definitive_name,
          latitude: result.data.latitude,
          longitude: result.data.longitude,
          taxonomy_classification: result.data.taxonomy_classification
        });
      }
    } catch (err) {
      console.log('Facility location fetch skipped (optional)');
    }
  };

  // Refetch facility location when NPI or direction changes
  useEffect(() => {
    fetchInboundFacilityLocation();
  }, [receiverNPI, senderNPI, searchDirection]);

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
      const tableName = searchMedicareOnly ? 'medicare_pathways_provider_overall' : 'pathways_provider_overall';
      const response = await fetch(apiUrl(`/api/referral-pathways/metadata?tableName=${tableName}`));
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

  // Fetch all facilities upfront (faster overall)
  const fetchReferralSources = async () => {
    // Get current NPI based on search direction
    // 'receiver' searches inbound_facility_provider_npi, 'sender' searches outbound_facility_provider_npi
    const currentNPI = searchDirection === 'receiver' ? receiverNPI : senderNPI;
    if (!currentNPI || !dateRange.from || !dateRange.to) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Choose endpoint based on search direction
      // 'receiver' mode: find who sends TO this facility (inbound_facility_provider_npi)
      // 'sender' mode: find where this facility sends TO (outbound_facility_provider_npi)
      const endpoint = searchDirection === 'receiver' 
        ? '/api/referral-pathways/referral-sources'
        : '/api/referral-pathways/downstream-facilities';
      
      const tableName = searchMedicareOnly ? 'medicare_pathways_provider_overall' : 'pathways_provider_overall';
      
      const requestBody = searchDirection === 'receiver'
        ? {
            inboundNPI: currentNPI, // DB field: inbound_facility_provider_npi
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
            groupByField: 'outbound_facility_provider_npi',
            leadUpPeriodMax,
            limit: 200,
            tableName
          }
        : {
            outboundNPI: currentNPI, // DB field: outbound_facility_provider_npi
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
            leadUpPeriodMax,
            limit: 200,
            tableName
          };

      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
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
            distance: distance ? Math.round(distance * 10) / 10 : null
          };
        });

        // Filter by max distance
        facilitiesWithDistance = facilitiesWithDistance.filter(f => 
          f.distance === null || f.distance <= maxDistance
        );

        console.log(`✅ Loaded ${facilitiesWithDistance.length} facilities (filtered by ${maxDistance} miles)`);

        // Store all facilities
        setAllFacilities(facilitiesWithDistance);

        // Group by taxonomy for display
        groupFacilitiesByTaxonomy(facilitiesWithDistance);
        
        // Update active direction and facility info to match the results
        setActiveDirection(searchDirection);
        setActiveFacilityInfo(inboundFacilityInfo);
        
        setExpandedRow(null); // Reset expanded rows
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

  // Group facilities by taxonomy classification (client-side)
  const groupFacilitiesByTaxonomy = (facilities) => {
    const grouped = {};
    
    facilities.forEach(facility => {
      const taxonomy = facility.outbound_facility_provider_taxonomy_classification || 'Unknown';
      
      if (!grouped[taxonomy]) {
        grouped[taxonomy] = {
          taxonomy_classification: taxonomy,
          facilities: [],
          unique_facilities: 0,
          total_referrals: 0,
          total_charges: 0,
          months_with_activity: 0,
          latest_referral: null
        };
      }
      
      grouped[taxonomy].facilities.push(facility);
      grouped[taxonomy].unique_facilities = grouped[taxonomy].facilities.length;
      grouped[taxonomy].total_referrals += Number(facility.total_referrals) || 0;
      grouped[taxonomy].total_charges += Number(facility.total_charges) || 0;
      grouped[taxonomy].months_with_activity = Math.max(
        grouped[taxonomy].months_with_activity,
        Number(facility.months_with_activity) || 0
      );
      
      if (!grouped[taxonomy].latest_referral || facility.latest_referral > grouped[taxonomy].latest_referral) {
        grouped[taxonomy].latest_referral = facility.latest_referral;
      }
    });

    // Convert to array and sort by total_referrals
    const groupedArray = Object.values(grouped)
      .sort((a, b) => b.total_referrals - a.total_referrals);

    setGroupedData(groupedArray);
  };

  // Get facilities for a specific taxonomy (instant - already loaded)
  const getFacilitiesForTaxonomy = (taxonomy) => {
    const group = groupedData.find(g => g.taxonomy_classification === taxonomy);
    if (!group) return [];
    
    // Sort by referrals (highest first), then by distance (closest first)
    return group.facilities.sort((a, b) => {
      const referralDiff = (b.total_referrals || 0) - (a.total_referrals || 0);
      if (referralDiff !== 0) return referralDiff;
      
      // If referrals are equal, sort by distance
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  };

  // Handle row expansion (instant - no server call)
  const handleRowClick = (row, index) => {
    const newExpandedRow = expandedRow === index ? null : index;
    setExpandedRow(newExpandedRow);
    setExpandedView('table'); // Reset to table view when expanding
  };

  // Re-group when distance filter changes
  useEffect(() => {
    if (allFacilities.length > 0) {
      groupFacilitiesByTaxonomy(allFacilities);
    }
  }, [maxDistance]);

  // Run analysis
  const handleRunAnalysis = () => {
    fetchReferralSources();
  };

  // Fetch downstream facilities (where does this facility send patients?)
  const fetchDownstreamFacilities = async (facility) => {
    setDownstreamLoading(true);
    
    try {
      // Use the first NPI from the facility
      const outboundNPI = facility.npis?.[0] || facility.outbound_facility_provider_npi;
      
      console.log(`🔄 Fetching downstream facilities for ${facility.definitive_name || facility.outbound_facility_provider_name}`);
      
      const tableName = searchMedicareOnly ? 'medicare_pathways_provider_overall' : 'pathways_provider_overall';
      
      const response = await fetch(apiUrl('/api/referral-pathways/downstream-facilities'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outboundNPI, // This facility is sending patients
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          leadUpPeriodMax,
          filterByTaxonomy: inboundFacilityInfo?.taxonomy_classification, // Only show same type as your facility
          limit: 200,
          tableName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Calculate distances from the selected facility
        const facilitiesWithDistance = result.data.map(f => {
          const distance = facility.latitude && f.latitude
            ? calculateDistance(
                facility.latitude,
                facility.longitude,
                f.latitude,
                f.longitude
              )
            : null;
          
          return {
            ...f,
            distance: distance ? Math.round(distance * 10) / 10 : null
          };
        }).filter(f => f.distance === null || f.distance <= maxDistance);

        // Sort by referrals
        facilitiesWithDistance.sort((a, b) => (b.total_referrals || 0) - (a.total_referrals || 0));

        setDownstreamModal({
          facility,
          data: facilitiesWithDistance,
          totalReferrals: facilitiesWithDistance.reduce((sum, f) => sum + (f.total_referrals || 0), 0)
        });
      }
    } catch (err) {
      console.error('Error fetching downstream facilities:', err);
    } finally {
      setDownstreamLoading(false);
    }
  };

  // Export to CSV (all facilities)
  const exportToCSV = () => {
    if (allFacilities.length === 0) return;

    const currentNPI = searchDirection === 'receiver' ? receiverNPI : senderNPI;
    const headers = ['Definitive Name', 'NPIs', 'Taxonomy', 'City', 'State', 'Distance (mi)', 'Referrals', 'Charges', 'Months Active', 'Latest Activity'].join(',');
    const rows = allFacilities.map(f => {
      const npiList = f.npis ? f.npis.join('; ') : f.outbound_facility_provider_npi;
      return [
        f.definitive_name || f.outbound_facility_provider_name,
        npiList,
        f.outbound_facility_provider_taxonomy_classification,
        f.outbound_facility_provider_city,
        f.outbound_facility_provider_state,
        f.distance || '',
        f.total_referrals,
        f.total_charges,
        f.months_with_activity,
        f.latest_referral
      ].map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val).join(',');
    });
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-pathways-${searchDirection}-${currentNPI}-${new Date().toISOString().substring(0, 10)}.csv`;
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

  // Display name changes based on ACTIVE direction (the direction of currently displayed results)
  // 'receiver' mode: we're finding who sends TO us, so results are "Senders"
  // 'sender' mode: we're finding where we send TO, so results are "Receivers"
  const getGroupDisplayName = () => activeDirection === 'receiver' ? 'Sender Type' : 'Receiver Type';
  
  const getFacilityColumnName = () => activeDirection === 'receiver' ? 'Sender Name' : 'Receiver Name';

  return (
    <div className={styles.container}>
      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlsRow}>
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Search Direction
            </label>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleButton} ${searchDirection === 'receiver' ? styles.toggleButtonActive : ''}`}
                onClick={() => setSearchDirection('receiver')}
              >
                Receiver
              </button>
              <button
                className={`${styles.toggleButton} ${searchDirection === 'sender' ? styles.toggleButtonActive : ''}`}
                onClick={() => setSearchDirection('sender')}
              >
                Sender
              </button>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Building size={14} />
              {searchDirection === 'receiver' ? 'Receiver Facility NPI' : 'Sender Facility NPI'}
            </label>
            <input
              type="text"
              value={searchDirection === 'receiver' ? receiverNPI : senderNPI}
              onChange={(e) => searchDirection === 'receiver' ? setReceiverNPI(e.target.value) : setSenderNPI(e.target.value)}
              className={styles.input}
              placeholder="Enter NPI"
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

          <div className={styles.controlGroup}>
            <label className={styles.label} style={{ opacity: 0 }}>
              Hidden
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={searchMedicareOnly}
                onChange={(e) => setSearchMedicareOnly(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Search Medicare Only</span>
            </label>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label} style={{ opacity: 0 }}>
              Hidden
            </label>
            <button 
              onClick={handleRunAnalysis}
              className={styles.runButton}
              disabled={loading || (searchDirection === 'receiver' ? !receiverNPI : !senderNPI) || !dateRange.from || !dateRange.to}
            >
              {loading ? 'Loading...' : 'Run Analysis'}
            </button>
          </div>

          {allFacilities.length > 0 && (
            <div className={styles.controlGroup}>
              <label className={styles.label} style={{ opacity: 0 }}>
                Hidden
              </label>
              <button onClick={exportToCSV} className={styles.exportButton}>
                <Download size={14} />
                Export All Facilities
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Facility Info Display - Shows info for currently displayed results */}
      {activeFacilityInfo && activeDirection && (
        <div className={styles.facilityInfoBanner}>
          <div className={styles.facilityInfoContent}>
            <div className={styles.facilityInfoLabel}>
              {activeDirection === 'receiver' ? 'Analyzing Receiver:' : 'Analyzing Sender:'}
            </div>
            <div className={styles.facilityInfoName}>
              {activeFacilityInfo.name}
            </div>
            <div className={styles.facilityInfoDetails}>
              NPI: {activeFacilityInfo.npi} • {activeFacilityInfo.taxonomy_classification}
            </div>
          </div>
          {dateRange.from && dateRange.to && (
            <div className={styles.facilityInfoDateRange}>
              <div className={styles.dateRangeLabel}>Date Range</div>
              <div className={styles.dateRangeValue}>
                {formatMonthDisplay(dateRange.from)} - {formatMonthDisplay(dateRange.to)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.sourcesTab}>
            {groupedData.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.expandColumn}></th>
                      <th>{getGroupDisplayName()}</th>
                      <th className={styles.numberColumn}>Count</th>
                      <th className={styles.numberColumn}>Total Referrals</th>
                      <th className={styles.numberColumn}>Total Charges</th>
                      <th className={styles.numberColumn}>Months Active</th>
                      <th className={styles.dateColumn}>Latest Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.map((group, index) => {
                      const isExpanded = expandedRow === index;
                      const facilities = getFacilitiesForTaxonomy(group.taxonomy_classification);
                      
                      return (
                        <Fragment key={group.taxonomy_classification}>
                          <tr 
                            onClick={() => handleRowClick(group, index)}
                            className={`${styles.clickableRow} ${isExpanded ? styles.expandedRow : ''}`}
                          >
                            <td className={styles.expandColumn}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </td>
                            <td className={styles.nameColumn}>
                              {group.taxonomy_classification}
                            </td>
                            <td className={styles.numberColumn}>{formatNumber(group.unique_facilities)}</td>
                            <td className={styles.numberColumn}>{formatNumber(group.total_referrals)}</td>
                            <td className={styles.numberColumn}>{formatCurrency(group.total_charges)}</td>
                            <td className={styles.numberColumn}>{group.months_with_activity}</td>
                            <td className={styles.dateColumn}>{formatMonthDisplay(group.latest_referral)}</td>
                          </tr>

                          {/* Expanded Details - Instant, no loading! */}
                          {isExpanded && facilities.length > 0 && (
                            <tr>
                              <td colSpan="7" className={styles.detailsCell}>
                                <div className={styles.detailsContainer}>
                                  <div className={styles.detailsHeader}>
                                    <h4 className={styles.detailsTitle}>
                                      {facilities.length} Facilities
                                    </h4>
                                    <div className={styles.detailsTabs}>
                                      <button
                                        className={`${styles.detailsTab} ${expandedView === 'table' ? styles.detailsTabActive : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setExpandedView('table'); }}
                                      >
                                        Table
                                      </button>
                                      <button
                                        className={`${styles.detailsTab} ${expandedView === 'map' ? styles.detailsTabActive : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setExpandedView('map'); }}
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
                                        <th>{getFacilityColumnName()}</th>
                                        <th>NPI(s)</th>
                                        <th>Location</th>
                                        <th className={styles.numberColumn}>Distance</th>
                                        <th className={styles.numberColumn}>Referrals</th>
                                        <th className={styles.numberColumn}>Avg Monthly</th>
                                        <th className={styles.numberColumn}>Charges</th>
                                        <th className={styles.actionColumn}>Downstream</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {facilities.map((facility, idx) => (
                                        <tr key={`${facility.definitive_id || facility.outbound_facility_provider_npi}-${idx}`}>
                                          <td>
                                            <div className={styles.facilityName}>
                                              {facility.definitive_name || facility.outbound_facility_provider_name}
                                            </div>
                                            {facility.original_names && facility.original_names.length > 0 && (
                                              <div className={styles.alternativeName}>
                                                {facility.original_names.join(', ')}
                                              </div>
                                            )}
                                          </td>
                                          <td className={styles.npiText}>
                                            {facility.npis && facility.npis.length > 1 ? (
                                              <>
                                                <div>{facility.npis.join(', ')}</div>
                                                <div className={styles.npiCount}>({facility.npis.length} NPIs)</div>
                                              </>
                                            ) : (
                                              <div>{facility.npis?.[0] || facility.outbound_facility_provider_npi}</div>
                                            )}
                                            {facility.definitive_id && (
                                              <div className={styles.definitiveId}>ID: {facility.definitive_id}</div>
                                            )}
                                          </td>
                                          <td>
                                            {facility.outbound_facility_provider_city}, {facility.outbound_facility_provider_state}
                                          </td>
                                          <td className={styles.numberColumn}>
                                            {facility.distance !== null ? `${facility.distance.toFixed(1)} mi` : '-'}
                                          </td>
                                          <td className={styles.numberColumn}>{formatNumber(facility.total_referrals)}</td>
                                          <td className={styles.numberColumn}>{formatNumber(facility.avg_monthly_referrals)}</td>
                                          <td className={styles.numberColumn}>{formatCurrency(facility.total_charges)}</td>
                                          <td className={styles.actionColumn}>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                fetchDownstreamFacilities(facility);
                                              }}
                                              className={styles.downstreamButton}
                                              title={searchDirection === 'receiver' ? "See where this sender sends patients" : "See who sends to this receiver"}
                                            >
                                              <ArrowRight size={14} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  ) : (
                                    <div className={styles.detailsMapContainer}>
                                      <ReferralPathwaysMap 
                                        facilities={facilities}
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
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing referral pathways...</p>
        </div>
      )}

      {/* Downstream Analysis Modal */}
      {downstreamModal && (
        <div className={styles.modal} onClick={() => setDownstreamModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Receivers from {downstreamModal.facility.definitive_name || downstreamModal.facility.outbound_facility_provider_name}
                </h3>
                <p className={styles.modalSubtitle}>
                  Where does this sender send patients to facilities like yours?
                  {inboundFacilityInfo?.taxonomy_classification && ` (Showing only: ${inboundFacilityInfo.taxonomy_classification})`}
                </p>
              </div>
              <button onClick={() => setDownstreamModal(null)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Your Referrals</span>
                <span className={styles.modalStatValue}>
                  {formatNumber(downstreamModal.facility.total_referrals)}
                </span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Total to Receivers</span>
                <span className={styles.modalStatValue}>
                  {formatNumber(downstreamModal.totalReferrals)}
                </span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Your Share</span>
                <span className={styles.modalStatValue} style={{ color: 'var(--primary-teal)' }}>
                  {downstreamModal.totalReferrals > 0 
                    ? ((downstreamModal.facility.total_referrals / downstreamModal.totalReferrals) * 100).toFixed(1) + '%'
                    : '-'
                  }
                </span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Other Receivers</span>
                <span className={styles.modalStatValue}>
                  {downstreamModal.data.length - 1}
                </span>
              </div>
            </div>

            {downstreamLoading ? (
              <div className={styles.modalLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading receiver facilities...</p>
              </div>
            ) : (
              <div className={styles.modalTableContainer}>
                <table className={styles.modalTable}>
                  <thead>
                    <tr>
                      <th>Receiver Facility</th>
                      <th>Location</th>
                      <th className={styles.numberColumn}>Distance</th>
                      <th className={styles.numberColumn}>Referrals</th>
                      <th className={styles.numberColumn}>% of Total</th>
                      <th className={styles.numberColumn}>Charges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downstreamModal.data.map((f, idx) => {
                      // Check if this is the user's facility (comparing against receiver NPI)
                      const isYourFacility = (f.npis?.[0] || f.outbound_facility_provider_npi) === receiverNPI;
                      const sharePercent = downstreamModal.totalReferrals > 0
                        ? ((f.total_referrals / downstreamModal.totalReferrals) * 100).toFixed(1)
                        : 0;

                      return (
                        <tr key={idx} className={isYourFacility ? styles.yourFacilityRow : ''}>
                          <td>
                            <div className={styles.facilityName}>
                              {f.definitive_name || f.outbound_facility_provider_name}
                              {isYourFacility && <span className={styles.youBadge}>YOU</span>}
                            </div>
                            {f.npis && f.npis.length > 1 && (
                              <div className={styles.npiText}>{f.npis.length} NPIs</div>
                            )}
                          </td>
                          <td className={styles.locationText}>
                            {f.outbound_facility_provider_city}, {f.outbound_facility_provider_state}
                          </td>
                          <td className={styles.numberColumn}>
                            {f.distance !== null ? `${f.distance.toFixed(1)} mi` : '-'}
                          </td>
                          <td className={styles.numberColumn}>{formatNumber(f.total_referrals)}</td>
                          <td className={styles.numberColumn}>{sharePercent}%</td>
                          <td className={styles.numberColumn}>{formatCurrency(f.total_charges)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralPathways;


