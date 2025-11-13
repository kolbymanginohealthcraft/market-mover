import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { useDropdownClose } from '../../../hooks/useDropdownClose';
import styles from './AdvancedSearch.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import Spinner from '../../../components/Buttons/Spinner';
import { MapPin, ChevronDown, X, Search, Database, Layers, Navigation, Bookmark } from 'lucide-react';
import { geocodeAddress, reverseGeocode } from '../Markets/services/geocodingService';

export default function DensitySearch() {
  const { hasTeam } = useUserTeam();
  const searchInputRef = useRef(null);
  
  // My Taxonomies
  const [taxonomyTags, setTaxonomyTags] = useState([]);
  const [selectedTaxonomyTag, setSelectedTaxonomyTag] = useState(null);
  const [taxonomyDropdownOpen, setTaxonomyDropdownOpen] = useState(false);
  const [taxonomyTagDetails, setTaxonomyTagDetails] = useState({});
  const [filters, setFilters] = useState({
    taxonomyCodes: []
  });
  
  // Density location state
  const [densityLocationInput, setDensityLocationInput] = useState('');
  const [densityCoordinates, setDensityCoordinates] = useState({ lat: null, lng: null });
  const [densityLocationInfo, setDensityLocationInfo] = useState({ city: null, state: null });
  const [densityLoading, setDensityLoading] = useState(false);
  const [densityError, setDensityError] = useState(null);
  const [densityResults, setDensityResults] = useState(null);
  const [taxonomyDetails, setTaxonomyDetails] = useState({});

  useDropdownClose(taxonomyDropdownOpen, setTaxonomyDropdownOpen);

  useEffect(() => {
    fetchTaxonomyTags();
  }, []);

  // Focus search input on page load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Re-fetch density when filters change (if coordinates exist and we have results)
  useEffect(() => {
    // Only re-fetch if we have coordinates and results already exist (not on initial mount)
    if (densityCoordinates.lat && densityResults && !densityLoading) {
      fetchTaxonomyDensity(densityCoordinates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaxonomyTag, filters.taxonomyCodes]);

  const fetchTaxonomyTags = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        return;
      }

      const { data, error } = await supabase
        .from('team_taxonomy_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching taxonomy tags:', error);
        return;
      }

      setTaxonomyTags(data || []);

      // Fetch taxonomy details for all tags
      if (data && data.length > 0) {
        const codes = [...new Set(data.map(tag => tag.taxonomy_code))];
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
      }
    } catch (err) {
      console.error('Error fetching taxonomy tags:', err);
    }
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

  const handleDensityLocationSearch = async () => {
    if (!densityLocationInput.trim()) {
      setDensityError('Please enter a location');
      return;
    }

    setDensityLoading(true);
    setDensityError(null);

    try {
      let coords = null;
      const input = densityLocationInput.trim();

      // Auto-detect if input looks like coordinates (two numbers separated by comma)
      const coordinatePattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
      if (coordinatePattern.test(input)) {
        // Parse coordinates (e.g., "40.7128, -74.0060" or "40.7128,-74.0060")
        const parts = input.split(/[,\s]+/).filter(p => p);
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              coords = { lat, lng };
            }
          }
        }
        if (!coords) {
          throw new Error('Invalid coordinates format. Use: latitude, longitude');
        }
      } else {
        // Geocode address or zip code
        coords = await geocodeAddress(input);
      }

      if (!coords) {
        throw new Error('Could not determine location coordinates');
      }

      setDensityCoordinates(coords);
      
      // Reverse geocode to get city and state
      try {
        const locationInfo = await reverseGeocode(coords.lat, coords.lng);
        setDensityLocationInfo(locationInfo);
      } catch (err) {
        console.error('Reverse geocoding error:', err);
        setDensityLocationInfo({ city: null, state: null });
      }
      
      await fetchTaxonomyDensity(coords);
    } catch (err) {
      console.error('Error processing location:', err);
      setDensityError(err.message || 'Failed to process location');
      setDensityLoading(false);
    }
  };

  const fetchTaxonomyDensity = async (coords) => {
    try {
      const requestBody = {
        latitude: coords.lat,
        longitude: coords.lng
      };

      // Add taxonomy codes filter (from selected taxonomy tag or filters)
      const taxonomyCodesToFilter = [];
      if (selectedTaxonomyTag) {
        taxonomyCodesToFilter.push(selectedTaxonomyTag.taxonomy_code);
      }
      if (filters.taxonomyCodes && filters.taxonomyCodes.length > 0) {
        taxonomyCodesToFilter.push(...filters.taxonomyCodes);
      }
      if (taxonomyCodesToFilter.length > 0) {
        requestBody.taxonomyCodes = [...new Set(taxonomyCodesToFilter)];
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

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseInt(num).toLocaleString();
  };

  const tagTypeLabels = {
    staff: 'Staff',
    my_setting: 'My Setting',
    upstream: 'Upstream',
    other: 'Other'
  };

  return (
    <div className={styles.container}>
        {/* Top Controls Bar */}
        <div className={styles.controlsBar}>
          {/* Location Input */}
          <div className="searchBarContainer" style={{ width: '300px' }}>
            <div className="searchIcon">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={densityLocationInput}
              onChange={(e) => setDensityLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleDensityLocationSearch();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  if (densityLocationInput) {
                    setDensityLocationInput('');
                    setDensityCoordinates({ lat: null, lng: null });
                    setDensityLocationInfo({ city: null, state: null });
                  } else {
                    e.currentTarget.blur();
                  }
                }
              }}
              placeholder="e.g., New York, NY or 10001 or 40.7128, -74.0060"
              className="searchInput"
              style={{ width: '100%', paddingRight: densityLocationInput ? '70px' : '12px' }}
              data-search-enhanced="true"
              disabled={densityLoading}
              ref={searchInputRef}
            />
            {densityLocationInput && (
              <button
                onClick={() => {
                  setDensityLocationInput('');
                  setDensityCoordinates({ lat: null, lng: null });
                  setDensityLocationInfo({ city: null, state: null });
                }}
                className="clearButton"
                style={{ right: '8px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleDensityLocationSearch}
            className="sectionHeaderButton primary"
            disabled={densityLoading || !densityLocationInput.trim()}
            title={densityLoading ? 'Analyzing...' : 'Analyze'}
          >
            <Navigation size={14} />
            {densityLoading ? 'Analyzing...' : 'Analyze'}
          </button>

          {/* My Taxonomies Dropdown */}
          {hasTeam && taxonomyTags.length > 0 && (
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  <Bookmark size={14} />
                  {selectedTaxonomyTag ? 
                    selectedTaxonomyTag.taxonomy_code : 
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
                style={{
                  fontWeight: !selectedTaxonomyTag ? '600' : '400',
                  background: !selectedTaxonomyTag ? 'rgba(0, 192, 139, 0.1)' : 'none'
                }}
              >
                All Taxonomies
              </button>
              
              {(() => {
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
                          const codes = tags.map(t => t.taxonomy_code);
                          const allCodesSelected = codes.every(c => filters.taxonomyCodes.includes(c));
                          if (allCodesSelected) {
                            setFilters(prev => ({
                              ...prev,
                              taxonomyCodes: prev.taxonomyCodes.filter(c => !codes.includes(c))
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              taxonomyCodes: [...new Set([...prev.taxonomyCodes, ...codes])]
                            }));
                          }
                          setSelectedTaxonomyTag(null);
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
                        const isSelected = selectedTaxonomyTag?.id === tag.id || filters.taxonomyCodes.includes(tag.taxonomy_code);
                        
                        return (
                          <button 
                            key={tag.id}
                            className={styles.dropdownItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedTaxonomyTag?.id === tag.id) {
                                // If this is the currently selected tag, deselect it
                                handleTaxonomyTagSelect(null);
                                setTaxonomyDropdownOpen(false);
                              } else {
                                // Multi-select: toggle individual taxonomy
                                const newCodes = isSelected
                                  ? filters.taxonomyCodes.filter(code => code !== tag.taxonomy_code)
                                  : [...new Set([...filters.taxonomyCodes, tag.taxonomy_code])];
                                
                                setSelectedTaxonomyTag(null); // Clear single selection when multi-selecting
                                setFilters(prev => ({ ...prev, taxonomyCodes: newCodes }));
                                // Keep dropdown open for multi-select
                              }
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

          {densityCoordinates.lat && (
            <div className={styles.densityLocation}>
              <MapPin size={14} />
              {densityLocationInfo.city && densityLocationInfo.state ? (
                <>
                  {densityLocationInfo.city}, {densityLocationInfo.state}
                  <span style={{ margin: '0 4px', color: 'var(--gray-400)' }}>•</span>
                  {densityCoordinates.lat.toFixed(6)}, {densityCoordinates.lng.toFixed(6)}
                </>
              ) : (
                <>
                  Location: {densityCoordinates.lat.toFixed(6)}, {densityCoordinates.lng.toFixed(6)}
                </>
              )}
            </div>
          )}

          <div className={styles.spacer}></div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Active Filter Chips - Above Content */}
          {(selectedTaxonomyTag || (filters.taxonomyCodes && filters.taxonomyCodes.length > 0)) && (
            <div className={styles.activeFiltersBar}>
              <div className={styles.activeFilters}>
                <span className={styles.filtersLabel}>Filters:</span>
                {selectedTaxonomyTag && (
                  <div className={styles.filterChip}>
                    <span>
                      {selectedTaxonomyTag.taxonomy_code}
                      {(() => {
                        const details = taxonomyTagDetails[selectedTaxonomyTag.taxonomy_code];
                        const classification = details?.classification || details?.taxonomy_classification;
                        return classification ? ` (${classification})` : '';
                      })()}
                    </span>
                    <button onClick={() => {
                      handleTaxonomyTagSelect(null);
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {filters.taxonomyCodes
                  .filter(code => !selectedTaxonomyTag || code !== selectedTaxonomyTag.taxonomy_code)
                  .map(code => {
                    const details = taxonomyTagDetails[code];
                    const classification = details?.classification || details?.taxonomy_classification;
                    return (
                      <div key={`taxonomy-${code}`} className={styles.filterChip}>
                        <span>
                          {code}
                          {classification && ` (${classification})`}
                        </span>
                        <button onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            taxonomyCodes: prev.taxonomyCodes.filter(c => c !== code)
                          }));
                        }}>
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Density Panel */}
          <div className={styles.densityPanel}>
          {densityError && (
            <div className={styles.densityError}>
              {densityError}
            </div>
          )}

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
        </div>
      </div>
  );
}

