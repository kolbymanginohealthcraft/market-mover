import { useState, useEffect, useRef } from 'react';
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
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
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
  const [taxonomyTagDetails, setTaxonomyTagDetails] = useState({}); // Map of taxonomy_code -> details
  
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
  
  // Collapsible filter pane
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  
  // Collapsible filter sections (default to collapsed like org search)
  const [expandedSections, setExpandedSections] = useState({
    states: false,
    specialties: false,
    gender: false,
    affiliations: false
  });
  
  // Density tab state
  const [densityLocationInput, setDensityLocationInput] = useState('');
  const [densityLocationMode, setDensityLocationMode] = useState('address'); // address, coordinates, zip
  const [densityCoordinates, setDensityCoordinates] = useState({ lat: null, lng: null });
  const [densityLoading, setDensityLoading] = useState(false);
  const [densityError, setDensityError] = useState(null);
  const [densityResults, setDensityResults] = useState(null);
  const [taxonomyDetails, setTaxonomyDetails] = useState({}); // Map of code -> details
  
  // Search input refs and escape handling
  const searchInputRef = useRef(null);
  const escapeTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);
  const isClearingRef = useRef(false);
  const [escapeCount, setEscapeCount] = useState(0);
  
  useEffect(() => {
    fetchMarkets();
    fetchTaxonomyTags();
    // Load national view by default (search with no filters)
    searchPractitioners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus search input on page load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Auto-search when filters change (except search term which requires submit)
  useEffect(() => {
    // Skip the first render (initial mount) - search is already handled by the initial useEffect
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    // Skip if we're in the middle of clearing all filters
    if (isClearingRef.current) {
      return;
    }
    // Search when filters change (market, taxonomy tag, or filter values)
    searchPractitioners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarket, selectedTaxonomyTag, filters.states, filters.specialties, filters.gender, filters.taxonomyCodes, filters.hasHospitalAffiliation, filters.hasPhysicianGroupAffiliation, filters.hasNetworkAffiliation]);
  
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

      // Fetch taxonomy details for all taxonomy codes
      if (data && data.length > 0) {
        const codes = [...new Set(data.map(tag => tag.taxonomy_code))];
        try {
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
            setTaxonomyTagDetails(detailsMap);
          }
        } catch (detailsErr) {
          console.error('Error fetching taxonomy details:', detailsErr);
        }
      }
    } catch (err) {
      console.error('Error fetching taxonomy tags:', err);
    }
  };
  
  const handleMarketSelect = (marketId) => {
    if (!marketId) {
      setSelectedMarket(null);
      // Search will be triggered by useEffect when selectedMarket changes
      return;
    }
    
    const market = markets.find(m => m.id === marketId);
    if (!market) {
      console.error('Market not found:', marketId);
      return;
    }
    
    setSelectedMarket(market);
    // Search will be triggered by useEffect when selectedMarket changes
    // Filters are preserved - they will be applied along with the market filter
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

  const handleTaxonomyTagTypeSelect = (tagType) => {
    // Select all taxonomies of a specific tag type
    const tagsOfType = taxonomyTags.filter(t => t.tag_type === tagType);
    const codes = tagsOfType.map(t => t.taxonomy_code);
    
    setSelectedTaxonomyTag(null); // Clear single tag selection
    setFilters(prev => ({ ...prev, taxonomyCodes: codes }));
  };
  
  const searchPractitioners = async (overrides = {}) => {
    setLoading(true);
    setError(null);
    setPage(1);
    
    try {
      // Use override values if provided, otherwise use current state
      // Use submittedSearchTerm for the actual search (what's applied), not the typing searchTerm
      const currentSearchTerm = overrides.searchTerm !== undefined ? overrides.searchTerm : submittedSearchTerm;
      const currentFilters = overrides.filters !== undefined ? overrides.filters : filters;
      const currentSelectedMarket = overrides.selectedMarket !== undefined ? overrides.selectedMarket : selectedMarket;
      
      const requestBody = {
        search: currentSearchTerm,
        states: currentFilters.states,
        consolidatedSpecialty: currentFilters.specialties,
        gender: currentFilters.gender,
        hasHospitalAffiliation: currentFilters.hasHospitalAffiliation,
        hasPhysicianGroupAffiliation: currentFilters.hasPhysicianGroupAffiliation,
        hasNetworkAffiliation: currentFilters.hasNetworkAffiliation,
        taxonomyCodes: currentFilters.taxonomyCodes,
        limit: 500
      };
      
      if (currentSelectedMarket && currentSelectedMarket.latitude && currentSelectedMarket.longitude && currentSelectedMarket.radius_miles) {
        requestBody.latitude = parseFloat(currentSelectedMarket.latitude);
        requestBody.longitude = parseFloat(currentSelectedMarket.longitude);
        requestBody.radius = parseFloat(currentSelectedMarket.radius_miles);
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
    // Set flag to prevent useEffect from triggering during clear
    isClearingRef.current = true;
    
    // Prepare cleared values
    const clearedFilters = {
      states: [],
      specialties: [],
      gender: [],
      hasHospitalAffiliation: null,
      hasPhysicianGroupAffiliation: null,
      hasNetworkAffiliation: null,
      taxonomyCodes: []
    };
    
    // Clear all state
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setFilters(clearedFilters);
    setSelectedTaxonomyTag(null);
    setSelectedMarket(null);
    setError(null);
    setPage(1);
    
    // Use setTimeout to ensure all state updates are processed before searching
    // and reset the clearing flag. Pass explicit cleared values to avoid stale closure issues.
    setTimeout(() => {
      isClearingRef.current = false;
      searchPractitioners({
        searchTerm: '',
        filters: clearedFilters,
        selectedMarket: null
      });
    }, 0);
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

      // Add search term filter
      if (searchTerm.trim()) {
        requestBody.search = searchTerm.trim();
      }

      // Add taxonomy codes filter (from selected taxonomy tag or filters)
      const taxonomyCodesToFilter = [];
      if (selectedTaxonomyTag) {
        taxonomyCodesToFilter.push(selectedTaxonomyTag.taxonomy_code);
      }
      if (filters.taxonomyCodes && filters.taxonomyCodes.length > 0) {
        taxonomyCodesToFilter.push(...filters.taxonomyCodes);
      }
      if (taxonomyCodesToFilter.length > 0) {
        requestBody.taxonomyCodes = [...new Set(taxonomyCodesToFilter)]; // Remove duplicates
      }

      // Add state filters
      if (filters.states && filters.states.length > 0) {
        requestBody.states = filters.states;
      }

      // Add specialty filters
      if (filters.specialties && filters.specialties.length > 0) {
        requestBody.consolidatedSpecialty = filters.specialties;
      }

      // Add gender filters
      if (filters.gender && filters.gender.length > 0) {
        requestBody.gender = filters.gender;
      }

      // Add affiliation filters
      if (filters.hasHospitalAffiliation !== null) {
        requestBody.hasHospitalAffiliation = filters.hasHospitalAffiliation;
      }
      if (filters.hasPhysicianGroupAffiliation !== null) {
        requestBody.hasPhysicianGroupAffiliation = filters.hasPhysicianGroupAffiliation;
      }
      if (filters.hasNetworkAffiliation !== null) {
        requestBody.hasNetworkAffiliation = filters.hasNetworkAffiliation;
      }

      // Add market location constraints if market is selected
      if (selectedMarket) {
        requestBody.marketLatitude = parseFloat(selectedMarket.latitude);
        requestBody.marketLongitude = parseFloat(selectedMarket.longitude);
        requestBody.marketRadius = parseFloat(selectedMarket.radius_miles);
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
  
  // Extract unique filter options from RESULTS (current filtered results)
  // This ensures filter options update in real-time as filters are toggled
  const availableStates = results && results.practitioners && results.practitioners.length > 0
    ? Array.from(new Set(results.practitioners.map(p => p.state).filter(Boolean)))
        .map(state => ({ state, count: results.practitioners.filter(p => p.state === state).length }))
    : filterOptions.states;
  
  const availableSpecialties = results && results.practitioners && results.practitioners.length > 0
    ? Array.from(new Set(results.practitioners.map(p => p.consolidated_specialty || p.primary_specialty).filter(Boolean)))
        .map(specialty => ({ specialty, count: results.practitioners.filter(p => (p.consolidated_specialty || p.primary_specialty) === specialty).length }))
    : filterOptions.specialties;
  
  const paginatedResults = results ? results.practitioners.slice((page - 1) * pageSize, page * pageSize) : [];
  const totalPages = results ? Math.ceil(results.practitioners.length / pageSize) : 0;
  
  const hasActiveFilters = () => {
    return submittedSearchTerm || 
           filters.states.length > 0 ||
           filters.specialties.length > 0 ||
           filters.gender.length > 0 ||
           filters.taxonomyCodes.length > 0 ||
           filters.hasHospitalAffiliation !== null ||
           filters.hasNetworkAffiliation !== null ||
           filters.hasPhysicianGroupAffiliation !== null ||
           selectedMarket !== null ||
           selectedTaxonomyTag !== null;
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Bar */}
      <div className={styles.controlsBar}>
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
          <div className="searchBarContainer" style={{ width: '300px' }}>
            <div className="searchIcon">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setEscapeCount(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setSubmittedSearchTerm(searchTerm.trim());
                  searchPractitioners({ searchTerm: searchTerm.trim() });
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  if (escapeTimeoutRef.current) {
                    clearTimeout(escapeTimeoutRef.current);
                  }
                  if (searchTerm && escapeCount === 0) {
                    setSearchTerm('');
                    setEscapeCount(1);
                    escapeTimeoutRef.current = setTimeout(() => setEscapeCount(0), 1000);
                  } else {
                    searchInputRef.current?.blur();
                    setEscapeCount(0);
                  }
                }
              }}
              placeholder="Search practitioners or NPI..."
              className="searchInput"
              style={{ width: '100%', paddingRight: searchTerm ? '70px' : '12px' }}
              data-search-enhanced="true"
              ref={searchInputRef}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clearButton"
                style={{ right: '8px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setSubmittedSearchTerm(searchTerm.trim());
              searchPractitioners({ searchTerm: searchTerm.trim() });
            }}
            className="sectionHeaderButton primary"
            disabled={loading || !searchTerm.trim()}
            title={loading ? 'Searching...' : 'Search'}
          >
            <Play size={14} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

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
                {filters.taxonomyCodes.length > 0 ? 
                  `${filters.taxonomyCodes.length} selected` : 
                  selectedTaxonomyTag ? 
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
            
            {(() => {
              const tagTypeLabels = {
                staff: 'Staff',
                my_setting: 'My Setting',
                upstream: 'Upstream',
                downstream: 'Downstream'
              };
              
              // Group tags by tag_type
              const groupedTags = taxonomyTags.reduce((acc, tag) => {
                const type = tag.tag_type || 'other';
                if (!acc[type]) acc[type] = [];
                acc[type].push(tag);
                return acc;
              }, {});
              
              // Render each tag type group
              return Object.entries(groupedTags).map(([tagType, tags]) => {
                const label = tagTypeLabels[tagType] || tagType;
                const allSelected = tags.every(tag => filters.taxonomyCodes.includes(tag.taxonomy_code));
                const someSelected = tags.some(tag => filters.taxonomyCodes.includes(tag.taxonomy_code));
                
                return (
                  <div key={tagType}>
                    {/* Tag Type Header with Select All */}
                    <button
                      className={styles.dropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaxonomyTagTypeSelect(tagType);
                        setTaxonomyDropdownOpen(false);
                      }}
                      style={{
                        fontWeight: '600',
                        backgroundColor: someSelected ? 'rgba(0, 192, 139, 0.15)' : 'rgba(0, 0, 0, 0.03)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: tagType === 'staff' ? '#e0f2fe' :
                                         tagType === 'my_setting' ? '#dcfce7' :
                                         tagType === 'upstream' ? '#fef3c7' :
                                         '#fce7f3',
                          color: tagType === 'staff' ? '#0369a1' :
                                 tagType === 'my_setting' ? '#166534' :
                                 tagType === 'upstream' ? '#92400e' :
                                 '#9f1239'
                        }}>
                          {label}
                        </span>
                        <span style={{ flex: 1, fontSize: '11px', color: 'var(--gray-600)' }}>
                          Select All ({tags.length})
                        </span>
                        {allSelected && (
                          <span style={{ fontSize: '10px', color: 'var(--primary)' }}>✓</span>
                        )}
                      </div>
                    </button>
                    
                    {/* Individual taxonomy items */}
                    {tags.map(tag => {
                      const details = taxonomyTagDetails[tag.taxonomy_code];
                      const isSelected = filters.taxonomyCodes.includes(tag.taxonomy_code);
                      
                      return (
                        <button 
                          key={tag.id}
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle individual taxonomy
                            const currentCodes = filters.taxonomyCodes || [];
                            const newCodes = isSelected
                              ? currentCodes.filter(code => code !== tag.taxonomy_code)
                              : [...currentCodes, tag.taxonomy_code];
                            
                            setSelectedTaxonomyTag(null); // Clear single tag selection when using multiple
                            setFilters(prev => ({ ...prev, taxonomyCodes: newCodes }));
                            // Don't close dropdown - allow multiple selections
                          }}
                          style={{
                            fontWeight: isSelected ? '600' : '400',
                            background: isSelected ? 'rgba(0, 192, 139, 0.1)' : 'none',
                            paddingLeft: '24px'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <code style={{ fontSize: '11px', fontFamily: 'monospace' }}>{tag.taxonomy_code}</code>
                              {isSelected && (
                                <span style={{ fontSize: '10px', color: 'var(--primary)' }}>✓</span>
                              )}
                            </div>
                            {details && (
                              <>
                                {(details.classification || details.taxonomy_classification) && (
                                  <div style={{ fontSize: '10px', color: 'var(--gray-600)', marginTop: '2px' }}>
                                    {details.classification || details.taxonomy_classification}
                                  </div>
                                )}
                                {(details.specialization || details.specialization_name || details.taxonomy_specialization) && (
                                  <div style={{ fontSize: '10px', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                                    {details.specialization || details.specialization_name || details.taxonomy_specialization}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </Dropdown>
        )}
        
        <div className={styles.spacer}></div>
        
        {((results && results.totalCount) || selectedMarket) && (
          <div className={styles.contextInfo}>
            {selectedMarket ? (
              <span>{selectedMarket.city}, {selectedMarket.state_code} • {selectedMarket.radius_miles}mi radius</span>
            ) : (
              <span>
                {results && results.totalCount
                  ? `${formatNumber(results.totalCount)} practitioners nationwide`
                  : 'Loading...'}
              </span>
            )}
          </div>
        )}
        
        <div className={styles.controlsBarButtons}>
            <button
              onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
              className="sectionHeaderButton"
              title="Toggle filters"
            >
              <FilterIcon size={14} />
              Filters
            </button>
          {hasActiveFilters() && (
            <button onClick={clearAll} className="sectionHeaderButton">
              <X size={14} />
              Clear All
            </button>
          )}
        </div>
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
        {/* Left Sidebar - Filters (collapsible) */}
        {showFiltersSidebar && (
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3>Filters</h3>
              <p>Narrow results</p>
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
                    {[...availableStates]
                      .sort((a, b) => a.state.localeCompare(b.state))
                      .slice(0, 10)
                      .map((state, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.states.includes(state.state)}
                          onChange={() => toggleFilterValue('states', state.state)}
                        />
                        <span>{state.state}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specialty Filter */}
            <div className={styles.filterGroup}>
              <button 
                className={styles.filterHeader}
                onClick={() => toggleSection('specialties')}
              >
                <div className={styles.filterHeaderLeft}>
                  <FilterIcon size={14} />
                  <span>Specialty</span>
                  {filters.specialties.length > 0 && (
                    <span className={styles.filterBadge}>{filters.specialties.length}</span>
                  )}
                </div>
                <ChevronDown 
                  size={16} 
                  className={expandedSections.specialties ? styles.chevronExpanded : styles.chevronCollapsed}
                />
              </button>
              {expandedSections.specialties && (
                <div className={styles.filterContent}>
                  <input
                    type="text"
                    value={filterSearches.specialties}
                    onChange={(e) => setFilterSearches(prev => ({ ...prev, specialties: e.target.value }))}
                    placeholder="Search specialties..."
                    className={styles.filterSearchInput}
                  />
                  <div className={styles.filterList}>
                    {[...availableSpecialties]
                      .sort((a, b) => a.specialty.localeCompare(b.specialty))
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
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gender Filter */}
            <div className={styles.filterGroup}>
              <button 
                className={styles.filterHeader}
                onClick={() => toggleSection('gender')}
              >
                <div className={styles.filterHeaderLeft}>
                  <FilterIcon size={14} />
                  <span>Gender</span>
                  {filters.gender.length > 0 && (
                    <span className={styles.filterBadge}>{filters.gender.length}</span>
                  )}
                </div>
                <ChevronDown 
                  size={16} 
                  className={expandedSections.gender ? styles.chevronExpanded : styles.chevronCollapsed}
                />
              </button>
              {expandedSections.gender && (
                <div className={styles.filterContent}>
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
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Active Filter Chips - Above Content */}
          {hasActiveFilters() && (
            <div className={styles.activeFiltersBar}>
              <div className={styles.activeFilters}>
                <span className={styles.filtersLabel}>Filters:</span>
                {submittedSearchTerm && (
                  <div className={styles.filterChip}>
                    <span>Search: "{submittedSearchTerm}"</span>
                    <button onClick={() => {
                      setSubmittedSearchTerm('');
                      setSearchTerm('');
                      setTimeout(() => searchPractitioners({ searchTerm: '' }), 0);
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {selectedMarket && (
                  <div className={styles.filterChip}>
                    <span>{selectedMarket.name}</span>
                    <button onClick={() => handleMarketSelect(null)}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {selectedTaxonomyTag && (
                  <div className={styles.filterChip}>
                    <span>Taxonomy: {selectedTaxonomyTag.name}</span>
                    <button onClick={() => {
                      handleTaxonomyTagSelect(null);
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.states.map(state => (
                  <div key={`state-${state}`} className={styles.filterChip}>
                    <span>{state}</span>
                    <button onClick={() => {
                      toggleFilterValue('states', state);
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {filters.specialties.map(specialty => (
                  <div key={`specialty-${specialty}`} className={styles.filterChip}>
                    <span>{specialty}</span>
                    <button onClick={() => {
                      toggleFilterValue('specialties', specialty);
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {filters.gender.map(g => (
                  <div key={`gender-${g}`} className={styles.filterChip}>
                    <span>{g === 'male' ? 'Male' : g === 'female' ? 'Female' : g}</span>
                    <button onClick={() => {
                      toggleFilterValue('gender', g);
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {filters.taxonomyCodes.map(code => (
                  <div key={`taxonomy-${code}`} className={styles.filterChip}>
                    <span>Taxonomy: {code}</span>
                    <button onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        taxonomyCodes: prev.taxonomyCodes.filter(c => c !== code)
                      }));
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {filters.hasHospitalAffiliation !== null && (
                  <div className={styles.filterChip}>
                    <span>Hospital: {filters.hasHospitalAffiliation ? 'Yes' : 'No'}</span>
                    <button onClick={() => {
                      setFilters(prev => ({ ...prev, hasHospitalAffiliation: null }));
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.hasNetworkAffiliation !== null && (
                  <div className={styles.filterChip}>
                    <span>Network: {filters.hasNetworkAffiliation ? 'Yes' : 'No'}</span>
                    <button onClick={() => {
                      setFilters(prev => ({ ...prev, hasNetworkAffiliation: null }));
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.hasPhysicianGroupAffiliation !== null && (
                  <div className={styles.filterChip}>
                    <span>Physician Group: {filters.hasPhysicianGroupAffiliation ? 'Yes' : 'No'}</span>
                    <button onClick={() => {
                      setFilters(prev => ({ ...prev, hasPhysicianGroupAffiliation: null }));
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tab Content */}
          <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overviewContent}>
              {/* Loading Overlay for Overview Tab - Covers only the content area */}
              {loading && (
                <div className={styles.loadingOverlay}>
                  <Spinner />
                </div>
              )}
            <div className={styles.overviewPanel}>
              <h3>
                <Database size={16} />
                {hasActiveFilters() ? 'Filtered Results' : 'National Overview'}
              </h3>
              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Total Practitioners</div>
                  <div className={styles.overviewValue}>
                      {resultStats && results
                        ? formatNumber(results.totalCount)
                        : '0'}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                    <div className={styles.overviewLabel}>Male</div>
                  <div className={styles.overviewValue}>
                      {resultStats
                        ? formatNumber(resultStats.male_count)
                        : '0'}
                  </div>
                </div>
                <div className={styles.overviewCard}>
                    <div className={styles.overviewLabel}>Female</div>
                  <div className={styles.overviewValue}>
                      {resultStats
                        ? formatNumber(resultStats.female_count)
                        : '0'}
                  </div>
                </div>
                  {(() => {
                    const breakdowns = results && results.breakdowns ? getBreakdowns() : null;
                    if (!breakdowns) return null;
                    const totalAffiliated = breakdowns.affiliations.hospital + 
                                            breakdowns.affiliations.physicianGroup + 
                                            breakdowns.affiliations.network;
                    return (
                <div className={styles.overviewCard}>
                        <div className={styles.overviewLabel}>With Affiliations</div>
                  <div className={styles.overviewValue}>
                          {formatNumber(totalAffiliated)}
                  </div>
                </div>
                    );
                  })()}
                  </div>
                </div>
              
              {/* Detailed Breakdowns - Separate from overview panel */}
              {results && results.practitioners && (() => {
            const breakdowns = getBreakdowns();
            if (!breakdowns) return null;
            
            return (
              <div className={styles.breakdownsContainer}>
                {/* Top Specialties */}
                <div className={styles.breakdownSection}>
                      <h4>Top Specialties {resultStats ? `(${formatNumber(resultStats.distinct_specialties)} total)` : ''}</h4>
                  <div className={styles.breakdownList}>
                        {breakdowns.specialties.slice(0, 10).map((item, idx) => (
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
                      <h4>State Distribution {resultStats ? `(${formatNumber(resultStats.distinct_states)} total)` : ''}</h4>
                  <div className={styles.breakdownList}>
                        {breakdowns.states.slice(0, 10).map((item, idx) => (
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
                      <h4>Top Cities {resultStats ? `(${formatNumber(resultStats.distinct_cities)} total)` : ''}</h4>
                  <div className={styles.breakdownList}>
                        {breakdowns.cities.slice(0, 10).map((item, idx) => (
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
                      </div>
                );
              })()}
                        </div>
                      )}
          
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
                {results ? 'Practitioners List' : 'Practitioners'}
              </h3>
              
              <div className={styles.resultsActions}>
                {results && results.count > 0 && (
                  <>
                    <span className={styles.pageInfo}>
                      Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, results.practitioners.length)} of {formatNumber(results && results.totalCount ? results.totalCount : (results?.practitioners?.length || 0))}{results && results.totalCount && results.totalCount >= 500 ? ' (table limited to first 500)' : ''}
                    </span>
                    {totalPages > 1 && (
                      <div className={styles.paginationInline}>
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="sectionHeaderButton"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="sectionHeaderButton"
                        >
                          Next
                        </button>
                      </div>
                    )}
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
                              {[practitioner.address_line_1, practitioner.address_line_2, practitioner.city, practitioner.state, practitioner.zip].filter(Boolean).join(', ')}
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
          </>
        </div>
      </div>
    </div>
  );
}
