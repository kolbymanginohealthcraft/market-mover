import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import styles from './HCOAnalysis.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import SearchInput from '../../../components/Buttons/SearchInput';
import HCOMap from './HCOMap';
import { MapPin, ChevronDown, Database, Play, Map as MapIcon, BarChart3, List, Filter as FilterIcon, X, Search } from 'lucide-react';

export default function HCOAnalysis() {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, listing, map
  
  // Filters
  const [filters, setFilters] = useState({
    taxonomy_grouping: [],
    taxonomy_classification: [],
    consolidated_specialty: [],
    definitive_firm_type: [],
  });
  
  // Procedure volume filter
  const [hasProcedures, setHasProcedures] = useState(false);
  const [minProcedures, setMinProcedures] = useState('');
  
  // Filter dropdown states
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  
  // Filter search
  const [filterSearch, setFilterSearch] = useState('');
  
  // Data for different views
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [mapData, setMapData] = useState([]);
  
  // Sorting for listing
  const [sortField, setSortField] = useState('distance_miles');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Search
  const [listingSearch, setListingSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100; // Fixed page size

  // Fetch user's saved markets
  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoadingMarkets(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marketsError) {
        throw marketsError;
      }

      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err.message);
    } finally {
      setLoadingMarkets(false);
    }
  };

  const fetchHCOData = async (market) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        latitude: market.latitude,
        longitude: market.longitude,
        radius: market.radius_miles,
      });

      const response = await fetch(`/api/hco-data/stats?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch HCO statistics');
      }

      const data = await response.json();
      setStats(data);
      
      // Fetch listing data by default
      fetchListingData(market);
    } catch (err) {
      console.error('Error fetching HCO data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchListingData = async (market) => {
    if (!market) market = selectedMarket;
    if (!market) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        latitude: market.latitude,
        longitude: market.longitude,
        radius: market.radius_miles,
        limit: 50000,
      });

      const response = await fetch(`/api/hco-data/sample?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }

      const data = await response.json();
      setAllOrganizations(data.organizations || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapData = async () => {
    if (!selectedMarket) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        latitude: selectedMarket.latitude,
        longitude: selectedMarket.longitude,
        radius: selectedMarket.radius_miles,
        limit: 10000,
      });

      const response = await fetch(`/api/hco-data/sample?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch map data');
      }

      const data = await response.json();
      setMapData(data.organizations || []);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    setFilters({ taxonomy_grouping: [], taxonomy_classification: [], consolidated_specialty: [], definitive_firm_type: [] });
    setHasProcedures(false);
    setMinProcedures('');
    setAllOrganizations([]);
    setMapData([]);
    setActiveTab('overview');
    setFilterSearch('');
    fetchHCOData(market);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'map' && mapData.length === 0) {
      fetchMapData();
    }
    if (tab === 'listing') {
      setCurrentPage(1); // Reset to first page when switching to listing
    }
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearAllFilters = () => {
    setFilters({ taxonomy_grouping: [], taxonomy_classification: [], consolidated_specialty: [], definitive_firm_type: [] });
    setHasProcedures(false);
    setMinProcedures('');
    setFilterSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(arr => arr.length > 0) || hasProcedures || minProcedures;
  };

  const applyFilters = (data, includeSearch = false) => {
    let filtered = [...data];
    
    // Apply filters in hierarchical order
    if (filters.taxonomy_grouping.length > 0) {
      filtered = filtered.filter(org => 
        filters.taxonomy_grouping.includes(org.taxonomy?.grouping)
      );
    }
    
    if (filters.taxonomy_classification.length > 0) {
      filtered = filtered.filter(org => 
        filters.taxonomy_classification.includes(org.taxonomy?.classification)
      );
    }
    
    if (filters.consolidated_specialty.length > 0) {
      filtered = filtered.filter(org => 
        filters.consolidated_specialty.includes(org.taxonomy?.consolidated_specialty)
      );
    }
    
    if (filters.definitive_firm_type.length > 0) {
      filtered = filtered.filter(org => 
        filters.definitive_firm_type.includes(org.firm_type)
      );
    }
    
    // Apply procedure volume filters
    if (hasProcedures) {
      filtered = filtered.filter(org => org.procedure_volume_12mo > 0);
    }
    
    if (minProcedures && !isNaN(parseInt(minProcedures))) {
      const threshold = parseInt(minProcedures);
      filtered = filtered.filter(org => org.procedure_volume_12mo >= threshold);
    }
    
    // Apply search (only for listing view)
    if (includeSearch && listingSearch.trim()) {
      const search = listingSearch.toLowerCase();
      filtered = filtered.filter(org => 
        org.name?.toLowerCase().includes(search) ||
        org.taxonomy?.classification?.toLowerCase().includes(search) ||
        org.taxonomy?.consolidated_specialty?.toLowerCase().includes(search) ||
        org.taxonomy?.grouping?.toLowerCase().includes(search) ||
        org.firm_type?.toLowerCase().includes(search) ||
        org.address?.city?.toLowerCase().includes(search) ||
        org.address?.state?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  const getFilteredOrganizations = () => {
    return applyFilters(allOrganizations, true);
  };

  const getFilteredMapData = () => {
    return applyFilters(mapData, false);
  };

  // Get dynamic filter options based on current filters
  const getDynamicFilterOptions = () => {
    // Start with all organizations
    let baseData = [...allOrganizations];
    
    // For each filter type, apply OTHER filters to get available options
    const getOptionsForFilterType = (filterType) => {
      let filtered = [...allOrganizations];
      
      // Apply all OTHER active filters (hierarchical)
      if (filterType !== 'taxonomy_grouping' && filters.taxonomy_grouping.length > 0) {
        filtered = filtered.filter(org => 
          filters.taxonomy_grouping.includes(org.taxonomy?.grouping)
        );
      }
      
      if (filterType !== 'taxonomy_classification' && filters.taxonomy_classification.length > 0) {
        filtered = filtered.filter(org => 
          filters.taxonomy_classification.includes(org.taxonomy?.classification)
        );
      }
      
      if (filterType !== 'consolidated_specialty' && filters.consolidated_specialty.length > 0) {
        filtered = filtered.filter(org => 
          filters.consolidated_specialty.includes(org.taxonomy?.consolidated_specialty)
        );
      }
      
      if (filterType !== 'definitive_firm_type' && filters.definitive_firm_type.length > 0) {
        filtered = filtered.filter(org => 
          filters.definitive_firm_type.includes(org.firm_type)
        );
      }
      
      return filtered;
    };
    
    // Calculate available options and counts for each filter type
    const calculateOptions = (data, field) => {
      const counts = {};
      data.forEach(org => {
        let value;
        if (field === 'taxonomy_grouping') {
          value = org.taxonomy?.grouping;
        } else if (field === 'taxonomy_classification') {
          value = org.taxonomy?.classification;
        } else if (field === 'consolidated_specialty') {
          value = org.taxonomy?.consolidated_specialty;
        } else if (field === 'definitive_firm_type') {
          value = org.firm_type;
        }
        
        if (value) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });
      
      // Apply filter search if present
      let entries = Object.entries(counts);
      if (filterSearch.trim()) {
        const search = filterSearch.toLowerCase();
        entries = entries.filter(([value]) => value.toLowerCase().includes(search));
      }
      
      return entries
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count }));
    };
    
    return {
      taxonomy_grouping: calculateOptions(
        getOptionsForFilterType('taxonomy_grouping'),
        'taxonomy_grouping'
      ),
      taxonomy_classification: calculateOptions(
        getOptionsForFilterType('taxonomy_classification'),
        'taxonomy_classification'
      ),
      consolidated_specialty: calculateOptions(
        getOptionsForFilterType('consolidated_specialty'),
        'consolidated_specialty'
      ),
      definitive_firm_type: calculateOptions(
        getOptionsForFilterType('definitive_firm_type'),
        'definitive_firm_type'
      ).filter(item => item.value), // Remove null/undefined
    };
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortedOrganizations = () => {
    const filtered = getFilteredOrganizations();
    
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'classification':
          aVal = a.taxonomy?.classification || '';
          bVal = b.taxonomy?.classification || '';
          break;
        case 'specialty':
          aVal = a.taxonomy?.consolidated_specialty || '';
          bVal = b.taxonomy?.consolidated_specialty || '';
          break;
        case 'city':
          aVal = a.address.city || '';
          bVal = b.address.city || '';
          break;
        case 'state':
          aVal = a.address.state || '';
          bVal = b.address.state || '';
          break;
        case 'distance_miles':
          aVal = a.distance_miles;
          bVal = b.distance_miles;
          break;
        case 'procedures':
          aVal = a.procedure_volume_12mo || 0;
          bVal = b.procedure_volume_12mo || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
    });
    
    return sorted;
  };

  const getPaginatedOrganizations = () => {
    const sorted = getSortedOrganizations();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sorted.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const total = getSortedOrganizations().length;
    return Math.ceil(total / pageSize);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const formatPercent = (numerator, denominator) => {
    if (!denominator) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <Database size={18} style={{ color: 'var(--primary-teal)' }} />
        <h1 className={styles.title}>HCO Data Analysis</h1>
        
        <div className={styles.spacer} />

        {/* Market Selector */}
        <Dropdown
          trigger={
            <button className={styles.dropdownTrigger}>
              <MapPin size={14} />
              {selectedMarket ? selectedMarket.name : 'Select Market'}
              <ChevronDown size={14} />
            </button>
          }
          isOpen={marketDropdownOpen}
          onToggle={setMarketDropdownOpen}
          className={styles.dropdownMenu}
        >
          {loadingMarkets ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              Loading markets...
            </div>
          ) : markets.length === 0 ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              No saved markets
            </div>
          ) : (
            markets.map((market) => (
              <button
                key={market.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleMarketSelect(market);
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
            ))
          )}
        </Dropdown>
        
        {stats?.parameters && (
          <div className={styles.queryTime}>
            {stats.parameters.radius_miles} mi radius
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Left Sidebar - Filters */}
        {selectedMarket && stats && (
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarHeaderRow}>
                <h3>Filters</h3>
                {hasActiveFilters() && (
                  <button className={styles.clearFiltersButton} onClick={clearAllFilters}>
                    <X size={12} />
                    Clear All
                  </button>
                )}
              </div>
              <p>Refine organizations in {selectedMarket.name}</p>
              
              {/* Filter Search */}
              <div style={{ marginTop: '12px' }}>
                <SearchInput
                  placeholder="Search filters (e.g., urgent care)..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Industry Grouping Filter (Broadest) */}
            <div className={styles.filterSection}>
              <Dropdown
                trigger={
                  <button className={styles.filterSectionTrigger}>
                    <span className={styles.filterSectionLabel}>
                      <FilterIcon size={12} />
                      Industry Grouping
                    </span>
                    <span className={styles.filterSectionRight}>
                      {filters.taxonomy_grouping.length > 0 && (
                        <span className={styles.filterCount}>{filters.taxonomy_grouping.length}</span>
                      )}
                      <ChevronDown size={14} />
                    </span>
                  </button>
                }
                isOpen={openFilterDropdown === 'taxonomy_grouping'}
                onToggle={(open) => setOpenFilterDropdown(open ? 'taxonomy_grouping' : null)}
                className={styles.filterDropdownMenu}
              >
                {getDynamicFilterOptions().taxonomy_grouping.map((item, idx) => (
                  <label key={idx} className={styles.filterDropdownItem}>
                    <input
                      type="checkbox"
                      checked={filters.taxonomy_grouping.includes(item.value)}
                      onChange={() => toggleFilter('taxonomy_grouping', item.value)}
                    />
                    <span className={styles.filterLabel}>
                      {item.value}
                      <span className={styles.filterItemCount}>({formatNumber(item.count)})</span>
                    </span>
                  </label>
                ))}
              </Dropdown>
            </div>

            {/* Service Type Filter (Mid-Level) */}
            <div className={styles.filterSection}>
              <Dropdown
                trigger={
                  <button className={styles.filterSectionTrigger}>
                    <span className={styles.filterSectionLabel}>
                      <FilterIcon size={12} />
                      Service Type
                    </span>
                    <span className={styles.filterSectionRight}>
                      {filters.taxonomy_classification.length > 0 && (
                        <span className={styles.filterCount}>{filters.taxonomy_classification.length}</span>
                      )}
                      <ChevronDown size={14} />
                    </span>
                  </button>
                }
                isOpen={openFilterDropdown === 'taxonomy_classification'}
                onToggle={(open) => setOpenFilterDropdown(open ? 'taxonomy_classification' : null)}
                className={styles.filterDropdownMenu}
              >
                {getDynamicFilterOptions().taxonomy_classification.map((item, idx) => (
                  <label key={idx} className={styles.filterDropdownItem}>
                    <input
                      type="checkbox"
                      checked={filters.taxonomy_classification.includes(item.value)}
                      onChange={() => toggleFilter('taxonomy_classification', item.value)}
                    />
                    <span className={styles.filterLabel}>
                      {item.value}
                      <span className={styles.filterItemCount}>({formatNumber(item.count)})</span>
                    </span>
                  </label>
                ))}
              </Dropdown>
            </div>

            {/* Specialty Category Filter (Specific) */}
            <div className={styles.filterSection}>
              <Dropdown
                trigger={
                  <button className={styles.filterSectionTrigger}>
                    <span className={styles.filterSectionLabel}>
                      <FilterIcon size={12} />
                      Specialty Category
                    </span>
                    <span className={styles.filterSectionRight}>
                      {filters.consolidated_specialty.length > 0 && (
                        <span className={styles.filterCount}>{filters.consolidated_specialty.length}</span>
                      )}
                      <ChevronDown size={14} />
                    </span>
                  </button>
                }
                isOpen={openFilterDropdown === 'consolidated_specialty'}
                onToggle={(open) => setOpenFilterDropdown(open ? 'consolidated_specialty' : null)}
                className={styles.filterDropdownMenu}
              >
                {getDynamicFilterOptions().consolidated_specialty.map((item, idx) => (
                  <label key={idx} className={styles.filterDropdownItem}>
                    <input
                      type="checkbox"
                      checked={filters.consolidated_specialty.includes(item.value)}
                      onChange={() => toggleFilter('consolidated_specialty', item.value)}
                    />
                    <span className={styles.filterLabel}>
                      {item.value}
                      <span className={styles.filterItemCount}>({formatNumber(item.count)})</span>
                    </span>
                  </label>
                ))}
              </Dropdown>
            </div>

            {/* Definitive Firm Type Filter */}
            <div className={styles.filterSection}>
              <Dropdown
                trigger={
                  <button className={styles.filterSectionTrigger}>
                    <span className={styles.filterSectionLabel}>
                      <FilterIcon size={12} />
                      Organization Type
                    </span>
                    <span className={styles.filterSectionRight}>
                      {filters.definitive_firm_type.length > 0 && (
                        <span className={styles.filterCount}>{filters.definitive_firm_type.length}</span>
                      )}
                      <ChevronDown size={14} />
                    </span>
                  </button>
                }
                isOpen={openFilterDropdown === 'definitive_firm_type'}
                onToggle={(open) => setOpenFilterDropdown(open ? 'definitive_firm_type' : null)}
                className={styles.filterDropdownMenu}
              >
                {getDynamicFilterOptions().definitive_firm_type.length > 0 ? (
                  getDynamicFilterOptions().definitive_firm_type.map((item, idx) => (
                    <label key={idx} className={styles.filterDropdownItem}>
                      <input
                        type="checkbox"
                        checked={filters.definitive_firm_type.includes(item.value)}
                        onChange={() => toggleFilter('definitive_firm_type', item.value)}
                      />
                      <span className={styles.filterLabel}>
                        {item.value}
                        <span className={styles.filterItemCount}>({formatNumber(item.count)})</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className={styles.filterDropdownItem} style={{ color: 'var(--gray-500)' }}>
                    No definitive data available
                  </div>
                )}
              </Dropdown>
            </div>

            {/* Procedure Volume Filter */}
            <div className={styles.filterSection}>
              <div className={styles.filterSectionTrigger} style={{ cursor: 'default' }}>
                <span className={styles.filterSectionLabel}>
                  <FilterIcon size={12} />
                  Procedure Volume
                </span>
                {(hasProcedures || minProcedures) && (
                  <span className={styles.filterCount}>ON</span>
                )}
              </div>
              <div className={styles.procedureFilterContent}>
                <label className={styles.procedureFilterCheckbox}>
                  <input
                    type="checkbox"
                    checked={hasProcedures}
                    onChange={(e) => {
                      setHasProcedures(e.target.checked);
                      setCurrentPage(1);
                    }}
                  />
                  <span>Only show orgs with procedures</span>
                </label>
                <div className={styles.procedureFilterThreshold}>
                  <label className={styles.thresholdLabel}>Minimum procedures:</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minProcedures}
                    onChange={(e) => {
                      setMinProcedures(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={styles.thresholdInput}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={styles.mainContent}>
          {!selectedMarket && !loading && (
            <div className={styles.emptyState}>
              <Database size={48} style={{ color: 'var(--gray-300)' }} />
              <h2>Select a Market to Begin</h2>
              <p>Choose a saved market from the dropdown above to analyze healthcare organizations in that area.</p>
            </div>
          )}

          {loading && !stats && (
            <div className={styles.emptyState}>
              <Database size={48} style={{ color: 'var(--gray-300)' }} />
              <h2>Loading HCO Data...</h2>
              <p>Analyzing healthcare organizations in {selectedMarket?.name}...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {selectedMarket && stats && (
            <>
              {/* Tabs */}
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange('overview')}
                >
                  <BarChart3 size={14} />
                  Overview
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'listing' ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange('listing')}
                >
                  <List size={14} />
                  Listing ({formatNumber(getFilteredOrganizations().length)})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'map' ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange('map')}
                >
                  <MapIcon size={14} />
                  Map
                </button>
              </div>

              {/* Tab Content */}
              <div className={styles.tabContent}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className={styles.overviewContent}>
                    {/* Overall Statistics */}
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>Total Organizations</div>
                        <div className={styles.statValue}>
                          {formatNumber(stats.stats.total_organizations)}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>Service Types</div>
                        <div className={styles.statValue}>
                          {stats.breakdown_by_taxonomy_classification.length}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>Specialties</div>
                        <div className={styles.statValue}>
                          {stats.breakdown_by_consolidated_specialty.length}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>Cities</div>
                        <div className={styles.statValue}>
                          {stats.stats.distinct_cities}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>States</div>
                        <div className={styles.statValue}>
                          {stats.stats.distinct_states}
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statLabel}>Avg Distance (mi)</div>
                        <div className={styles.statValue}>
                          {stats.stats.avg_distance_miles}
                        </div>
                      </div>
                    </div>

                    {/* Relationship Coverage */}
                    <div className={styles.section}>
                      <h3>Organizational Relationships</h3>
                      <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                          <div className={styles.statLabel}>Hospital Parent</div>
                          <div className={styles.statValue}>
                            {formatNumber(stats.stats.with_hospital_parent)}
                            <span className={styles.statPercent}>
                              {formatPercent(stats.stats.with_hospital_parent, stats.stats.total_organizations)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statLabel}>Physician Group Parent</div>
                          <div className={styles.statValue}>
                            {formatNumber(stats.stats.with_physician_group_parent)}
                            <span className={styles.statPercent}>
                              {formatPercent(stats.stats.with_physician_group_parent, stats.stats.total_organizations)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statLabel}>Network Affiliation</div>
                          <div className={styles.statValue}>
                            {formatNumber(stats.stats.with_network_affiliation)}
                            <span className={styles.statPercent}>
                              {formatPercent(stats.stats.with_network_affiliation, stats.stats.total_organizations)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statLabel}>Definitive ID</div>
                          <div className={styles.statValue}>
                            {formatNumber(stats.stats.with_definitive_id)}
                            <span className={styles.statPercent}>
                              {formatPercent(stats.stats.with_definitive_id, stats.stats.total_organizations)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Service Types */}
                    <div className={styles.section}>
                      <h3>Top Service Types</h3>
                      <p className={styles.sectionHint}>Includes procedure volume data from the last 12 months</p>
                      <div className={styles.table}>
                        <table>
                          <thead>
                            <tr>
                              <th>Service Type</th>
                              <th>Orgs</th>
                              <th>% of Total</th>
                              <th>Total Procedures (12mo)</th>
                              <th>Orgs w/ Procedures</th>
                              <th>Avg Distance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.breakdown_by_taxonomy_classification.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td>{row.classification}</td>
                                <td>{formatNumber(row.count)}</td>
                                <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                                <td className={styles.procedureCount}>
                                  {row.total_procedures > 0 ? formatNumber(row.total_procedures) : '-'}
                                </td>
                                <td>
                                  {row.orgs_with_procedures > 0 
                                    ? `${formatNumber(row.orgs_with_procedures)} (${formatPercent(row.orgs_with_procedures, row.count)})`
                                    : '-'
                                  }
                                </td>
                                <td>{row.avg_distance} mi</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Top Specialties */}
                    <div className={styles.section}>
                      <h3>Top Specialties</h3>
                      <p className={styles.sectionHint}>Includes procedure volume data from the last 12 months</p>
                      <div className={styles.table}>
                        <table>
                          <thead>
                            <tr>
                              <th>Specialty</th>
                              <th>Orgs</th>
                              <th>% of Total</th>
                              <th>Total Procedures (12mo)</th>
                              <th>Orgs w/ Procedures</th>
                              <th>Avg Distance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.breakdown_by_consolidated_specialty.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                <td>{row.specialty}</td>
                                <td>{formatNumber(row.count)}</td>
                                <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                                <td className={styles.procedureCount}>
                                  {row.total_procedures > 0 ? formatNumber(row.total_procedures) : '-'}
                                </td>
                                <td>
                                  {row.orgs_with_procedures > 0 
                                    ? `${formatNumber(row.orgs_with_procedures)} (${formatPercent(row.orgs_with_procedures, row.count)})`
                                    : '-'
                                  }
                                </td>
                                <td>{row.avg_distance} mi</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Top Hospital Parents */}
                    {stats.breakdown_by_hospital_parent?.length > 0 && (
                      <div className={styles.section}>
                        <h3>Top Hospital Parents</h3>
                        <p className={styles.sectionHint}>Organizations affiliated with major health systems ({stats.stats.with_hospital_parent.toLocaleString()} total) • Includes procedure volume</p>
                        <div className={styles.table}>
                          <table>
                            <thead>
                              <tr>
                                <th>Hospital System</th>
                                <th>Affiliated Orgs</th>
                                <th>% of Total</th>
                                <th>Total Procedures (12mo)</th>
                                <th>Orgs w/ Procedures</th>
                                <th>Avg Distance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.breakdown_by_hospital_parent.slice(0, 10).map((row, idx) => (
                                <tr key={idx}>
                                  <td>{row.hospital_parent_name}</td>
                                  <td>{formatNumber(row.count)}</td>
                                  <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                                  <td className={styles.procedureCount}>
                                    {row.total_procedures > 0 ? formatNumber(row.total_procedures) : '-'}
                                  </td>
                                  <td>
                                    {row.orgs_with_procedures > 0 
                                      ? `${formatNumber(row.orgs_with_procedures)} (${formatPercent(row.orgs_with_procedures, row.count)})`
                                      : '-'
                                    }
                                  </td>
                                  <td>{row.avg_distance} mi</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Top Networks */}
                    {stats.breakdown_by_network?.length > 0 && (
                      <div className={styles.section}>
                        <h3>Top Networks</h3>
                        <p className={styles.sectionHint}>Organizations with network affiliations ({stats.stats.with_network_affiliation.toLocaleString()} total) • Includes procedure volume</p>
                        <div className={styles.table}>
                          <table>
                            <thead>
                              <tr>
                                <th>Network</th>
                                <th>Affiliated Orgs</th>
                                <th>% of Total</th>
                                <th>Total Procedures (12mo)</th>
                                <th>Orgs w/ Procedures</th>
                                <th>Avg Distance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.breakdown_by_network.slice(0, 10).map((row, idx) => (
                                <tr key={idx}>
                                  <td>{row.network_name}</td>
                                  <td>{formatNumber(row.count)}</td>
                                  <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                                  <td className={styles.procedureCount}>
                                    {row.total_procedures > 0 ? formatNumber(row.total_procedures) : '-'}
                                  </td>
                                  <td>
                                    {row.orgs_with_procedures > 0 
                                      ? `${formatNumber(row.orgs_with_procedures)} (${formatPercent(row.orgs_with_procedures, row.count)})`
                                      : '-'
                                    }
                                  </td>
                                  <td>{row.avg_distance} mi</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Listing Tab */}
                {activeTab === 'listing' && (
                  <div className={styles.listingContent}>
                    {/* Controls Row */}
                    <div className={styles.controlsRow}>
                      <SearchInput
                        placeholder="Search organizations..."
                        value={listingSearch}
                        onChange={(e) => {
                          setListingSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        onClear={() => setCurrentPage(1)}
                      />
                      
                      <div className={styles.spacer} />
                      
                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <div className={styles.paginationControls}>
                          <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                          <div className={styles.paginationInfo}>
                            Page {currentPage} of {getTotalPages()}
                          </div>
                          <button
                            className={styles.paginationButton}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === getTotalPages()}
                          >
                            Next
                          </button>
                        </div>
                      )}
                      
                      <div className={styles.listingCount}>
                        {formatNumber((currentPage - 1) * pageSize + 1)}-{formatNumber(Math.min(currentPage * pageSize, getSortedOrganizations().length))} of {formatNumber(getSortedOrganizations().length)}
                      </div>
                    </div>

                    {loading && allOrganizations.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Database size={48} style={{ color: 'var(--gray-300)' }} />
                        <h2>Loading Organizations...</h2>
                      </div>
                    ) : (
                      <>
                        <div className={styles.tableWrapper}>
                          <table className={styles.listingTable}>
                            <thead>
                              <tr>
                                <th>NPI</th>
                                <th 
                                  onClick={() => handleSort('name')}
                                  className={styles.sortableHeader}
                                >
                                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Definitive ID</th>
                                <th>Definitive Name</th>
                                <th 
                                  onClick={() => handleSort('classification')}
                                  className={styles.sortableHeader}
                                >
                                  Service Type {sortField === 'classification' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                  onClick={() => handleSort('specialty')}
                                  className={styles.sortableHeader}
                                >
                                  Specialty {sortField === 'specialty' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                  onClick={() => handleSort('procedures')}
                                  className={styles.sortableHeader}
                                >
                                  Procedures (12mo) {sortField === 'procedures' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Hospital Parent</th>
                                <th>Network</th>
                                <th 
                                  onClick={() => handleSort('city')}
                                  className={styles.sortableHeader}
                                >
                                  City {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                  onClick={() => handleSort('state')}
                                  className={styles.sortableHeader}
                                >
                                  State {sortField === 'state' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                  onClick={() => handleSort('distance_miles')}
                                  className={styles.sortableHeader}
                                >
                                  Distance {sortField === 'distance_miles' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {getPaginatedOrganizations().map((org, idx) => (
                                <tr key={idx}>
                                  <td>{org.npi}</td>
                                  <td>{org.name}</td>
                                  <td>{org.relationships?.definitive_id || '-'}</td>
                                  <td>{org.relationships?.definitive_name || '-'}</td>
                                  <td>{org.taxonomy?.classification || '-'}</td>
                                  <td>{org.taxonomy?.consolidated_specialty || '-'}</td>
                                  <td className={styles.procedureCount}>
                                    {org.procedure_volume_12mo > 0 ? formatNumber(org.procedure_volume_12mo) : '-'}
                                  </td>
                                  <td>{org.relationships?.hospital_parent_name || '-'}</td>
                                  <td>{org.relationships?.network_name || '-'}</td>
                                  <td>{org.address.city}</td>
                                  <td>{org.address.state}</td>
                                  <td>{org.distance_miles.toFixed(2)} mi</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Map Tab */}
                {activeTab === 'map' && (
                  <div className={styles.mapContent}>
                    {loading && mapData.length === 0 ? (
                      <div className={styles.emptyState}>
                        <MapIcon size={48} style={{ color: 'var(--gray-300)' }} />
                        <h2>Loading Map...</h2>
                      </div>
                    ) : mapData.length > 0 ? (
                      <>
                        <div className={styles.mapInfo}>
                          <p>
                            Showing {formatNumber(getFilteredMapData().length)} organizations
                            {hasActiveFilters() && ` (filtered from ${formatNumber(mapData.length)})`}
                            {' • '}Click clusters to zoom in • Click markers for details
                          </p>
                        </div>
                        <HCOMap
                          center={{ lat: selectedMarket.latitude, lng: selectedMarket.longitude }}
                          radius={selectedMarket.radius_miles}
                          organizations={getFilteredMapData()}
                        />
                      </>
                    ) : (
                      <div className={styles.emptyState}>
                        <MapIcon size={48} style={{ color: 'var(--gray-300)' }} />
                        <h2>Map Not Loaded</h2>
                        <p>Loading map data...</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
