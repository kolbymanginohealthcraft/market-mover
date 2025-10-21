import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import styles from './HCPAnalysisV2.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import Spinner from '../../../components/Buttons/Spinner';
import { Users, MapPin, ChevronDown, X, Search, Filter as FilterIcon, Download, Database, Play, BarChart3, List } from 'lucide-react';

/**
 * Healthcare Practitioners Directory
 * 
 * Premium search and filter interface for exploring the hcp_flat table
 * - National or market-based view
 * - Rich filtering by geography, specialty, demographics, affiliations
 * - Clean, focused UI for provider discovery
 */

export default function HCPAnalysisV2() {
  // Markets
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSearches, setFilterSearches] = useState({
    specialties: ''
  });
  const [filters, setFilters] = useState({
    states: [],
    specialties: [],
    gender: [],
    hasHospitalAffiliation: null,
    hasPhysicianGroupAffiliation: null,
    hasNetworkAffiliation: null
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    specialties: []
  });
  
  // Results
  const [results, setResults] = useState(null);
  const [resultStats, setResultStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 100;
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, listing
  
  useEffect(() => {
    fetchMarkets();
    // Load national view by default (search with no filters)
    searchPractitioners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchMarkets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (marketsError) throw marketsError;
      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  };
  
  const handleMarketSelect = (marketId) => {
    if (!marketId) {
      setSelectedMarket(null);
      setResults(null);
      return;
    }
    
    const market = markets.find(m => m.id === marketId);
    setSelectedMarket(market);
    setResults(null);
    setFilters({
      states: [],
      specialties: [],
      gender: [],
      hasHospitalAffiliation: null,
      hasPhysicianGroupAffiliation: null,
      hasNetworkAffiliation: null
    });
  };
  
  const searchPractitioners = async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    
    try {
      const requestBody = {
        search: searchTerm,
        states: filters.states,
        consolidatedSpecialty: filters.specialties,
        gender: filters.gender,
        hasHospitalAffiliation: filters.hasHospitalAffiliation,
        hasPhysicianGroupAffiliation: filters.hasPhysicianGroupAffiliation,
        hasNetworkAffiliation: filters.hasNetworkAffiliation,
        limit: 500
      };
      
      if (selectedMarket) {
        requestBody.latitude = parseFloat(selectedMarket.latitude);
        requestBody.longitude = parseFloat(selectedMarket.longitude);
        requestBody.radius = parseFloat(selectedMarket.radius_miles);
      }
      
      const response = await fetch('/api/hcp-data/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search');
      }
      
      setResults(result.data);
      setResultStats(result.data.stats);
      
      // Update filter options if they're included (national view)
      if (result.data.filterOptions) {
        setFilterOptions({
          states: result.data.filterOptions.states || [],
          specialties: result.data.filterOptions.specialties || []
        });
      }
      
      console.log(`✅ Found ${result.data.totalCount} total practitioners (showing ${result.data.count})`);
      
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const clearAll = () => {
    setSearchTerm('');
    setFilters({
      states: [],
      specialties: [],
      gender: [],
      hasHospitalAffiliation: null,
      hasPhysicianGroupAffiliation: null,
      hasNetworkAffiliation: null
    });
    setError(null);
    setPage(1);
    // Reload national view
    setTimeout(() => searchPractitioners(), 0);
  };
  
  const toggleFilterValue = (filterKey, value) => {
    setFilters(prev => {
      const currentValues = prev[filterKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues };
    });
  };
  
  const setBooleanFilter = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? null : value
    }));
  };
  
  const exportToCSV = () => {
    if (!results || !results.practitioners || results.practitioners.length === 0) return;

    const headers = ['NPI', 'Name', 'Specialty', 'City', 'State', 'ZIP', 'Gender', 'Birth Year', 'Hospital Affiliation', 'Network'];
    const csvContent = [
      headers.join(','),
      ...results.practitioners.map(p => [
        p.npi,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.consolidated_specialty || '').replace(/"/g, '""')}"`,
        `"${(p.city || '').replace(/"/g, '""')}"`,
        p.state || '',
        p.zip || '',
        p.gender === 'male' ? 'Male' : p.gender === 'female' ? 'Female' : p.gender || '',
        p.birth_year || '',
        p.hospital_affiliation ? 'Yes' : 'No',
        p.network_affiliation ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hcp-results-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseInt(num).toLocaleString();
  };
  
  // Get breakdowns from server response (based on ALL matching records)
  const getBreakdowns = () => {
    if (!results || !results.breakdowns) return null;
    
    const { breakdowns } = results;
    
    // Convert gender array to map
    const genderMap = { male: 0, female: 0, other: 0 };
    breakdowns.gender?.forEach(g => {
      genderMap[g.gender] = g.count;
    });
    
    return {
      specialties: breakdowns.specialties?.map(s => ({ name: s.specialty, count: parseInt(s.count) })) || [],
      states: breakdowns.states?.map(s => ({ name: s.state, count: parseInt(s.count) })) || [],
      cities: breakdowns.cities || [],
      genderMap,
      affiliations: {
        hospital: parseInt(breakdowns.affiliations?.hospital || 0),
        physicianGroup: parseInt(breakdowns.affiliations?.physician_group || 0),
        network: parseInt(breakdowns.affiliations?.network || 0),
        independent: parseInt(breakdowns.affiliations?.independent || 0)
      }
    };
  };
  
  const paginatedResults = results ? results.practitioners.slice((page - 1) * pageSize, page * pageSize) : [];
  const totalPages = results ? Math.ceil(results.practitioners.length / pageSize) : 0;
  
  const hasActiveFilters = () => {
    return searchTerm || 
           filters.states.length > 0 ||
           filters.specialties.length > 0 ||
           filters.gender.length > 0 ||
           filters.hasHospitalAffiliation !== null ||
           filters.hasNetworkAffiliation !== null;
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Bar */}
      <div className={styles.controlsBar}>
        {markets.length > 0 && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                <MapPin size={14} />
                {selectedMarket ? 
                  `${selectedMarket.name}` : 
                  'Saved Market'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={marketDropdownOpen}
            onToggle={setMarketDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleMarketSelect(null);
                setMarketDropdownOpen(false);
              }}
            >
              No Market
            </button>
            {markets.map(market => (
              <button 
                key={market.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleMarketSelect(market.id);
                  setMarketDropdownOpen(false);
                }}
                style={{
                  fontWeight: selectedMarket?.id === market.id ? '600' : '500',
                  background: selectedMarket?.id === market.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                }}
              >
                <div>{market.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                  {market.city}, {market.state} • {market.radius_miles} mi
                </div>
              </button>
            ))}
          </Dropdown>
        )}
        
        <div className={styles.spacer}></div>
        
        {results && (
          <div className={styles.contextInfo}>
            {selectedMarket ? (
              <span>{selectedMarket.city}, {selectedMarket.state_code} • {selectedMarket.radius_miles}mi radius</span>
            ) : (
              <span>{formatNumber(results.totalCount)} practitioners nationwide</span>
            )}
          </div>
        )}
        
        {hasActiveFilters() && (
          <button onClick={clearAll} className="sectionHeaderButton">
            <X size={14} />
            Clear All
          </button>
        )}
        
        <button 
          onClick={searchPractitioners}
          className="sectionHeaderButton primary"
          disabled={loading}
        >
          <Play size={14} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'listing' ? styles.active : ''}`}
          onClick={() => setActiveTab('listing')}
        >
          <List size={16} />
          Listing
        </button>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        
        {/* Left Sidebar - Filters */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Search & Filter</h3>
            <p>Find healthcare practitioners</p>
          </div>

          {/* Search Input */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Search size={14} />
              Practitioner Name or NPI
            </label>
            <p className={styles.filterHint}>
              Search for practitioner names (e.g., "Dr. Smith", "John") or NPI numbers
            </p>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchPractitioners();
                }}
                placeholder="e.g., Smith, Johnson, 1234567890..."
                className={styles.searchInput}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className={styles.clearButton}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* State Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FilterIcon size={14} />
              States {filters.states.length > 0 && `(${filters.states.length})`}
            </label>
            <div className={styles.filterList}>
              {filterOptions.states.slice(0, 10).map((state, idx) => (
                <label key={idx} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.states.includes(state.state)}
                    onChange={() => toggleFilterValue('states', state.state)}
                  />
                  <span>{state.state}</span>
                  <span className={styles.filterCount}>({formatNumber(state.count)})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specialty Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FilterIcon size={14} />
              Specialty {filters.specialties.length > 0 && `(${filters.specialties.length})`}
            </label>
            <input
              type="text"
              value={filterSearches.specialties}
              onChange={(e) => setFilterSearches(prev => ({ ...prev, specialties: e.target.value }))}
              placeholder="Search specialties..."
              className={styles.filterSearchInput}
            />
            <div className={styles.filterList}>
              {filterOptions.specialties
                .filter(spec =>
                  !filterSearches.specialties ||
                  spec.specialty.toLowerCase().includes(filterSearches.specialties.toLowerCase())
                )
                .map((spec, idx) => (
                  <label key={idx} className={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={filters.specialties.includes(spec.specialty)}
                      onChange={() => toggleFilterValue('specialties', spec.specialty)}
                    />
                    <span className={styles.specialtyName}>{spec.specialty}</span>
                    <span className={styles.filterCount}>({formatNumber(spec.count)})</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FilterIcon size={14} />
              Gender
            </label>
            <div className={styles.filterList}>
              {['male', 'female'].map(g => (
                <label key={g} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.gender.includes(g)}
                    onChange={() => toggleFilterValue('gender', g)}
                  />
                  <span>{g === 'male' ? 'Male' : 'Female'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Affiliation Filters */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FilterIcon size={14} />
              Affiliations
            </label>
            
            <div className={styles.booleanFilter}>
              <span className={styles.booleanLabel}>Hospital:</span>
              <div className={styles.booleanButtons}>
                <button
                  className={`${styles.booleanButton} ${filters.hasHospitalAffiliation === true ? styles.active : ''}`}
                  onClick={() => setBooleanFilter('hasHospitalAffiliation', true)}
                >
                  Yes
                </button>
                <button
                  className={`${styles.booleanButton} ${filters.hasHospitalAffiliation === false ? styles.active : ''}`}
                  onClick={() => setBooleanFilter('hasHospitalAffiliation', false)}
                >
                  No
                </button>
                <button
                  className={`${styles.booleanButton} ${filters.hasHospitalAffiliation === null ? styles.active : ''}`}
                  onClick={() => setBooleanFilter('hasHospitalAffiliation', null)}
                >
                  Any
                </button>
              </div>
            </div>

            <div className={styles.booleanFilter}>
              <span className={styles.booleanLabel}>Network:</span>
              <div className={styles.booleanButtons}>
                <button
                  className={`${styles.booleanButton} ${filters.hasNetworkAffiliation === true ? styles.active : ''}`}
                  onClick={() => setBooleanFilter('hasNetworkAffiliation', true)}
                >
                  Yes
                </button>
                <button
                  className={`${styles.booleanButton} ${filters.hasNetworkAffiliation === false ? styles.active : ''}`}
                  onClick={() => setBooleanFilter('hasNetworkAffiliation', false)}
                >
                  No
                </button>
                <button
                  className={`${styles.booleanButton} ${filters.hasNetworkAffiliation === null ? styles.active : ''}`}
                  onClick={() => setBooleanFilter('hasNetworkAffiliation', null)}
                >
                  Any
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && resultStats && results && (
            <div className={styles.overviewPanel}>
              <h3>
                <Database size={16} />
                {hasActiveFilters() ? 'Filtered Results' : 'National Overview'}
              </h3>
              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Total Practitioners</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(results.totalCount)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Specialties</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.distinct_specialties)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>States</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.distinct_states)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Cities</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.distinct_cities)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Male</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.male_count)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Female</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.female_count)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Detailed Breakdowns */}
          {activeTab === 'overview' && results && results.practitioners && (() => {
            const breakdowns = getBreakdowns();
            if (!breakdowns) return null;
            
            return (
              <div className={styles.breakdownsContainer}>
                {/* Top Specialties */}
                <div className={styles.breakdownSection}>
                  <h4>Top Specialties</h4>
                  <div className={styles.breakdownList}>
                    {breakdowns.specialties.map((item, idx) => (
                      <div key={idx} className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>{item.name}</span>
                        <div className={styles.breakdownBar}>
                          <div 
                            className={styles.breakdownBarFill}
                            style={{ width: `${(item.count / breakdowns.specialties[0].count) * 100}%` }}
                          />
                        </div>
                        <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* State Distribution */}
                <div className={styles.breakdownSection}>
                  <h4>State Distribution</h4>
                  <div className={styles.breakdownList}>
                    {breakdowns.states.map((item, idx) => (
                      <div key={idx} className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>{item.name}</span>
                        <div className={styles.breakdownBar}>
                          <div 
                            className={styles.breakdownBarFill}
                            style={{ width: `${(item.count / breakdowns.states[0].count) * 100}%` }}
                          />
                        </div>
                        <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Top Cities */}
                <div className={styles.breakdownSection}>
                  <h4>Top Cities</h4>
                  <div className={styles.breakdownList}>
                    {breakdowns.cities.map((item, idx) => (
                      <div key={idx} className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>{item.name}</span>
                        <div className={styles.breakdownBar}>
                          <div 
                            className={styles.breakdownBarFill}
                            style={{ width: `${(item.count / breakdowns.cities[0].count) * 100}%` }}
                          />
                        </div>
                        <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Gender & Affiliations */}
                <div className={styles.breakdownRow}>
                  <div className={styles.breakdownSection}>
                    <h4>Gender Distribution</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>Male</span>
                        <span className={styles.breakdownCount}>{formatNumber(breakdowns.genderMap.male)}</span>
                      </div>
                      <div className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>Female</span>
                        <span className={styles.breakdownCount}>{formatNumber(breakdowns.genderMap.female)}</span>
                      </div>
                      {breakdowns.genderMap.other > 0 && (
                        <div className={styles.breakdownItem}>
                          <span className={styles.breakdownName}>Other/Unknown</span>
                          <span className={styles.breakdownCount}>{formatNumber(breakdowns.genderMap.other)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.breakdownSection}>
                    <h4>Affiliations</h4>
                    <div className={styles.breakdownList}>
                      <div className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>Hospital</span>
                        <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.hospital)}</span>
                      </div>
                      <div className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>Physician Group</span>
                        <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.physicianGroup)}</span>
                      </div>
                      <div className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>Network</span>
                        <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.network)}</span>
                      </div>
                      <div className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>Independent</span>
                        <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.independent)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Listing Tab */}
          {activeTab === 'listing' && (
          <div className={styles.resultsPanel}>
            
            {loading && (
              <div className={styles.loadingOverlay}>
                <Spinner />
              </div>
            )}
            
            <div className={styles.resultsHeader}>
              <h3>
                {results ? (
                  <>
                    Practitioners List
                    {results.limited && <span className={styles.limitWarning}> (Showing {results.count} of {formatNumber(results.totalCount)})</span>}
                  </>
                ) : 'Practitioners'}
              </h3>
              
              <div className={styles.resultsActions}>
                {results && results.count > 0 && (
                  <>
                    <span className={styles.pageInfo}>
                      Page {page} of {totalPages} ({pageSize} per page)
                    </span>
                    <button onClick={exportToCSV} className="sectionHeaderButton">
                      <Download size={14} />
                      Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>

            {!results && !loading && (
              <div className={styles.emptyState}>
                <Database size={48} />
                <h2>Loading Healthcare Practitioners...</h2>
                <p>
                  Fetching national overview data
                </p>
              </div>
            )}

            {results && results.count === 0 && (
              <div className={styles.emptyState}>
                <Database size={48} />
                <h2>No Results Found</h2>
                <p>Try adjusting your search terms or filters</p>
              </div>
            )}

            {results && results.count > 0 && (
              <div className={styles.resultsContainer}>
                <div className={styles.tableWrapper}>
                  <table className={styles.resultsTable}>
                    <thead>
                      <tr>
                        <th>Practitioner</th>
                        <th>Specialty</th>
                        <th>Location</th>
                        <th>Gender</th>
                        <th>Affiliations</th>
                        {selectedMarket && <th>Distance</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((practitioner, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className={styles.practitionerCell}>
                              <div className={styles.practitionerName}>{practitioner.name}</div>
                              <div className={styles.practitionerNpi}>NPI: {practitioner.npi}</div>
                            </div>
                          </td>
                          <td>{practitioner.consolidated_specialty || '-'}</td>
                          <td>
                            <div className={styles.locationCell}>
                              <div>{practitioner.city}, {practitioner.state}</div>
                              <div className={styles.zip}>{practitioner.zip}</div>
                            </div>
                          </td>
                          <td>{practitioner.gender === 'male' ? 'Male' : practitioner.gender === 'female' ? 'Female' : practitioner.gender || '-'}</td>
                          <td>
                            <div className={styles.affiliationCell}>
                              {practitioner.hospital_affiliation && <span className={styles.affiliationBadge}>Hospital</span>}
                              {practitioner.physician_group_affiliation && <span className={styles.affiliationBadge}>PG</span>}
                              {practitioner.network_affiliation && <span className={styles.affiliationBadge}>Network</span>}
                              {!practitioner.hospital_affiliation && !practitioner.physician_group_affiliation && !practitioner.network_affiliation && 
                                <span className={styles.noAffiliation}>Independent</span>}
                            </div>
                          </td>
                          {selectedMarket && (
                            <td>
                              {practitioner.distance_miles ? `${practitioner.distance_miles.toFixed(1)} mi` : '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={styles.paginationButton}
                    >
                      Previous
                    </button>
                    <span className={styles.paginationInfo}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={styles.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

