import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import styles from './HCOAnalysis.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import Spinner from '../../../components/Buttons/Spinner';
import SimpleLocationMap from '../../../components/Maps/SimpleLocationMap';
import { 
  Building2, MapPin, ChevronDown, X, Search, Filter as FilterIcon, Download, Database, Play, BarChart3, List, 
  Info, FileText, Network, ArrowLeft, ChevronUp, GitBranch, ArrowUpCircle, ArrowDownCircle 
} from 'lucide-react';

/**
 * Healthcare Organizations Directory
 * 
 * Premium search and filter interface for exploring the hco_flat table
 * - National or market-based view
 * - Rich filtering by geography, taxonomy, affiliations
 * - Clean, focused UI for provider discovery
 */

export default function HCOAnalysis() {
  const { npi } = useParams();
  const navigate = useNavigate();
  
  // Markets
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSearches, setFilterSearches] = useState({
    firmTypes: '',
    taxonomyClassifications: ''
  });
  const [filters, setFilters] = useState({
    states: [],
    cities: [],
    firmTypes: [],
    taxonomyClassifications: [],
    hasHospitalParent: null,
    hasPhysicianGroup: null,
    hasNetwork: null
  });
  
  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState({
    states: false,
    firmTypes: false,
    taxonomyClassifications: false,
    affiliations: true,
    basicInfo: true,
    taxonomies: true,
    procedures: true,
    diagnoses: true,
    upstream: true,
    downstream: true,
    allFields: false
  });
  
  // Filter options (populated from national overview or market data)
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    cities: [],
    firmTypes: [],
    taxonomyClassifications: []
  });
  
  // Results
  const [results, setResults] = useState(null);
  const [resultStats, setResultStats] = useState(null); // Stats for current search
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 100;
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, listing, detail
  
  // Detail view state
  const [selectedNPI, setSelectedNPI] = useState(null);
  const [profile, setProfile] = useState(null);
  const [volumeMetrics, setVolumeMetrics] = useState(null);
  const [topProcedures, setTopProcedures] = useState([]);
  const [diagnosisMetrics, setDiagnosisMetrics] = useState(null);
  const [topDiagnoses, setTopDiagnoses] = useState([]);
  const [pathways, setPathways] = useState({ upstream: [], downstream: [] });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [perspective, setPerspective] = useState('billing');
  const [upstreamPerspective, setUpstreamPerspective] = useState('billing');
  const [downstreamPerspective, setDownstreamPerspective] = useState('billing');
  const [detailTab, setDetailTab] = useState('overview'); // overview, pathways
  
  // Fetch markets and auto-load national view on mount
  useEffect(() => {
    fetchMarkets();
    // Auto-load national view
    searchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load detail view if NPI is in URL
  useEffect(() => {
    if (npi) {
      setSelectedNPI(npi);
      setActiveTab('detail');
      fetchProfile(npi);
    }
  }, [npi]);
  
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
    if (!market) return;
    
    setSelectedMarket(market);
    setResults(null);
    setFilters({
      states: [],
      cities: [],
      firmTypes: [],
      taxonomyClassifications: [],
      hasHospitalParent: null,
      hasPhysicianGroup: null,
      hasNetwork: null
    });
  };
  
  const searchOrganizations = async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    
    try {
      const requestBody = {
        search: searchTerm,
        states: filters.states,
        firmTypes: filters.firmTypes,
        taxonomyClassifications: filters.taxonomyClassifications,
        hasHospitalParent: filters.hasHospitalParent,
        hasNetwork: filters.hasNetwork,
        limit: 500
      };
      
      // Add market radius if selected
      if (selectedMarket) {
        requestBody.latitude = parseFloat(selectedMarket.latitude);
        requestBody.longitude = parseFloat(selectedMarket.longitude);
        requestBody.radius = parseFloat(selectedMarket.radius_miles);
      }
      
      const response = await fetch('/api/hco-data/search', {
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
      
      // Update filter options if they're included (from breakdowns)
      if (result.data.breakdowns) {
        setFilterOptions({
          states: result.data.breakdowns.states || [],
          firmTypes: result.data.breakdowns.firmTypes || [],
          taxonomyClassifications: result.data.breakdowns.taxonomies || [],
          cities: [] // Cities loaded on-demand by state
        });
      }
      
      console.log(`✅ Found ${result.data.totalCount} total organizations (showing ${result.data.count})`);
      
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
      cities: [],
      firmTypes: [],
      taxonomyClassifications: [],
      hasHospitalParent: null,
      hasPhysicianGroup: null,
      hasNetwork: null
    });
    setError(null);
    setPage(1);
    // Reload national view
    setTimeout(() => searchOrganizations(), 0);
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
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const exportToCSV = () => {
    if (!results || !results.organizations || results.organizations.length === 0) return;

    const headers = ['NPI', 'Name', 'Firm Type', 'City', 'State', 'ZIP', 'Taxonomy Classification', 'Hospital Parent', 'Network'];
    const csvContent = [
      headers.join(','),
      ...results.organizations.map(org => [
        org.npi,
        `"${(org.name || '').replace(/"/g, '""')}"`,
        `"${(org.firm_type || '').replace(/"/g, '""')}"`,
        `"${(org.city || '').replace(/"/g, '""')}"`,
        org.state || '',
        org.zip || '',
        `"${(org.taxonomy_classification || '').replace(/"/g, '""')}"`,
        org.hospital_parent_id ? 'Yes' : 'No',
        org.network_id ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hco-results-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseInt(num).toLocaleString();
  };
  
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };
  
  const handleSelectOrganization = (npi) => {
    setSelectedNPI(npi);
    setActiveTab('detail');
    navigate(`/app/hco/${npi}`);
  };
  
  const handleBackToListing = () => {
    setSelectedNPI(null);
    setProfile(null);
    setActiveTab('listing');
    navigate('/app/hco');
  };
  
  const fetchProfile = async (npi) => {
    setLoadingProfile(true);
    setProfileError(null);
    
    try {
      const params = new URLSearchParams({
        perspective,
        upstreamPerspective,
        downstreamPerspective
      });
      const response = await fetch(`/api/hco-directory/profile/${npi}?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load profile');
      }
      
      setProfile(result.data.profile);
      setVolumeMetrics(result.data.volumeMetrics);
      setTopProcedures(result.data.topProcedures);
      setDiagnosisMetrics(result.data.diagnosisMetrics);
      setTopDiagnoses(result.data.topDiagnoses);
      setPathways(result.data.pathways || { upstream: [], downstream: [] });
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfileError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };
  
  useEffect(() => {
    if (selectedNPI) {
      fetchProfile(selectedNPI);
    }
  }, [perspective, upstreamPerspective, downstreamPerspective]);
  
  // Get breakdowns from server response (based on ALL matching records)
  const getBreakdowns = () => {
    if (!results || !results.breakdowns) return null;
    
    const { breakdowns } = results;
    
    return {
      firmTypes: breakdowns.firmTypes?.map(f => ({ name: f.firm_type, count: parseInt(f.count) })) || [],
      states: breakdowns.states?.map(s => ({ name: s.state, count: parseInt(s.count) })) || [],
      cities: breakdowns.cities || [],
      taxonomies: breakdowns.taxonomies?.map(t => ({ name: t.taxonomy, count: parseInt(t.count) })) || [],
      affiliations: {
        hospitalParent: parseInt(breakdowns.affiliations?.hospital_parent || 0),
        network: parseInt(breakdowns.affiliations?.network || 0),
        independent: parseInt(breakdowns.affiliations?.independent || 0)
      }
    };
  };
  
  // Paginated results
  const paginatedResults = results ? results.organizations.slice((page - 1) * pageSize, page * pageSize) : [];
  const totalPages = results ? Math.ceil(results.organizations.length / pageSize) : 0;
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm || 
           filters.states.length > 0 ||
           filters.firmTypes.length > 0 ||
           filters.hasHospitalParent !== null ||
           filters.hasNetwork !== null;
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
                  selectedMarket.name : 
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
              <span>{formatNumber(results.totalCount)} organizations nationwide</span>
            )}
          </div>
        )}
        
        {hasActiveFilters() && (
          <button 
            onClick={clearAll}
            className="sectionHeaderButton"
          >
            <X size={14} />
            Clear All
          </button>
        )}
        
        <button 
          onClick={searchOrganizations}
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
        {selectedNPI && (
          <button 
            className={`${styles.tab} ${activeTab === 'detail' ? styles.active : ''}`}
            onClick={() => setActiveTab('detail')}
          >
            <Info size={16} />
            Detail
          </button>
        )}
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        
        {/* Left Sidebar - Filters */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Search & Filter</h3>
            <p>Find healthcare organizations</p>
          </div>

          {/* Search Input */}
          <div className={styles.filterGroup}>
            <div className={styles.filterSectionPadding}>
              <label className={styles.filterSectionLabel}>
                Organization Name or NPI
              </label>
              <div className="searchBarContainer">
                <div className="searchIcon">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') searchOrganizations();
                  }}
                  placeholder="Search organizations..."
                  className="searchInput"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="clearButton"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* State Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('states')}
            >
              <div className={styles.filterHeaderLeft}>
                <FilterIcon size={14} />
                <span>States</span>
                {filters.states.length > 0 && (
                  <span className={styles.filterBadge}>{filters.states.length}</span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                className={expandedSections.states ? styles.chevronExpanded : styles.chevronCollapsed}
              />
            </button>
            {expandedSections.states && (
              <div className={styles.filterContent}>
                <div className={styles.filterList}>
                  {filterOptions.states.map((state, idx) => (
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
            )}
          </div>

          {/* Firm Type Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('firmTypes')}
            >
              <div className={styles.filterHeaderLeft}>
                <FilterIcon size={14} />
                <span>Organization Type</span>
                {filters.firmTypes.length > 0 && (
                  <span className={styles.filterBadge}>{filters.firmTypes.length}</span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                className={expandedSections.firmTypes ? styles.chevronExpanded : styles.chevronCollapsed}
              />
            </button>
            {expandedSections.firmTypes && (
              <div className={styles.filterContent}>
                <input
                  type="text"
                  value={filterSearches.firmTypes}
                  onChange={(e) => setFilterSearches(prev => ({ ...prev, firmTypes: e.target.value }))}
                  placeholder="Search types..."
                  className={styles.filterSearchInput}
                />
                <div className={styles.filterList}>
                  {filterOptions.firmTypes
                    .filter(type => 
                      !filterSearches.firmTypes || 
                      type.firm_type.toLowerCase().includes(filterSearches.firmTypes.toLowerCase())
                    )
                    .map((type, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.firmTypes.includes(type.firm_type)}
                          onChange={() => toggleFilterValue('firmTypes', type.firm_type)}
                        />
                        <span className={styles.firmTypeName}>{type.firm_type}</span>
                        <span className={styles.filterCount}>({formatNumber(type.count)})</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Taxonomy Classification Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('taxonomyClassifications')}
            >
              <div className={styles.filterHeaderLeft}>
                <FilterIcon size={14} />
                <span>Service Classification</span>
                {filters.taxonomyClassifications.length > 0 && (
                  <span className={styles.filterBadge}>{filters.taxonomyClassifications.length}</span>
                )}
              </div>
              <ChevronDown 
                size={16} 
                className={expandedSections.taxonomyClassifications ? styles.chevronExpanded : styles.chevronCollapsed}
              />
            </button>
            {expandedSections.taxonomyClassifications && (
              <div className={styles.filterContent}>
                <input
                  type="text"
                  value={filterSearches.taxonomyClassifications}
                  onChange={(e) => setFilterSearches(prev => ({ ...prev, taxonomyClassifications: e.target.value }))}
                  placeholder="Search classifications..."
                  className={styles.filterSearchInput}
                />
                <div className={styles.filterList}>
                  {filterOptions.taxonomyClassifications
                    .filter(tax =>
                      !filterSearches.taxonomyClassifications ||
                      tax.taxonomy.toLowerCase().includes(filterSearches.taxonomyClassifications.toLowerCase())
                    )
                    .map((tax, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.taxonomyClassifications.includes(tax.taxonomy)}
                          onChange={() => toggleFilterValue('taxonomyClassifications', tax.taxonomy)}
                        />
                        <span className={styles.firmTypeName}>{tax.taxonomy}</span>
                        <span className={styles.filterCount}>({formatNumber(tax.count)})</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Affiliation Filters */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('affiliations')}
            >
              <div className={styles.filterHeaderLeft}>
                <FilterIcon size={14} />
                <span>Affiliations</span>
              </div>
              <ChevronDown 
                size={16} 
                className={expandedSections.affiliations ? styles.chevronExpanded : styles.chevronCollapsed}
              />
            </button>
            {expandedSections.affiliations && (
              <div className={styles.filterContent}>
                <div className={styles.booleanFilter}>
                  <span className={styles.booleanLabel}>Hospital Parent:</span>
                  <div className={styles.booleanButtons}>
                    <button
                      className={`${styles.booleanButton} ${filters.hasHospitalParent === true ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasHospitalParent', true)}
                    >
                      Yes
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasHospitalParent === false ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasHospitalParent', false)}
                    >
                      No
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasHospitalParent === null ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasHospitalParent', null)}
                    >
                      Any
                    </button>
                  </div>
                </div>

                <div className={styles.booleanFilter}>
                  <span className={styles.booleanLabel}>Network:</span>
                  <div className={styles.booleanButtons}>
                    <button
                      className={`${styles.booleanButton} ${filters.hasNetwork === true ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasNetwork', true)}
                    >
                      Yes
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasNetwork === false ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasNetwork', false)}
                    >
                      No
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasNetwork === null ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasNetwork', null)}
                    >
                      Any
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  <div className={styles.overviewLabel}>Total Organizations</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(results.totalCount)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Firm Types</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.distinct_firm_types)}
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
                  <div className={styles.overviewLabel}>With Hospital Parent</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.with_hospital_parent)}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>With Network</div>
                  <div className={styles.overviewValue}>
                    {formatNumber(resultStats.with_network)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Detailed Breakdowns */}
          {activeTab === 'overview' && results && results.organizations && (() => {
            const breakdowns = getBreakdowns();
            if (!breakdowns) return null;
            
            return (
              <div className={styles.breakdownsContainer}>
                {/* Top Firm Types */}
                <div className={styles.breakdownSection}>
                  <h4>Top Firm Types</h4>
                  <div className={styles.breakdownList}>
                    {breakdowns.firmTypes.map((item, idx) => (
                      <div key={idx} className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>{item.name}</span>
                        <div className={styles.breakdownBar}>
                          <div 
                            className={styles.breakdownBarFill}
                            style={{ width: `${(item.count / breakdowns.firmTypes[0].count) * 100}%` }}
                          />
                        </div>
                        <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Taxonomy Classifications */}
                <div className={styles.breakdownSection}>
                  <h4>Top Taxonomy Classifications</h4>
                  <div className={styles.breakdownList}>
                    {breakdowns.taxonomies.map((item, idx) => (
                      <div key={idx} className={styles.breakdownItem}>
                        <span className={styles.breakdownName}>{item.name}</span>
                        <div className={styles.breakdownBar}>
                          <div 
                            className={styles.breakdownBarFill}
                            style={{ width: `${(item.count / breakdowns.taxonomies[0].count) * 100}%` }}
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
                
                {/* Affiliations */}
                <div className={styles.breakdownSection}>
                  <h4>Affiliations</h4>
                  <div className={styles.breakdownList}>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownName}>With Hospital Parent</span>
                      <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.hospitalParent)}</span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownName}>With Network</span>
                      <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.network)}</span>
                    </div>
                    <div className={styles.breakdownItem}>
                      <span className={styles.breakdownName}>Independent</span>
                      <span className={styles.breakdownCount}>{formatNumber(breakdowns.affiliations.independent)}</span>
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
                    Organizations List
                    {results.limited && <span className={styles.limitWarning}> (Showing {results.count} of {formatNumber(results.totalCount)})</span>}
                  </>
                ) : 'Organizations'}
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
                <h2>Search Healthcare Organizations</h2>
                <p>
                  {selectedMarket 
                    ? `Search within ${selectedMarket.name} or select "National View" to search all organizations`
                    : 'Configure filters and click "Search", or just click "Search" to see first 500 organizations'
                  }
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
                        <th>Organization</th>
                        <th>Type</th>
                        <th>Classification</th>
                        <th>Location</th>
                        <th>Affiliations</th>
                        {selectedMarket && <th>Distance</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((org, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => handleSelectOrganization(org.npi)}
                          style={{ cursor: 'pointer' }}
                          className={styles.clickableRow}
                        >
                          <td>
                            <div className={styles.orgCell}>
                              <div className={styles.orgName}>{org.name}</div>
                              <div className={styles.orgNpi}>NPI: {org.npi}</div>
                            </div>
                          </td>
                          <td>{org.firm_type || '-'}</td>
                          <td>{org.taxonomy_classification || '-'}</td>
                          <td>
                            <div className={styles.locationCell}>
                              <div>{org.city}, {org.state}</div>
                              <div className={styles.zip}>{org.zip}</div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.affiliationCell}>
                              {org.hospital_parent_id && <span className={styles.affiliationBadge}>Hospital</span>}
                              {org.physician_group_parent_id && <span className={styles.affiliationBadge}>PG</span>}
                              {org.network_id && <span className={styles.affiliationBadge}>Network</span>}
                              {!org.hospital_parent_id && !org.physician_group_parent_id && !org.network_id && <span className={styles.noAffiliation}>Independent</span>}
                            </div>
                          </td>
                          {selectedMarket && (
                            <td>
                              {org.distance_miles ? `${org.distance_miles.toFixed(1)} mi` : '-'}
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
          
          {/* Detail Tab */}
          {activeTab === 'detail' && selectedNPI && (
            <div className={styles.detailView}>
              {loadingProfile && (
                <div className={styles.loadingOverlay}>
                  <Spinner />
                  <p>Loading organization profile...</p>
                </div>
              )}
              
              {profileError && (
                <div className={styles.errorState}>
                  <h2>Error Loading Profile</h2>
                  <p>{profileError}</p>
                  <button onClick={handleBackToListing} className="sectionHeaderButton">
                    <ArrowLeft size={14} />
                    Back to Listing
                  </button>
                </div>
              )}
              
              {profile && !loadingProfile && (
                <>
                  {/* Profile Header */}
                  <div className={styles.profileHeader}>
                    <button onClick={handleBackToListing} className="sectionHeaderButton">
                      <ArrowLeft size={14} />
                      Back to Listing
                    </button>
                    <div className={styles.profileTitle}>
                      <Building2 size={24} />
                      <div>
                        <h2>{profile.healthcare_organization_name || profile.name}</h2>
                        <p>NPI: {profile.npi}</p>
                      </div>
                    </div>
                    <div className={styles.perspectiveSelector}>
                      <label>Perspective:</label>
                      <select value={perspective} onChange={(e) => setPerspective(e.target.value)}>
                        <option value="billing">Billing</option>
                        <option value="facility">Facility</option>
                        <option value="service_location">Service Location</option>
                        <option value="performing">Performing</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Detail Tab Navigation */}
                  <div className={styles.detailTabNav}>
                    <button 
                      className={`${styles.detailTab} ${detailTab === 'overview' ? styles.active : ''}`}
                      onClick={() => setDetailTab('overview')}
                    >
                      <Info size={16} />
                      Overview
                    </button>
                    <button 
                      className={`${styles.detailTab} ${detailTab === 'pathways' ? styles.active : ''}`}
                      onClick={() => setDetailTab('pathways')}
                    >
                      <GitBranch size={16} />
                      Pathways
                    </button>
                  </div>
                  
                  <div className={styles.profileContent}>
                    {/* Overview Tab */}
                    {detailTab === 'overview' && (
                      <div className={styles.overviewContent}>
                        {/* Basic Info */}
                        <div className={styles.profileSection}>
                          <button 
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('basicInfo')}
                          >
                            <div className={styles.sectionTitle}>
                              <Info size={16} />
                              <h3>Basic Information</h3>
                            </div>
                            {expandedSections.basicInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {expandedSections.basicInfo && (
                            <div className={styles.sectionContent}>
                              <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                  <label>Organization Name</label>
                                  <div>{profile.healthcare_organization_name || profile.name}</div>
                                </div>
                                <div className={styles.infoItem}>
                                  <label>NPI</label>
                                  <div>{profile.npi}</div>
                                </div>
                                {profile.definitive_id && (
                                  <div className={styles.infoItem}>
                                    <label>Definitive ID</label>
                                    <div>{profile.definitive_id}</div>
                                  </div>
                                )}
                                {profile.definitive_firm_type && (
                                  <div className={styles.infoItem}>
                                    <label>Firm Type</label>
                                    <div>{profile.definitive_firm_type}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Address */}
                        <div className={styles.profileSection}>
                          <div className={styles.sectionHeader} style={{ cursor: 'default' }}>
                            <div className={styles.sectionTitle}>
                              <MapPin size={16} />
                              <h3>Address & Location</h3>
                            </div>
                          </div>
                          <div className={styles.sectionContent}>
                            <div className={styles.addressBlock}>
                              {profile.primary_address_line_1 && <div>{profile.primary_address_line_1}</div>}
                              {profile.primary_address_line_2 && <div>{profile.primary_address_line_2}</div>}
                              <div>
                                {profile.primary_address_city && `${profile.primary_address_city}, `}
                                {profile.primary_address_state_or_province} {profile.primary_address_zip5}
                              </div>
                              {profile.primary_address_county && (
                                <div>{profile.primary_address_county} County</div>
                              )}
                            </div>
                            {profile.primary_address_lat && profile.primary_address_long && (
                              <div className={styles.mapContainer}>
                                <SimpleLocationMap
                                  center={{
                                    lat: parseFloat(profile.primary_address_lat),
                                    lng: parseFloat(profile.primary_address_long)
                                  }}
                                  zoom={15}
                                  markerLabel={profile.healthcare_organization_name || profile.name}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Taxonomies */}
                        <div className={styles.profileSection}>
                          <button 
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('taxonomies')}
                          >
                            <div className={styles.sectionTitle}>
                              <FileText size={16} />
                              <h3>Taxonomies</h3>
                            </div>
                            {expandedSections.taxonomies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {expandedSections.taxonomies && (
                            <div className={styles.sectionContent}>
                              <div className={styles.infoGrid}>
                                {profile.primary_taxonomy_code && (
                                  <div className={styles.infoItem}>
                                    <label>Taxonomy Code</label>
                                    <div>{profile.primary_taxonomy_code}</div>
                                  </div>
                                )}
                                {profile.primary_taxonomy_classification && (
                                  <div className={styles.infoItem}>
                                    <label>Classification</label>
                                    <div>{profile.primary_taxonomy_classification}</div>
                                  </div>
                                )}
                                {profile.primary_taxonomy_consolidated_specialty && (
                                  <div className={styles.infoItem}>
                                    <label>Consolidated Specialty</label>
                                    <div>{profile.primary_taxonomy_consolidated_specialty}</div>
                                  </div>
                                )}
                                {profile.primary_taxonomy_grouping && (
                                  <div className={styles.infoItem}>
                                    <label>Grouping</label>
                                    <div>{profile.primary_taxonomy_grouping}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Affiliations */}
                        <div className={styles.profileSection}>
                          <button 
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('affiliations')}
                          >
                            <div className={styles.sectionTitle}>
                              <Network size={16} />
                              <h3>Affiliations</h3>
                            </div>
                            {expandedSections.affiliations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {expandedSections.affiliations && (
                            <div className={styles.sectionContent}>
                              <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                  <label>Hospital Parent</label>
                                  <div>{profile.hospital_parent_name || 'None'}</div>
                                </div>
                                <div className={styles.infoItem}>
                                  <label>Physician Group Parent</label>
                                  <div>{profile.physician_group_parent_name || 'None'}</div>
                                </div>
                                <div className={styles.infoItem}>
                                  <label>Network</label>
                                  <div>{profile.network_name || 'None'}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Procedure Volume */}
                        {volumeMetrics && (
                          <div className={styles.profileSection}>
                            <button 
                              className={styles.sectionHeader}
                              onClick={() => toggleSection('procedures')}
                            >
                              <div className={styles.sectionTitle}>
                                <BarChart3 size={16} />
                                <h3>Procedure Volume (Last 12 Months)</h3>
                              </div>
                              {expandedSections.procedures ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {expandedSections.procedures && (
                              <div className={styles.sectionContent}>
                                <div className={styles.metricsGrid}>
                                  <div className={styles.metricCard}>
                                    <label>Total Procedures</label>
                                    <div className={styles.metricValue}>{formatNumber(volumeMetrics.totalProcedures)}</div>
                                  </div>
                                  <div className={styles.metricCard}>
                                    <label>Total Charges</label>
                                    <div className={styles.metricValue}>{formatCurrency(volumeMetrics.totalCharges)}</div>
                                  </div>
                                  <div className={styles.metricCard}>
                                    <label>Unique Procedures</label>
                                    <div className={styles.metricValue}>{formatNumber(volumeMetrics.uniqueProcedures)}</div>
                                  </div>
                                  <div className={styles.metricCard}>
                                    <label>Months with Data</label>
                                    <div className={styles.metricValue}>{volumeMetrics.monthsWithData}</div>
                                  </div>
                                </div>
                                {topProcedures && topProcedures.length > 0 && (
                                  <div className={styles.dataTable}>
                                    <h4>Top Procedures</h4>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Code</th>
                                          <th>Description</th>
                                          <th>Service Line</th>
                                          <th>Count</th>
                                          <th>Charges</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {topProcedures.map((proc, idx) => (
                                          <tr key={idx}>
                                            <td>{proc.code}</td>
                                            <td>{proc.code_description || '-'}</td>
                                            <td>{proc.service_line_description || '-'}</td>
                                            <td>{formatNumber(proc.procedure_count)}</td>
                                            <td>{formatCurrency(proc.total_charges)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Diagnosis Volume */}
                        {diagnosisMetrics && (
                          <div className={styles.profileSection}>
                            <button 
                              className={styles.sectionHeader}
                              onClick={() => toggleSection('diagnoses')}
                            >
                              <div className={styles.sectionTitle}>
                                <FileText size={16} />
                                <h3>Diagnosis Volume (Last 12 Months)</h3>
                              </div>
                              {expandedSections.diagnoses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {expandedSections.diagnoses && (
                              <div className={styles.sectionContent}>
                                <div className={styles.metricsGrid}>
                                  <div className={styles.metricCard}>
                                    <label>Total Diagnoses</label>
                                    <div className={styles.metricValue}>{formatNumber(diagnosisMetrics.totalDiagnoses)}</div>
                                  </div>
                                  <div className={styles.metricCard}>
                                    <label>Unique Diagnoses</label>
                                    <div className={styles.metricValue}>{formatNumber(diagnosisMetrics.uniqueDiagnoses)}</div>
                                  </div>
                                  <div className={styles.metricCard}>
                                    <label>Months with Data</label>
                                    <div className={styles.metricValue}>{diagnosisMetrics.monthsWithData}</div>
                                  </div>
                                </div>
                                {topDiagnoses && topDiagnoses.length > 0 && (
                                  <div className={styles.dataTable}>
                                    <h4>Top Diagnoses</h4>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Code</th>
                                          <th>Description</th>
                                          <th>Count</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {topDiagnoses.map((diag, idx) => (
                                          <tr key={idx}>
                                            <td>{diag.code}</td>
                                            <td>{diag.code_description || '-'}</td>
                                            <td>{formatNumber(diag.diagnosis_count)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Pathways Tab */}
                    {detailTab === 'pathways' && (
                      <div className={styles.pathwaysContent}>
                        {/* Upstream Pathways */}
                        <div className={styles.profileSection}>
                          <button 
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('upstream')}
                          >
                            <div className={styles.sectionTitle}>
                              <ArrowUpCircle size={16} />
                              <h3>Upstream Pathways (Where Patients Came From)</h3>
                            </div>
                            {expandedSections.upstream ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {expandedSections.upstream && (
                            <div className={styles.sectionContent}>
                              <div className={styles.pathwayControls}>
                                <p>Top 15 providers that sent patients to this organization (last 12 months, within 14 days)</p>
                                <div className={styles.perspectiveSelector}>
                                  <label>Show as:</label>
                                  <select value={upstreamPerspective} onChange={(e) => setUpstreamPerspective(e.target.value)}>
                                    <option value="billing">Billing</option>
                                    <option value="facility">Facility</option>
                                    <option value="service_location">Service Location</option>
                                    <option value="performing">Performing</option>
                                  </select>
                                </div>
                              </div>
                              {pathways && pathways.upstream && pathways.upstream.length > 0 ? (
                                <div className={styles.dataTable}>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Rank</th>
                                        <th>Provider</th>
                                        <th>Taxonomy</th>
                                        <th>Location</th>
                                        <th>Patient Count</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pathways.upstream.map((provider, idx) => (
                                        <tr key={idx}>
                                          <td>{idx + 1}</td>
                                          <td>
                                            <div>
                                              <div style={{ fontWeight: '500' }}>{provider.provider_name}</div>
                                              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>NPI: {provider.npi}</div>
                                            </div>
                                          </td>
                                          <td>{provider.taxonomy || '-'}</td>
                                          <td>{provider.city}, {provider.state}</td>
                                          <td>{formatNumber(provider.patient_count)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className={styles.noData}>No upstream pathway data available</div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Downstream Pathways */}
                        <div className={styles.profileSection}>
                          <button 
                            className={styles.sectionHeader}
                            onClick={() => toggleSection('downstream')}
                          >
                            <div className={styles.sectionTitle}>
                              <ArrowDownCircle size={16} />
                              <h3>Downstream Pathways (Where Patients Went To)</h3>
                            </div>
                            {expandedSections.downstream ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {expandedSections.downstream && (
                            <div className={styles.sectionContent}>
                              <div className={styles.pathwayControls}>
                                <p>Top 15 providers that received patients from this organization (last 12 months, within 14 days)</p>
                                <div className={styles.perspectiveSelector}>
                                  <label>Show as:</label>
                                  <select value={downstreamPerspective} onChange={(e) => setDownstreamPerspective(e.target.value)}>
                                    <option value="billing">Billing</option>
                                    <option value="facility">Facility</option>
                                    <option value="service_location">Service Location</option>
                                    <option value="performing">Performing</option>
                                  </select>
                                </div>
                              </div>
                              {pathways && pathways.downstream && pathways.downstream.length > 0 ? (
                                <div className={styles.dataTable}>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Rank</th>
                                        <th>Provider</th>
                                        <th>Taxonomy</th>
                                        <th>Location</th>
                                        <th>Patient Count</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pathways.downstream.map((provider, idx) => (
                                        <tr key={idx}>
                                          <td>{idx + 1}</td>
                                          <td>
                                            <div>
                                              <div style={{ fontWeight: '500' }}>{provider.provider_name}</div>
                                              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>NPI: {provider.npi}</div>
                                            </div>
                                          </td>
                                          <td>{provider.taxonomy || '-'}</td>
                                          <td>{provider.city}, {provider.state}</td>
                                          <td>{formatNumber(provider.patient_count)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className={styles.noData}>No downstream pathway data available</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

