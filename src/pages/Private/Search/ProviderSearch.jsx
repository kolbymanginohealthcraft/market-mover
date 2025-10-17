import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./ProviderSearch.module.css";
import PageLayout from "../../../components/Layouts/PageLayout";
import ControlsRow from "../../../components/Layouts/ControlsRow";
import { apiUrl } from '../../../utils/api';
import { trackProviderSearch } from '../../../utils/activityTracker';
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
  Lock
} from 'lucide-react';

export default function ProviderSearch() {
  const navigate = useNavigate();
  const location = useLocation();




  const [queryText, setQueryText] = useState("");
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(25);
  const [map, setMap] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [componentError, setComponentError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [showOnlyCCNs, setShowOnlyCCNs] = useState(false);
  const [ccnProviderIds, setCcnProviderIds] = useState(new Set());



  const searchInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const lastTrackedSearch = useRef("");
  const bulkDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
        <div className={styles.searchHeader}>
          <h2>Search Error</h2>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.error}>
            <p>Something went wrong with the search page.</p>
            <button onClick={() => setComponentError(null)}>Try Again</button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Focus search input on page load
  useEffect(() => {
    searchInputRef.current?.focus();
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

  // Initialize map when selected provider changes and has valid coordinates
  useEffect(() => {
    try {
      console.log("🗺️ Map initialization effect triggered");
      console.log("Selected provider:", selectedProvider);
      console.log("Map container:", mapContainerRef.current);
      console.log("Map ready:", mapReady);

      // Clean up existing map if it exists
      if (map && typeof map.remove === 'function') {
        try {
          console.log("🗺️ Cleaning up existing map");
          map.remove();
        } catch (error) {
          console.error("🗺️ Error cleaning up existing map:", error);
        }
        setMap(null);
        setMapReady(false);
      }

      // Check if we have a provider with valid coordinates
      if (!selectedProvider?.latitude || !selectedProvider?.longitude ||
        isNaN(selectedProvider.latitude) || isNaN(selectedProvider.longitude)) {
        console.log("No valid provider coordinates, skipping map init");
        return;
      }

      // Check if container is available
      if (!mapContainerRef.current) {
        console.log("Map container not available yet, skipping map init");
        return;
      }

      // Add a small delay to ensure container is fully rendered
      const initTimeout = setTimeout(() => {
        console.log("🗺️ Creating MapLibre map...");

        try {
          // MapLibre GL JS - completely free, no API token needed!
          const newMap = new maplibregl.Map({
            container: mapContainerRef.current,
            style: {
              version: 8,
              sources: {
                'osm': {
                  type: 'raster',
                  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                  tileSize: 256,
                  attribution: '© OpenStreetMap contributors'
                }
              },
              layers: [
                {
                  id: 'osm-tiles',
                  type: 'raster',
                  source: 'osm',
                  minzoom: 0,
                  maxzoom: 22
                }
              ]
            },
            center: [selectedProvider.longitude, selectedProvider.latitude],
            zoom: 12
          });

          console.log("🗺️ Map created successfully");

          // Add navigation controls
          newMap.addControl(new maplibregl.NavigationControl(), 'top-left');
          newMap.addControl(new maplibregl.FullscreenControl(), 'top-right');

          // Add provider marker
          const marker = new maplibregl.Marker({ color: '#00c08b' })
            .setLngLat([selectedProvider.longitude, selectedProvider.latitude])
            .setPopup(
              new maplibregl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 8px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
                      ${selectedProvider.name}
                    </h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      ${selectedProvider.street}, ${selectedProvider.city}, ${selectedProvider.state}
                    </p>
                  </div>
                `)
            )
            .addTo(newMap);

          // Wait for the map to load
          newMap.on('load', () => {
            console.log("🗺️ Map loaded successfully");
            setMapReady(true);
          });

          // Handle map load errors
          newMap.on('error', (e) => {
            console.error("🗺️ Map error:", e);
          });

          setMap(newMap);

        } catch (error) {
          console.error("🗺️ Error creating map:", error);
          setMapReady(false);
        }
      }, 100); // 100ms delay

      return () => {
        clearTimeout(initTimeout);
        // Clean up map safely
        if (map && typeof map.remove === 'function') {
          try {
            console.log("🗺️ Cleaning up map on unmount");
            map.remove();
          } catch (error) {
            console.error("🗺️ Error cleaning up map:", error);
          }
        }
        setMap(null);
        setMapReady(false);
      };
    } catch (error) {
      console.error("🗺️ Error in map initialization effect:", error);
    }
  }, [selectedProvider]);

  // Fetch CCNs for filtered results
  useEffect(() => {
    const fetchCCNs = async () => {
      if (!results.length) return;

      const dhcIds = results.map(p => p.dhc).filter(Boolean);
      if (!dhcIds.length) return;

      try {
        const response = await fetch(apiUrl('/api/related-ccns'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dhc_ids: dhcIds }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.success) {
          const ccnSet = new Set(result.data.map(row => row.dhc));
          setCcnProviderIds(ccnSet);
        } else {
          setCcnProviderIds(new Set());
        }
      } catch (err) {
        console.error("❌ Error fetching CCNs:", err);
        setCcnProviderIds(new Set());
      }
    };

    fetchCCNs();
  }, [results]);

  const handleSearch = async (searchTerm = null, fromUrl = false) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setSelectedProvider(null);
    setHasSearched(true);

    const q = searchTerm || queryText.trim();
    if (!q) return;

    setLastSearchTerm(q);
    try {
      const response = await fetch(apiUrl(`/api/search-providers?search=${encodeURIComponent(q)}`));

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setResults(result.data);
        if (result.data.length > 0) {
          setSelectedProvider(result.data[0]);
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

  // Extract unique filter options from results
  const allTypes = Array.from(new Set(results.map(p => p.type || "Unknown"))).sort();
  const allNetworks = Array.from(new Set(results.map(p => p.network).filter(Boolean))).sort();
  const allCities = Array.from(new Set(results.map(p => p.city).filter(Boolean))).sort();
  const allStates = Array.from(new Set(results.map(p => p.state).filter(Boolean))).sort();

  // Apply filters to results
  const filteredResults = results.filter(provider => {
    // Provider type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(provider.type || "Unknown")) {
      return false;
    }

    // Network filter
    if (selectedNetworks.length > 0 && !selectedNetworks.includes(provider.network)) {
      return false;
    }

    // City filter
    if (selectedCities.length > 0 && !selectedCities.includes(provider.city)) {
      return false;
    }

    // State filter
    if (selectedStates.length > 0 && !selectedStates.includes(provider.state)) {
      return false;
    }

    // CCN filter
    if (showOnlyCCNs && !ccnProviderIds.has(provider.dhc)) {
      return false;
    }

    return true;
  });

  // Dynamic filter options based on current filtered results
  const availableTypes = Array.from(new Set(filteredResults.map(p => p.type || "Unknown"))).sort();
  const availableNetworks = Array.from(new Set(filteredResults.map(p => p.network).filter(Boolean))).sort();
  const availableCities = Array.from(new Set(filteredResults.map(p => p.city).filter(Boolean))).sort();
  const availableStates = Array.from(new Set(filteredResults.map(p => p.state).filter(Boolean))).sort();

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
    setShowOnlyCCNs(false);
  };

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Selection handlers
  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

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

      // Add all selected providers with the specified tag
      for (const provider of selectedProviderObjects) {
        await addTeamProviderTag(provider.dhc, tagType);
      }

      // Clear selection after successful save
      setSelectedProviders(new Set());
      setShowBulkActions(false);
      setTaggingProviderId(null);

      // Show success message
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
    selectedCities.length > 0 || selectedStates.length > 0 || showOnlyCCNs;



  try {
    return (
      <PageLayout>
        <div className={styles.page}>
          {/* Search Header */}
          <div className={styles.searchHeader}>
            <ControlsRow
              leftContent={
                <div></div>
              }
              rightContent={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Results Count */}
                  {hasSearched && (
                    <span className={styles.resultsCount}>
                      {filteredResults.length > 0
                        ? `Results ${startIndex + 1}-${Math.min(endIndex, filteredResults.length)} of ${filteredResults.length}`
                        : 'Results 0 of 0'
                      }
                    </span>
                  )}

                  {/* Select All Button */}
                  {paginatedResults.length > 0 && (
                    <label className={`${styles.selectAllLabel} ${!hasTeam ? styles.disabled : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedProviders.size === paginatedResults.length && paginatedResults.length > 0}
                        onChange={hasTeam ? handleSelectAll : undefined}
                        disabled={!hasTeam}
                      />
                      <span>
                        Select All
                        {!hasTeam && <Lock size={10} style={{ marginLeft: '4px' }} />}
                      </span>
                    </label>
                  )}

                  {/* Bulk Actions */}
                  {showBulkActions && hasTeam && (
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
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        className={styles.glassmorphismButton}
                        disabled={currentPage === 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        Previous
                      </button>
                      <span className={styles.pageInfo}>
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        className={styles.glassmorphismButton}
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              }
            >
                             <form
                 onSubmit={(e) => {
                   e.preventDefault();
                   if (lastTrackedSearch.current !== queryText.trim()) {
                     lastTrackedSearch.current = "";
                   }
                   handleSearch();
                 }}
                 style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}
               >
                 <div className="searchBarContainer">
                   <div className="searchIcon">
                     <Search size={16} />
                   </div>
                   <input
                     className="searchInput"
                     type="text"
                     placeholder="Search by name, address, network, etc."
                     value={queryText}
                     onChange={(e) => setQueryText(e.target.value)}
                     ref={searchInputRef}
                   />
                 </div>
                <button
                  type="submit"
                  className={styles.glassmorphismButton}
                  disabled={loading || !queryText.trim()}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  className={`${styles.glassmorphismButton} ${hasActiveFilters ? styles.activeFilter : ''} ${!hasTeam ? styles.disabled : ''}`}
                  onClick={() => hasTeam && setShowFilters(!showFilters)}
                  disabled={!hasTeam}
                  title={!hasTeam ? "Join or create a team to access filters" : ""}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                  {hasActiveFilters && <span className={styles.filterBadge}>●</span>}
                  {!hasTeam && <Lock size={12} style={{ marginLeft: '4px' }} />}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles.glassmorphismButton}
                    onClick={clearAllFilters}
                  >
                    Clear All Filters
                  </button>
                )}
              </form>
            </ControlsRow>



            {/* Collapsible Filters */}
            {showFilters && (
              <div className={styles.filtersPanel}>
                <div className={styles.filtersGrid}>
                  {/* Provider Type Filter */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Provider Type</label>
                    <div className={styles.filterOptions}>
                      {availableTypes.map(type => (
                        <label key={type} className={styles.filterOption}>
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

                  {/* Network Filter */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Network</label>
                    <div className={styles.filterOptions}>
                      {availableNetworks.map(network => (
                        <label key={network} className={styles.filterOption}>
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

                  {/* City Filter */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>City</label>
                    <div className={styles.filterOptions}>
                      {availableCities.map(city => (
                        <label key={city} className={styles.filterOption}>
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

                  {/* State Filter */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>State</label>
                    <div className={styles.filterOptions}>
                      {availableStates.map(state => (
                        <label key={state} className={styles.filterOption}>
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

                  {/* CCN Filter */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Certification</label>
                    <div className={styles.filterOptions}>
                      <label className={styles.filterOption}>
                        <input
                          type="checkbox"
                          checked={showOnlyCCNs}
                          onChange={() => setShowOnlyCCNs(!showOnlyCCNs)}
                        />
                        <span>Medicare-certified only</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Two Column Layout */}
          <div className={styles.mainContent}>
              {/* Left Column - Results */}
              <div className={styles.resultsColumn}>

                {!loading && !hasSearched && (
                  <div className={styles.welcomeMessage}>
                    <h3>Search for a Provider</h3>
                    <p>
                      Start by typing a provider name, network, or location in the search bar.
                    </p>
                  </div>
                )}

                {!loading && hasSearched && filteredResults.length === 0 && (
                  <div className={styles.noResultsMessage}>
                    <h3>No Results Found</h3>
                    <p>
                      No providers match your search criteria. Try:
                    </p>
                    <ul>
                      <li>Using different keywords</li>
                      <li>Checking your spelling</li>
                      <li>Broadening your search terms</li>
                      <li>Clearing some filters</li>
                    </ul>
                  </div>
                )}

                {paginatedResults.length > 0 && (
                  <div className={styles.resultsList}>
                    {paginatedResults.map((provider) => (
                      <div
                        key={provider.dhc}
                        className={`${styles.resultCard} ${selectedProvider?.dhc === provider.dhc ? styles.selectedCard : ""
                          }`}
                        onClick={(e) => {
                          // Don't select the provider if clicking on the provider name (which handles navigation)
                          if (!e.target.closest(`.${styles.providerName}`)) {
                            handleProviderSelect(provider);
                          }
                        }}
                      >
                        <div className={styles.cardContent}>
                          <div className={styles.cardLeft}>
                            <div className={styles.checkboxContainer}>
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
                              />
                            </div>
                            <div className={styles.cardInfo}>
                              <div
                                className={styles.providerName}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/${provider.dhc}`);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {provider.name}
                              </div>
                              <div className={styles.providerAddress}>
                                {provider.street}, {provider.city}, {provider.state} {provider.zip}
                                {provider.phone && (
                                  <span className={styles.providerPhone}> • {provider.phone}</span>
                                )}
                              </div>
                              <div className={styles.providerDetails}>
                                <span className={styles.providerType}>{provider.type || "Unknown"}</span>
                                {provider.network && (
                                  <span className={styles.providerNetwork}>{provider.network}</span>
                                )}
                                {ccnProviderIds.has(provider.dhc) && (
                                  <span className={styles.ccnBadge}>Medicare</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={styles.cardRight}>
                            <div className={styles.cardActions}>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && <p className={styles.error}>{error}</p>}
              </div>

              {/* Right Column - Map */}
              <div className={styles.detailColumn}>
                {selectedProvider ? (
                  <div className={styles.mapContainer}>
                    <div
                      ref={mapContainerRef}
                      className={styles.map}
                    />
                    {(!selectedProvider.latitude || !selectedProvider.longitude ||
                      isNaN(selectedProvider.latitude) || isNaN(selectedProvider.longitude)) && (
                        <div className={styles.mapPlaceholder}>
                          <p>Map location not available for this provider</p>
                        </div>
                      )}
                    {!mapReady && selectedProvider?.latitude && selectedProvider?.longitude &&
                      !isNaN(selectedProvider.latitude) && !isNaN(selectedProvider.longitude) && (
                        <div className={styles.mapLoading}>
                          <p>Loading map...</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className={styles.noSelection}>
                    <p>Select a provider from the results to view location.</p>
                  </div>
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
