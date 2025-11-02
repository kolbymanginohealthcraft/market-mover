import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./ProviderSearch.module.css";
import PageLayout from "../../../components/Layouts/PageLayout";
import Spinner from "../../../components/Buttons/Spinner";
import Dropdown from "../../../components/Buttons/Dropdown";
import { apiUrl } from '../../../utils/api';
import { trackProviderSearch } from '../../../utils/activityTracker';
import { supabase } from '../../../app/supabaseClient';
import useTeamProviderTags from '../../../hooks/useTeamProviderTags';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { useDropdownClose } from '../../../hooks/useDropdownClose';
import { getTagColor, getTagLabel } from '../../../utils/tagColors';
import { ProviderTagBadge } from '../../../components/Tagging/ProviderTagBadge';
import {
  Search,
  MapPin,
  Building2,
  Users,
  Shield,
  Star,
  Filter,
  X,
  Plus,
  Minus,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  List
} from 'lucide-react';

export default function ProviderSearch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [queryText, setQueryText] = useState("");
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(25);
  const [map, setMap] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [componentError, setComponentError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState({
    types: false,
    networks: false,
    cities: false,
    states: false,
    network: false,
    markets: false
  });

  // Show/hide filters sidebar
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

  // My Network and Saved Markets filters
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketNPIs, setMarketNPIs] = useState(null);
  const [providerTags, setProviderTags] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagNPIs, setTagNPIs] = useState(null);

  const searchInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const lastTrackedSearch = useRef("");
  const bulkDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const escapeTimeoutRef = useRef(null);
  const [escapeCount, setEscapeCount] = useState(0);

  // Selection and bulk actions
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Tagging state
  const [taggingProviderId, setTaggingProviderId] = useState(null);

  // Team provider tags functionality
  const {
    hasTeamProviderTag,
    getProviderTags,
    addTeamProviderTag,
    removeTeamProviderTag
  } = useTeamProviderTags();

  // Check if user has a team
  const { hasTeam } = useUserTeam();

  // Error boundary for the component
  if (componentError) {
    return (
      <PageLayout>
        <div className={styles.container}>
        <div className={styles.searchHeader}>
          <h2>Search Error</h2>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.error}>
            <p>Something went wrong with the search page.</p>
            <button onClick={() => setComponentError(null)}>Try Again</button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Focus search input on page load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Load national overview and filter options on mount
  useEffect(() => {
    const loadNationalOverview = async () => {
      setLoadingOverview(true);
      try {
        const response = await fetch(apiUrl('/api/search-providers-vendor/national-overview'));
        if (!response.ok) {
          setLoadingOverview(false);
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          setNationalOverview(result.data);
          
          // Set filter options from national overview (sorted alphabetically)
          setFilterOptions({
            types: (result.data.filterOptions?.types || []).slice().sort(),
            networks: (result.data.filterOptions?.networks || []).slice().sort(),
            cities: (result.data.filterOptions?.cities || []).slice().sort(),
            states: (result.data.filterOptions?.states || []).slice().sort()
          });

          // Store counts if available from breakdowns
          const typeCounts = {};
          const stateCounts = {};
          if (result.data.breakdowns?.types) {
            result.data.breakdowns.types.forEach(item => {
              typeCounts[item.name] = item.count;
            });
          }
          if (result.data.breakdowns?.states) {
            result.data.breakdowns.states.forEach(item => {
              stateCounts[item.name] = item.count;
            });
          }
          setFilterOptionCounts({
            types: typeCounts,
            networks: {},
            cities: {},
            states: stateCounts
          });
        }
      } catch (err) {
        console.error("Error loading national overview:", err);
      } finally {
        setLoadingOverview(false);
      }
    };

    loadNationalOverview();
  }, []);

  // Fetch saved markets and provider tags on mount
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSavedMarkets(data || []);
      } catch (err) {
        console.error('Error fetching markets:', err);
      }
    }
    
    async function fetchProviderTags() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single();
        
        if (profileError || !profile || !profile.team_id) {
          return;
        }
        
        const { data: tags, error: tagsError } = await supabase
          .from('team_provider_tags')
          .select('*')
          .eq('team_id', profile.team_id);
        
        if (tagsError) throw tagsError;
        
        const grouped = {
          me: tags.filter(t => t.tag_type === 'me'),
          partner: tags.filter(t => t.tag_type === 'partner'),
          competitor: tags.filter(t => t.tag_type === 'competitor'),
          target: tags.filter(t => t.tag_type === 'target')
        };
        
        setProviderTags(grouped);
      } catch (err) {
        console.error('Error fetching provider tags:', err);
      }
    }
    
    fetchMarkets();
    fetchProviderTags();
  }, []);

  // Enhanced dropdown close hook that includes button toggle behavior
  const handleDropdownClose = () => {
    setTaggingProviderId(null);
  };

  // Use enhanced dropdown close hook for bulk actions dropdown
  const { buttonRef: bulkButtonRef } = useDropdownClose({
    ref: bulkDropdownRef,
    closeCallback: handleDropdownClose,
    isOpen: taggingProviderId === 'bulk'
  });

  // Handle button toggle behavior for bulk actions
  const handleBulkButtonClick = () => {
    if (taggingProviderId === 'bulk') {
      setTaggingProviderId(null);
    } else {
      setTaggingProviderId('bulk');
    }
  };

  // Handle button toggle behavior for individual tag buttons
  const handleTagButtonClick = (providerId, event) => {
    if (taggingProviderId === providerId) {
      setTaggingProviderId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5,
        left: rect.left
      });
      setTaggingProviderId(providerId);
    }
  };

  // Use enhanced dropdown close hook for individual tag dropdowns
  useDropdownClose({
    dropdownSelector: `.${styles.dropdown}`,
    buttonSelector: `.${styles.tagButton}`,
    closeCallback: () => setTaggingProviderId(null),
    isOpen: taggingProviderId && taggingProviderId !== 'bulk'
  });

  // Handle market selection
  const handleMarketSelect = async (marketId) => {
    setSelectedMarket(null);
    setMarketNPIs(null);
    
    if (!marketId) {
      return;
    }
    
    const market = savedMarkets.find(m => m.id === marketId);
    if (!market) return;
    
    setSelectedMarket(marketId);
    
    try {
      const lat = parseFloat(market.latitude);
      const lon = parseFloat(market.longitude);
      const radius = market.radius_miles;
      
      const response = await fetch(
        apiUrl(`/api/nearby-providers?lat=${lat}&lon=${lon}&radius=${radius}`)
      );
      
      const result = await response.json();
      if (!result.success) throw new Error('Failed to fetch market providers');
      
      const providers = result.data || [];
      const dhcs = providers.map(p => p.dhc).filter(Boolean);
      setMarketNPIs(dhcs.length > 0 ? dhcs : []);
    } catch (err) {
      console.error('Error loading market providers:', err);
      setMarketNPIs([]);
    }
  };

  // Handle tag selection
  const handleTagSelect = async (tagType) => {
    setSelectedTag(null);
    setTagNPIs(null);
    
    if (!tagType) {
      return;
    }
    
    setSelectedTag(tagType);
    
    try {
      const taggedProviders = providerTags[tagType] || [];
      if (taggedProviders.length === 0) {
        setTagNPIs([]);
        return;
      }
      
      const dhcs = taggedProviders.map(t => t.provider_dhc).filter(Boolean);
      setTagNPIs(dhcs);
    } catch (err) {
      console.error('Error loading tagged providers:', err);
      setTagNPIs([]);
    }
  };

  // Auto-search when tag or market changes and we've already searched
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [selectedTag, selectedMarket]);

  const handleSearch = async (searchTerm = null, fromUrl = false) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setHasSearched(true);

    const q = searchTerm || queryText.trim();
    
    // Allow search if there's a search term OR active filters
    if (!q && !hasActiveFilters) {
      setLoading(false);
        return;
      }

    if (q) {
      setLastSearchTerm(q);
    }

    try {
      // Build query params
      const params = new URLSearchParams();
      if (q) {
        params.append('search', q);
      }
      
      // Add filter parameters
      if (selectedTypes.length > 0) {
        selectedTypes.forEach(type => params.append('types', type));
      }
      if (selectedNetworks.length > 0) {
        selectedNetworks.forEach(network => params.append('networks', network));
      }
      if (selectedCities.length > 0) {
        selectedCities.forEach(city => params.append('cities', city));
      }
      if (selectedStates.length > 0) {
        selectedStates.forEach(state => params.append('states', state));
      }

      // Add tag filter (DHC IDs)
      if (selectedTag && tagNPIs) {
        const dhcIds = providerTags[selectedTag].map(t => t.provider_dhc);
        dhcIds.forEach(dhc => params.append('dhcs', dhc));
      }

      // Add market filter (location)
      if (selectedMarket && marketNPIs) {
        const market = savedMarkets.find(m => m.id === selectedMarket);
        if (market) {
          params.append('lat', market.latitude);
          params.append('lon', market.longitude);
          params.append('radius', market.radius_miles);
        }
      }

      const response = await fetch(apiUrl(`/api/search-providers-vendor?${params.toString()}`));

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setResults(result.data);
        if (result.data.length > 0) {
          // Update filter options from search results
          const types = Array.from(new Set(result.data.map(p => p.type || "Unknown").filter(Boolean))).sort();
          const networks = Array.from(new Set(result.data.map(p => p.network).filter(Boolean))).sort();
          const cities = Array.from(new Set(result.data.map(p => p.city).filter(Boolean))).sort();
          const states = Array.from(new Set(result.data.map(p => p.state).filter(Boolean))).sort();

          setFilterOptions({
            types,
            networks,
            cities,
            states
          });

          // Update filter counts from search results
          const typeCounts = {};
          const stateCounts = {};
          types.forEach(type => {
            typeCounts[type] = result.data.filter(p => (p.type || "Unknown") === type).length;
          });
          states.forEach(state => {
            stateCounts[state] = result.data.filter(p => p.state === state).length;
          });
          setFilterOptionCounts(prev => ({
            ...prev,
            types: typeCounts,
            states: stateCounts
          }));
        }
        if (lastTrackedSearch.current !== q) {
          await trackProviderSearch(q, result.data.length);
          lastTrackedSearch.current = q;
        }
      } else {
        setError(result.error || 'No results found');
        setResults([]);
        if (lastTrackedSearch.current !== q) {
          await trackProviderSearch(q, 0);
          lastTrackedSearch.current = q;
        }
      }
    } catch (err) {
      console.error("💥 Search error:", err);
      setError(err.message);
      setResults([]);
      if (lastTrackedSearch.current !== q) {
        await trackProviderSearch(q, 0);
        lastTrackedSearch.current = q;
      }
    }

    setLoading(false);
  };

  // Filter options state - populated from national overview or search results
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    networks: [],
    cities: [],
    states: []
  });

  // Filter option counts (for displaying counts in filters)
  const [filterOptionCounts, setFilterOptionCounts] = useState({
    types: {},
    networks: {},
    cities: {},
    states: {}
  });

  // National overview state for summary before search
  const [nationalOverview, setNationalOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Apply filters to results
  const filteredResults = results.filter(provider => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(provider.type || "Unknown")) {
      return false;
    }
    if (selectedNetworks.length > 0 && !selectedNetworks.includes(provider.network)) {
      return false;
    }
    if (selectedCities.length > 0 && !selectedCities.includes(provider.city)) {
      return false;
    }
    if (selectedStates.length > 0 && !selectedStates.includes(provider.state)) {
      return false;
    }
    return true;
  });

  // Extract unique filter options from FILTERED results (updates as filters are applied)
  const allTypes = filteredResults.length > 0 
    ? Array.from(new Set(filteredResults.map(p => p.type || "Unknown"))).sort()
    : filterOptions.types;
  const allNetworks = filteredResults.length > 0
    ? Array.from(new Set(filteredResults.map(p => p.network).filter(Boolean))).sort()
    : filterOptions.networks;
  const allCities = filteredResults.length > 0
    ? Array.from(new Set(filteredResults.map(p => p.city).filter(Boolean))).sort()
    : filterOptions.cities;
  const allStates = filteredResults.length > 0
    ? Array.from(new Set(filteredResults.map(p => p.state).filter(Boolean))).sort()
    : filterOptions.states;


  // Filter functions
  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleNetwork = (network) => {
    setSelectedNetworks(prev =>
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

  const toggleCity = (city) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const toggleState = (state) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedNetworks([]);
    setSelectedCities([]);
    setSelectedStates([]);
    setSelectedTag(null);
    setTagNPIs(null);
    setSelectedMarket(null);
    setMarketNPIs(null);
    setQueryText("");
    // This will trigger the auto-search effect to clear results
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Selection handlers
  const handleCheckboxChange = (providerDhc, checked) => {
    const newSelected = new Set(selectedProviders);
    if (checked) {
      newSelected.add(providerDhc);
    } else {
      newSelected.delete(providerDhc);
    }
    setSelectedProviders(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedProviders.size === paginatedResults.length) {
      setSelectedProviders(new Set());
      setShowBulkActions(false);
    } else {
      const allDhcs = new Set(paginatedResults.map(p => p.dhc));
      setSelectedProviders(allDhcs);
      setShowBulkActions(true);
    }
  };

  const handleBulkTag = async (tagType) => {
    if (selectedProviders.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedProviderObjects = paginatedResults.filter(p =>
        selectedProviders.has(p.dhc)
      );

      for (const provider of selectedProviderObjects) {
        await addTeamProviderTag(provider.dhc, tagType);
      }

      setSelectedProviders(new Set());
      setShowBulkActions(false);
      setTaggingProviderId(null);

      const tagLabel = tagType === 'me' ? 'Me' :
        tagType === 'partner' ? 'Partner' :
          tagType === 'competitor' ? 'Competitor' :
            tagType === 'target' ? 'Target' : tagType;
      alert(`${selectedProviderObjects.length} providers tagged as "${tagLabel}"!`);
    } catch (error) {
      console.error('Error tagging providers:', error);
      alert('Error tagging providers. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedNetworks.length > 0 ||
    selectedCities.length > 0 || selectedStates.length > 0 || selectedTag || selectedMarket;

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseInt(num).toLocaleString();
  };

  try {
    return (
      <PageLayout fullWidth>
        <div className={styles.container}>
          {/* Top Controls Bar */}
          <div className={styles.controlsBar}>
            {/* Search Bar with Search Button */}
            <div style={{ flex: 1, maxWidth: '400px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="searchBarContainer">
                  <div className="searchIcon">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={queryText}
                    onChange={(e) => {
                      setQueryText(e.target.value);
                      setEscapeCount(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        if (escapeTimeoutRef.current) {
                          clearTimeout(escapeTimeoutRef.current);
                        }
                        if (queryText && escapeCount === 0) {
                          setQueryText('');
                          setEscapeCount(1);
                          escapeTimeoutRef.current = setTimeout(() => setEscapeCount(0), 1000);
                        } else {
                          searchInputRef.current?.blur();
                          setEscapeCount(0);
                        }
                      }
                    }}
                    placeholder="Search providers..."
                    className="searchInput"
                    data-search-enhanced="true"
                    ref={searchInputRef}
                  />
                  {queryText && (
                    <button
                      onClick={() => setQueryText('')}
                      className="clearButton"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSearch()}
                className={styles.searchButton}
                disabled={loading || (!queryText.trim() && !hasActiveFilters)}
                title={loading ? 'Searching...' : 'Search'}
              >
                <Play size={14} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Results Info & Pagination */}
            {!loading && hasSearched && results.length > 0 && (
              <>
                <div className={styles.searchStatus}>
                  <span className={styles.searchStatusActive} style={{ fontSize: '13px' }}>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {formatNumber(filteredResults.length)}
                  </span>
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={styles.paginationButton}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={styles.paginationButton}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
            
            <div className={styles.controlsBarButtons}>
              {hasSearched && (
                <button
                  onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
                  className="sectionHeaderButton"
                  title="Toggle filters"
                >
                  <Filter size={14} />
                  Filters
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="sectionHeaderButton"
                >
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>
                  </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className={styles.activeFiltersBar}>
              <div className={styles.activeFilters}>
                {selectedTag && (
                  <div className={styles.filterChip}>
                    <span>My {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} ({providerTags[selectedTag]?.length || 0})</span>
                    <button onClick={() => handleTagSelect('')}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {selectedMarket && (
                  <div className={styles.filterChip}>
                    <span>{savedMarkets.find(m => m.id === selectedMarket)?.name || 'Market'}</span>
                    <button onClick={() => handleMarketSelect(null)}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {selectedTypes.map(type => (
                  <div key={`type-${type}`} className={styles.filterChip}>
                    <span>{type}</span>
                    <button onClick={() => toggleType(type)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {selectedNetworks.map(network => (
                  <div key={`network-${network}`} className={styles.filterChip}>
                    <span>{network}</span>
                    <button onClick={() => toggleNetwork(network)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {selectedCities.map(city => (
                  <div key={`city-${city}`} className={styles.filterChip}>
                    <span>{city}</span>
                    <button onClick={() => toggleCity(city)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {selectedStates.map(state => (
                  <div key={`state-${state}`} className={styles.filterChip}>
                    <span>{state}</span>
                    <button onClick={() => toggleState(state)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Layout */}
          <div className={styles.mainLayout}>
            {/* Left Sidebar - Filters Only */}
            {showFiltersSidebar && (
              <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                  <h3>Filters</h3>
                  <p>Narrow results</p>
                </div>

                  {/* Provider Type Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('types')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>Provider Type</span>
                    {selectedTypes.length > 0 && (
                      <span className={styles.filterBadge}>{selectedTypes.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.types ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.types && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allTypes.map(type => (
                        <label key={type} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => toggleType(type)}
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* Network Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('networks')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>Network</span>
                    {selectedNetworks.length > 0 && (
                      <span className={styles.filterBadge}>{selectedNetworks.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.networks ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.networks && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allNetworks.map(network => (
                        <label key={network} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedNetworks.includes(network)}
                            onChange={() => toggleNetwork(network)}
                          />
                          <span>{network}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* City Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('cities')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>City</span>
                    {selectedCities.length > 0 && (
                      <span className={styles.filterBadge}>{selectedCities.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.cities ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.cities && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allCities.map(city => (
                        <label key={city} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedCities.includes(city)}
                            onChange={() => toggleCity(city)}
                          />
                          <span>{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* State Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('states')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>State</span>
                    {selectedStates.length > 0 && (
                      <span className={styles.filterBadge}>{selectedStates.length}</span>
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
                      {allStates.map(state => (
                        <label key={state} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedStates.includes(state)}
                            onChange={() => toggleState(state)}
                          />
                          <span>{state}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* My Network Filter */}
                  {providerTags && (
                    <div className={styles.filterGroup}>
                      <button 
                        className={styles.filterHeader}
                        onClick={() => toggleSection('network')}
                      >
                        <div className={styles.filterHeaderLeft}>
                          <Users size={14} />
                          <span>My Network</span>
                          {selectedTag && (
                            <span className={styles.filterBadge}>
                              {providerTags[selectedTag]?.length || 0}
                            </span>
                          )}
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={expandedSections.network ? styles.chevronExpanded : styles.chevronCollapsed}
                        />
                      </button>
                      {expandedSections.network && (
                        <div className={styles.filterContent}>
                          <div className={styles.filterList}>
                            <label className={styles.filterCheckbox}>
                              <input
                                type="radio"
                                name="networkFilter"
                                checked={!selectedTag}
                                onChange={() => handleTagSelect('')}
                              />
                              <span>All Providers</span>
                            </label>
                            {providerTags.me?.length > 0 && (
                              <label className={styles.filterCheckbox}>
                                <input
                                  type="radio"
                                  name="networkFilter"
                                  checked={selectedTag === 'me'}
                                  onChange={() => handleTagSelect('me')}
                                />
                                <span>My Providers ({providerTags.me.length})</span>
                              </label>
                            )}
                            {providerTags.partner?.length > 0 && (
                              <label className={styles.filterCheckbox}>
                                <input
                                  type="radio"
                                  name="networkFilter"
                                  checked={selectedTag === 'partner'}
                                  onChange={() => handleTagSelect('partner')}
                                />
                                <span>Partners ({providerTags.partner.length})</span>
                              </label>
                            )}
                            {providerTags.competitor?.length > 0 && (
                              <label className={styles.filterCheckbox}>
                                <input
                                  type="radio"
                                  name="networkFilter"
                                  checked={selectedTag === 'competitor'}
                                  onChange={() => handleTagSelect('competitor')}
                                />
                                <span>Competitors ({providerTags.competitor.length})</span>
                              </label>
                            )}
                            {providerTags.target?.length > 0 && (
                              <label className={styles.filterCheckbox}>
                                <input
                                  type="radio"
                                  name="networkFilter"
                                  checked={selectedTag === 'target'}
                                  onChange={() => handleTagSelect('target')}
                                />
                                <span>Targets ({providerTags.target.length})</span>
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Saved Markets Filter */}
                  {savedMarkets.length > 0 && (
                    <div className={styles.filterGroup}>
                      <button 
                        className={styles.filterHeader}
                        onClick={() => toggleSection('markets')}
                      >
                        <div className={styles.filterHeaderLeft}>
                          <MapPin size={14} />
                          <span>Saved Markets</span>
                          {selectedMarket && (
                            <span className={styles.filterBadge}>1</span>
                          )}
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={expandedSections.markets ? styles.chevronExpanded : styles.chevronCollapsed}
                        />
                      </button>
                      {expandedSections.markets && (
                        <div className={styles.filterContent}>
                          <div className={styles.filterList}>
                            <label className={styles.filterCheckbox}>
                              <input
                                type="radio"
                                name="marketFilter"
                                checked={!selectedMarket}
                                onChange={() => handleMarketSelect(null)}
                              />
                              <span>No Market</span>
                            </label>
                            {savedMarkets.map(market => (
                              <label key={market.id} className={styles.filterCheckbox}>
                                <input
                                  type="radio"
                                  name="marketFilter"
                                  checked={selectedMarket === market.id}
                                  onChange={() => handleMarketSelect(market.id)}
                                />
                                <span>
                                  {market.name}
                                  <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                    {market.city}, {market.state} • {market.radius_miles} mi
                                  </div>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Main Content */}
            <div className={styles.resultsPanel}>
                  {loading && (
                    <div className={styles.emptyState}>
                      <Spinner />
                      <h2>Searching...</h2>
                      <p>Finding providers matching your criteria</p>
                  </div>
                )}

                  {!loading && !hasSearched && (
                    <div className={styles.emptyState}>
                      <Search size={48} />
                      <h2>Search for Providers</h2>
                      <p>Enter a search term above to find providers</p>
                  </div>
                )}

                  {!loading && hasSearched && filteredResults.length === 0 && (
                    <div className={styles.emptyState}>
                      <h2>No Results Found</h2>
                      <p>Try adjusting your search terms or filters</p>
                  </div>
                )}

                  {!loading && paginatedResults.length > 0 && showBulkActions && hasTeam && (
                    <div className={styles.resultsHeader}>
                      <div className={styles.resultsActions}>
                        <div className={styles.bulkActions}>
                          <div className={styles.dropdownContainer} ref={bulkDropdownRef}>
                            <button
                              ref={bulkButtonRef}
                              className={styles.glassmorphismButton}
                              onClick={handleBulkButtonClick}
                            >
                              Tag
                            </button>
                            {taggingProviderId === 'bulk' && (
                              <div className={styles.dropdown}>
                                <button
                                  className={styles.glassmorphismButton}
                                  onClick={() => handleBulkTag('me')}
                                  disabled={bulkActionLoading}
                                >
                                  {bulkActionLoading ? 'Tagging...' : 'Me'}
                                </button>
                                <button
                                  className={styles.glassmorphismButton}
                                  onClick={() => handleBulkTag('partner')}
                                  disabled={bulkActionLoading}
                                >
                                  {bulkActionLoading ? 'Tagging...' : 'Partner'}
                                </button>
                                <button
                                  className={styles.glassmorphismButton}
                                  onClick={() => handleBulkTag('competitor')}
                                  disabled={bulkActionLoading}
                                >
                                  {bulkActionLoading ? 'Tagging...' : 'Competitor'}
                                </button>
                                <button
                                  className={styles.glassmorphismButton}
                                  onClick={() => handleBulkTag('target')}
                                  disabled={bulkActionLoading}
                                >
                                  {bulkActionLoading ? 'Tagging...' : 'Target'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {!loading && paginatedResults.length > 0 && (
                    <>
                      <div className={styles.tableWrapper}>
                        <table className={styles.resultsTable}>
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedProviders.size === paginatedResults.length && paginatedResults.length > 0}
                                  onChange={hasTeam ? handleSelectAll : undefined}
                                  disabled={!hasTeam}
                                  className={!hasTeam ? styles.disabled : ''}
                                  title={!hasTeam ? "Join or create a team to select providers" : ""}
                                />
                              </th>
                              <th>Provider</th>
                              <th>Type</th>
                              <th>Network</th>
                              <th>Tag</th>
                            </tr>
                          </thead>
                          <tbody>
                    {paginatedResults.map((provider) => (
                              <tr 
                        key={provider.dhc}
                      >
                                <td>
                              <input
                                type="checkbox"
                                checked={selectedProviders.has(provider.dhc)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (hasTeam) {
                                    handleCheckboxChange(provider.dhc, e.target.checked);
                                  }
                                }}
                                className={`${styles.providerCheckbox} ${!hasTeam ? styles.disabled : ''}`}
                                disabled={!hasTeam}
                                title={!hasTeam ? "Join or create a team to select providers" : ""}
                                    onClick={(e) => e.stopPropagation()}
                              />
                                </td>
                                <td>
                                  <div className={styles.providerCell}>
                              <div
                                      className={styles.providerNameLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/${provider.dhc}`);
                                }}
                              >
                                {provider.name}
                              </div>
                              <div className={styles.providerAddress}>
                                {provider.street}, {provider.city}, {provider.state} {provider.zip}
                                {provider.phone && (
                                  <span className={styles.providerPhone}> • {provider.phone}</span>
                                )}
                              </div>
                              </div>
                                </td>
                                <td>{provider.type || "Unknown"}</td>
                                <td>{provider.network || "-"}</td>
                                <td className={styles.tagCell} onClick={(e) => e.stopPropagation()}>
                              <ProviderTagBadge
                                providerId={provider.dhc}
                                hasTeam={hasTeam}
                                teamLoading={false}
                                primaryTag={getProviderTags(provider.dhc)[0] || null}
                                isSaving={false}
                                onAddTag={addTeamProviderTag}
                                onRemoveTag={removeTeamProviderTag}
                                size="medium"
                                variant="default"
                                showRemoveOption={true}
                              />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                      )}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  } catch (error) {
    console.error("ProviderSearch component error:", error);
    setComponentError(error);
    return null;
  }
}
