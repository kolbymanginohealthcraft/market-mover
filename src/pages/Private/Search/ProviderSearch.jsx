import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Button from "../../../components/Buttons/Button";
import styles from "./ProviderSearch.module.css";
import { apiUrl } from '../../../utils/api';
import { trackProviderSearch } from '../../../utils/activityTracker';
import useTeamProviderTags from '../../../hooks/useTeamProviderTags';

export default function ProviderSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const dropdownRef = useRef(null);

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

  // Error boundary for the component
  if (componentError) {
    return (
      <div className={styles.page}>
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
    );
  }

  // Read search parameter from URL and perform search on page load
  useEffect(() => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      setQueryText(searchTerm);
      handleSearch(searchTerm, true);
    } else {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

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
          const marker = new maplibregl.Marker({ color: '#265947' })
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
    
    if (!fromUrl) {
      navigate(`/app/search?search=${encodeURIComponent(q)}`, { replace: true });
    }
    
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

  const handleSaveAsTeamProviders = async () => {
    if (selectedProviders.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedProviderObjects = paginatedResults.filter(p => 
        selectedProviders.has(p.dhc)
      );
      
      // Add all selected providers as "me" tags
      for (const provider of selectedProviderObjects) {
        await addTeamProviderTag(provider.dhc, 'me');
      }
      
      // Clear selection after successful save
      setSelectedProviders(new Set());
      setShowBulkActions(false);
      
      // Show success message (you could add a toast notification here)
      alert(`${selectedProviderObjects.length} providers tagged as "Me"!`);
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
      <div className={styles.page}>
        {/* Search Header */}
        <div className={styles.searchHeader}>
          <div className={styles.headerTop}>
            <h2>Provider Search</h2>
            <div className={styles.headerActions}>
              <Button
                isFilter
                isActive={hasActiveFilters}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
                {hasActiveFilters && <span className={styles.filterBadge}>●</span>}
              </Button>
              {hasActiveFilters && (
                <Button
                  outline
                  size="sm"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
          
          <form
            className={styles.searchForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (lastTrackedSearch.current !== queryText.trim()) {
                lastTrackedSearch.current = "";
              }
              handleSearch();
            }}
          >
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name, address, network, etc."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              ref={searchInputRef}
            />
            <Button
              type="submit"
              variant="green"
              disabled={loading || !queryText.trim()}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>

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
            <div className={styles.resultsHeader}>
              <div className={styles.resultsHeaderLeft}>
                <h3>
                  {filteredResults.length > 0 
                    ? `Results (${startIndex + 1}-${Math.min(endIndex, filteredResults.length)} of ${filteredResults.length})`
                    : 'Results'
                  }
                </h3>
                {paginatedResults.length > 0 && (
                  <div className={styles.selectionControls}>
                    <label className={styles.selectAllLabel}>
                      <input
                        type="checkbox"
                        checked={selectedProviders.size === paginatedResults.length && paginatedResults.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                )}
              </div>
              
              {showBulkActions && (
                <div className={styles.bulkActions}>
                  <Button
                    variant="green"
                    size="sm"
                    onClick={handleSaveAsTeamProviders}
                    disabled={bulkActionLoading || addingProviders}
                  >
                    {bulkActionLoading || addingProviders ? 'Saving...' : `Save ${selectedProviders.size} as Team Providers`}
                  </Button>
                </div>
              )}
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    outline
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    outline
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

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
                    className={`${styles.resultCard} ${
                      selectedProvider?.dhc === provider.dhc ? styles.selectedCard : ""
                    }`}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.cardLeft}>
                        <div className={styles.checkboxContainer}>
                          <input
                            type="checkbox"
                            checked={selectedProviders.has(provider.dhc)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCheckboxChange(provider.dhc, e.target.checked);
                            }}
                            className={styles.providerCheckbox}
                          />
                        </div>
                        <div className={styles.cardInfo}>
                          <div className={styles.providerName}>{provider.name}</div>
                          <div className={styles.providerDetails}>
                            <span className={styles.providerType}>{provider.type || "Unknown"}</span>
                            {provider.network && (
                              <span className={styles.providerNetwork}>{provider.network}</span>
                            )}
                            {ccnProviderIds.has(provider.dhc) && (
                              <span className={styles.ccnBadge}>Medicare</span>
                            )}
                            {getProviderTags(provider.dhc).length > 0 && (
                              <span className={styles.teamProviderBadge}>Tagged</span>
                            )}
                          </div>
                          <div className={styles.providerAddress}>
                            {provider.street}, {provider.city}, {provider.state} {provider.zip}
                            {provider.phone && (
                              <span className={styles.providerPhone}> • {provider.phone}</span>
                            )}
                          </div>
                          {/* Provider Tags */}
                          <div className={styles.providerTags}>
                            {getProviderTags(provider.dhc).map(tagType => (
                              <span
                                key={tagType}
                                className={styles.tag}
                                style={{ 
                                  backgroundColor: tagType === 'me' ? '#265947' : 
                                               tagType === 'partner' ? '#3599b8' : 
                                               tagType === 'competitor' ? '#d64550' : 
                                               tagType === 'target' ? '#f1b62c' : '#5f6b6d'
                                }}
                              >
                                {tagType === 'me' ? 'Me' : 
                                 tagType === 'partner' ? 'Partner' : 
                                 tagType === 'competitor' ? 'Competitor' : 
                                 tagType === 'target' ? 'Target' : tagType}
                                <button
                                  className={styles.tagRemove}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTeamProviderTag(provider.dhc, tagType);
                                  }}
                                  aria-label={`Remove ${tagType} tag`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={styles.cardRight}>
                        <div className={styles.cardActions}>
                          {/* Tag Dropdown */}
                          <div className={styles.tagDropdown}>
                            <button
                              className={styles.tagButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle tag dropdown for this provider
                                setTaggingProviderId(taggingProviderId === provider.dhc ? null : provider.dhc);
                              }}
                            >
                              Tag
                            </button>
                            {taggingProviderId === provider.dhc && (
                              <div className={styles.tagDropdownMenu}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addTeamProviderTag(provider.dhc, 'me');
                                    setTaggingProviderId(null);
                                  }}
                                  className={styles.tagOption}
                                >
                                  Me
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addTeamProviderTag(provider.dhc, 'partner');
                                    setTaggingProviderId(null);
                                  }}
                                  className={styles.tagOption}
                                >
                                  Partner
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addTeamProviderTag(provider.dhc, 'competitor');
                                    setTaggingProviderId(null);
                                  }}
                                  className={styles.tagOption}
                                >
                                  Competitor
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addTeamProviderTag(provider.dhc, 'target');
                                    setTaggingProviderId(null);
                                  }}
                                  className={styles.tagOption}
                                >
                                  Target
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            className={styles.arrowButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/app/provider/${provider.dhc}/overview`);
                            }}
                          >
                            →
                          </button>
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
    );
  } catch (error) {
    console.error("ProviderSearch component error:", error);
    setComponentError(error);
    return null;
  }
}
