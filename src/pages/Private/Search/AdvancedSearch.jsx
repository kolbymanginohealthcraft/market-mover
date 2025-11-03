import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import styles from './AdvancedSearch.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import Spinner from '../../../components/Buttons/Spinner';
import { Users, MapPin, ChevronDown, X, Search, Filter as FilterIcon, Download, Database, Play, BarChart3, List, Bookmark, Layers, Navigation } from 'lucide-react';
import { geocodeAddress } from '../Markets/services/geocodingService';

export default function AdvancedSearch() {
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
    hasNetworkAffiliation: null,
    taxonomyCodes: []
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    specialties: []
  });
  
  // My Taxonomies
  const [taxonomyTags, setTaxonomyTags] = useState([]);
  const [selectedTaxonomyTag, setSelectedTaxonomyTag] = useState(null);
  const [taxonomyDropdownOpen, setTaxonomyDropdownOpen] = useState(false);
  
  // Results
  const [results, setResults] = useState(null);
  const [resultStats, setResultStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 100;
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, listing, density
  
  // Density tab state
  const [densityLocationInput, setDensityLocationInput] = useState('');
  const [densityLocationMode, setDensityLocationMode] = useState('address'); // address, coordinates, zip
  const [densityCoordinates, setDensityCoordinates] = useState({ lat: null, lng: null });
  const [densityLoading, setDensityLoading] = useState(false);
  const [densityError, setDensityError] = useState(null);
  const [densityResults, setDensityResults] = useState(null);
  const [taxonomyDetails, setTaxonomyDetails] = useState({}); // Map of code -> details
  
  useEffect(() => {
    fetchMarkets();
    fetchTaxonomyTags();
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

  const fetchTaxonomyTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setTaxonomyTags([]);
        return;
      }

      const { data, error } = await supabase
        .from('team_taxonomy_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTaxonomyTags(data || []);
    } catch (err) {
      console.error('Error fetching taxonomy tags:', err);
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
      hasNetworkAffiliation: null,
      taxonomyCodes: []
    });
  };

  const handleTaxonomyTagSelect = (tagId) => {
    if (!tagId) {
      setSelectedTaxonomyTag(null);
      setFilters(prev => ({ ...prev, taxonomyCodes: [] }));
      return;
    }
    
    const tag = taxonomyTags.find(t => t.id === tagId);
    if (tag) {
      setSelectedTaxonomyTag(tag);
      setFilters(prev => ({ ...prev, taxonomyCodes: [tag.taxonomy_code] }));
    }
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
        taxonomyCodes: filters.taxonomyCodes,
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
      hasNetworkAffiliation: null,
      taxonomyCodes: []
    });
    setSelectedTaxonomyTag(null);
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

  // Handle density location input and geocoding
  const handleDensityLocationSearch = async () => {
    if (!densityLocationInput.trim()) {
      setDensityError('Please enter a location');
      return;
    }

    setDensityLoading(true);
    setDensityError(null);

    try {
      let coords = null;

      if (densityLocationMode === 'coordinates') {
        // Parse coordinates (e.g., "40.7128, -74.0060" or "40.7128,-74.0060")
        const parts = densityLocationInput.trim().split(/[,\s]+/).filter(p => p);
        if (parts.length !== 2) {
          throw new Error('Invalid coordinates format. Use: latitude, longitude');
        }
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinates. Please use numbers only.');
        }
        if (lat < -90 || lat > 90) {
          throw new Error('Latitude must be between -90 and 90');
        }
        if (lng < -180 || lng > 180) {
          throw new Error('Longitude must be between -180 and 180');
        }
        coords = { lat, lng };
      } else if (densityLocationMode === 'address' || densityLocationMode === 'zip') {
        // Geocode address or zip code
        coords = await geocodeAddress(densityLocationInput);
      }

      if (!coords) {
        throw new Error('Could not determine location coordinates');
      }

      setDensityCoordinates(coords);
      await fetchTaxonomyDensity(coords);
    } catch (err) {
      console.error('Error processing location:', err);
      setDensityError(err.message || 'Failed to process location');
      setDensityLoading(false);
    }
  };

  // Fetch taxonomy density data
  const fetchTaxonomyDensity = async (coords) => {
    try {
      const requestBody = {
        latitude: coords.lat,
        longitude: coords.lng
      };

      // If taxonomy tags are selected, filter by them
      if (selectedTaxonomyTag) {
        requestBody.taxonomyCodes = [selectedTaxonomyTag.taxonomy_code];
      }

      const response = await fetch('/api/hcp-data/taxonomy-density', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch density data');
      }

      setDensityResults(result.data);

      // Fetch taxonomy details for display
      if (result.data && result.data.length > 0) {
        const codes = result.data.map(r => r.taxonomy_code);
        const detailsResponse = await fetch('/api/taxonomies-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes })
        });

        const detailsResult = await detailsResponse.json();
        if (detailsResult.success) {
          const detailsMap = {};
          detailsResult.data.forEach(detail => {
            detailsMap[detail.code] = detail;
          });
          setTaxonomyDetails(detailsMap);
        }
      }

    } catch (err) {
      console.error('Error fetching density:', err);
      setDensityError(err.message || 'Failed to fetch density data');
    } finally {
      setDensityLoading(false);
    }
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
           filters.taxonomyCodes.length > 0 ||
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

        {taxonomyTags.length > 0 && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                <Bookmark size={14} />
                {selectedTaxonomyTag ? 
                  `${selectedTaxonomyTag.taxonomy_code}` : 
                  'My Taxonomies'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={taxonomyDropdownOpen}
            onToggle={setTaxonomyDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleTaxonomyTagSelect(null);
                setTaxonomyDropdownOpen(false);
              }}
            >
              All Taxonomies
            </button>
            {taxonomyTags.map(tag => (
              <button 
                key={tag.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleTaxonomyTagSelect(tag.id);
                  setTaxonomyDropdownOpen(false);
                }}
                style={{
                  fontWeight: selectedTaxonomyTag?.id === tag.id ? '600' : '500',
                  background: selectedTaxonomyTag?.id === tag.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                }}
              >
                <code style={{ fontSize: '11px', fontFamily: 'monospace' }}>{tag.taxonomy_code}</code>
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
        <button 
          className={`${styles.tab} ${activeTab === 'density' ? styles.active : ''}`}
          onClick={() => setActiveTab('density')}
        >
          <Layers size={16} />
          Density
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
                        <th>Phone</th>
                        <th>Affiliations</th>
                        {selectedMarket && <th>Distance</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((practitioner, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className={styles.practitionerCell}>
                              <div className={styles.practitionerName}>
                                {practitioner.title && <span className={styles.practitionerTitle}>{practitioner.title} </span>}
                                {practitioner.name}
                              </div>
                              <div className={styles.practitionerNpi}>NPI: {practitioner.npi}</div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.specialtyCell}>
                              {practitioner.taxonomy_classification || practitioner.consolidated_specialty || '-'}
                            </div>
                          </td>
                          <td>
                            <div className={styles.locationCell}>
                              {practitioner.address_line_1 && (
                                <div className={styles.streetAddress}>{practitioner.address_line_1}</div>
                              )}
                              {practitioner.address_line_2 && (
                                <div className={styles.streetAddress}>{practitioner.address_line_2}</div>
                              )}
                              <div>{practitioner.city}, {practitioner.state}</div>
                              <div className={styles.zip}>{practitioner.zip}</div>
                            </div>
                          </td>
                          <td>{practitioner.phone || '-'}</td>
                          <td>
                            <div className={styles.affiliationCell}>
                              {practitioner.hospital_affiliation && (
                                <span className={styles.affiliationBadge} title={practitioner.hospital_name || 'Hospital'}>
                                  {practitioner.hospital_name || 'Hospital'}
                                </span>
                              )}
                              {practitioner.physician_group_affiliation && (
                                <span className={styles.affiliationBadge} title={practitioner.physician_group_name || 'Physician Group'}>
                                  {practitioner.physician_group_name || 'PG'}
                                </span>
                              )}
                              {practitioner.network_affiliation && (
                                <span className={styles.affiliationBadge} title={practitioner.network_name || 'Network'}>
                                  {practitioner.network_name || 'Network'}
                                </span>
                              )}
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

          {/* Density Tab */}
          {activeTab === 'density' && (
            <div className={styles.densityPanel}>
              <div className={styles.densityHeader}>
                <h3>
                  <Layers size={16} />
                  Taxonomy Density Analysis
                </h3>
                <p>Enter a location to see HCP counts by taxonomy within 10, 20, and 30 mile radius bands</p>
              </div>

              {/* Location Input */}
              <div className={styles.densityControls}>
                <div className={styles.locationModeSelector}>
                  <label>
                    <input
                      type="radio"
                      name="locationMode"
                      value="address"
                      checked={densityLocationMode === 'address'}
                      onChange={(e) => setDensityLocationMode(e.target.value)}
                    />
                    Address
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="locationMode"
                      value="coordinates"
                      checked={densityLocationMode === 'coordinates'}
                      onChange={(e) => setDensityLocationMode(e.target.value)}
                    />
                    Coordinates
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="locationMode"
                      value="zip"
                      checked={densityLocationMode === 'zip'}
                      onChange={(e) => setDensityLocationMode(e.target.value)}
                    />
                    ZIP Code
                  </label>
                </div>

                <div className={styles.locationInputWrapper}>
                  <input
                    type="text"
                    value={densityLocationInput}
                    onChange={(e) => setDensityLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDensityLocationSearch();
                    }}
                    placeholder={
                      densityLocationMode === 'coordinates' 
                        ? 'e.g., 40.7128, -74.0060'
                        : densityLocationMode === 'zip'
                        ? 'e.g., 10001'
                        : 'e.g., New York, NY or 123 Main St, Boston, MA'
                    }
                    className={styles.densityInput}
                    disabled={densityLoading}
                  />
                  <button
                    onClick={handleDensityLocationSearch}
                    className="sectionHeaderButton primary"
                    disabled={densityLoading || !densityLocationInput.trim()}
                  >
                    <Navigation size={14} />
                    {densityLoading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>

                {densityError && (
                  <div className={styles.densityError}>
                    {densityError}
                  </div>
                )}

                {densityCoordinates.lat && (
                  <div className={styles.densityLocation}>
                    <MapPin size={14} />
                    Location: {densityCoordinates.lat.toFixed(6)}, {densityCoordinates.lng.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Density Results */}
              {densityLoading && (
                <div className={styles.densityLoading}>
                  <Spinner />
                  <p>Analyzing taxonomy density...</p>
                </div>
              )}

              {!densityLoading && densityResults && (
                <div className={styles.densityResults}>
                  <div className={styles.densityTableWrapper}>
                    <table className={styles.densityTable}>
                      <thead>
                        <tr>
                          <th>Taxonomy Code</th>
                          <th>Classification</th>
                          <th>0-10 mi</th>
                          <th>10-20 mi</th>
                          <th>20-30 mi</th>
                          <th>Total (30 mi)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {densityResults.map((row, idx) => {
                          const details = taxonomyDetails[row.taxonomy_code];
                          return (
                            <tr key={idx}>
                              <td>
                                <code className={styles.taxonomyCode}>{row.taxonomy_code}</code>
                              </td>
                              <td>
                                {details?.classification || '-'}
                              </td>
                              <td className={styles.countCell}>{formatNumber(row.count_10mi)}</td>
                              <td className={styles.countCell}>{formatNumber(row.count_10_20mi)}</td>
                              <td className={styles.countCell}>{formatNumber(row.count_20_30mi)}</td>
                              <td className={styles.totalCell}>{formatNumber(row.count_30mi_total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {densityResults.length === 0 && (
                    <div className={styles.emptyState}>
                      <Database size={48} />
                      <h2>No Results Found</h2>
                      <p>No HCPs found with the selected taxonomies in this area</p>
                    </div>
                  )}
                </div>
              )}

              {!densityLoading && !densityResults && (
                <div className={styles.densityEmpty}>
                  <Layers size={48} />
                  <h2>Enter Location to Analyze</h2>
                  <p>Use the input above to specify a location and view taxonomy density</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
