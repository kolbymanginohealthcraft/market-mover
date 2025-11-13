import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search as SearchIcon, School, Church, UtensilsCrossed, Hospital, Pill, Trees } from 'lucide-react';
import { supabase } from '../../../../app/supabaseClient';
import Dropdown from '../../../../components/Buttons/Dropdown';
import Spinner from '../../../../components/Buttons/Spinner';
import { apiUrl } from '../../../../utils/api';
import PlanetFeaturesMap from './PlanetFeaturesMap';
import styles from './PlanetFeaturesExplorer.module.css';

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString();
};

const formatTagList = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '—';
  }
  return items
    .map((item) => {
      const value = item.value;
      const display = value === null || value === undefined || value === '' ? '(no value)' : value;
      return item.key ? `${item.key}=${display}` : display;
    })
    .join(', ');
};

const formatGeometryType = (geometryType) => {
  if (!geometryType) return null;
  return geometryType.replace(/^ST_/i, '').toLowerCase();
};

export default function PlanetFeaturesExplorer() {
  const [markets, setMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [detailFeatures, setDetailFeatures] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailMeta, setDetailMeta] = useState(null);
  const [searchDetailMode, setSearchDetailMode] = useState(false);
  const [tagKeyQuery, setTagKeyQuery] = useState('');
  const [activeTagChip, setActiveTagChip] = useState(null);
  const [selectedTagValue, setSelectedTagValue] = useState(null);
  const [expandedTagKey, setExpandedTagKey] = useState(null);
  const [activeResultsTab, setActiveResultsTab] = useState('map');

  const quickFilters = useMemo(() => [
    { label: 'Schools', tagKey: 'amenity', tagValue: 'school', Icon: School },
    { label: 'Churches', tagKey: 'amenity', tagValue: 'place_of_worship', Icon: Church },
    { label: 'Restaurants', tagKey: 'amenity', tagValue: 'restaurant', Icon: UtensilsCrossed },
    { label: 'Hospitals', tagKey: 'amenity', tagValue: 'hospital', Icon: Hospital },
    { label: 'Pharmacies', tagKey: 'amenity', tagValue: 'pharmacy', Icon: Pill },
    { label: 'Parks', tagKey: 'leisure', tagValue: 'park', Icon: Trees },
  ], []);

  const clearDetail = useCallback(() => {
    setActiveDetail(null);
    setDetailFeatures([]);
    setDetailError(null);
    setDetailMeta(null);
    setSearchDetailMode(false);
    setActiveTagChip(null);
    setSelectedTagValue(null);
    setExpandedTagKey(null);
    setActiveResultsTab('map');
  }, [setActiveResultsTab]);

  useEffect(() => {
    let isMounted = true;

    const loadMarkets = async () => {
      try {
        setMarketsLoading(true);
        setMarketsError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          throw userError;
        }
        if (!user) {
          if (isMounted) {
            setMarkets([]);
          }
          return;
        }

        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (isMounted) {
          setMarkets(data || []);
        }
      } catch (error) {
        console.error('Failed to load markets:', error);
        if (isMounted) {
          setMarketsError('Unable to load saved markets.');
          setMarkets([]);
        }
      } finally {
        if (isMounted) {
          setMarketsLoading(false);
        }
      }
    };

    loadMarkets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    clearDetail();
  }, [selectedMarket, clearDetail]);

  const searchInputRef = useRef(null);

  const handleSearchSubmit = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }
    const value = searchInputRef.current ? searchInputRef.current.value : searchTerm;
    const trimmed = value.trim();
    setSearchTerm(trimmed);
    setActiveTagChip(null);

    if (!trimmed) {
      setSearchDetailMode(false);
      clearDetail();
      return;
    }

    setSearchDetailMode(true);
    setActiveDetail({
      featureType: 'ALL',
      featureClass: 'ALL',
      featureCount: 0,
      requestId: Date.now(),
      searchMode: true,
      searchValue: trimmed,
      tagKey: null,
      provider: 'bigquery',
    });
    setDetailFeatures([]);
  }, [searchTerm, clearDetail]);

  useEffect(() => {
    if (!selectedMarket) {
      setSummaryData(null);
      setSummaryError(null);
      setSummaryLoading(false);
      return;
    }

    const numericRadius = Number(selectedMarket.radius_miles);
    if (!Number.isFinite(numericRadius) || numericRadius <= 0) {
      setSummaryData(null);
      setSummaryError(null);
      setSummaryLoading(false);
      return;
    }

    const controller = new AbortController();
    setSummaryLoading(true);
    setSummaryError(null);

    const url = new URL(apiUrl('/api/planet-features/summary'), window.location.origin);
    url.searchParams.set('latitude', selectedMarket.latitude);
    url.searchParams.set('longitude', selectedMarket.longitude);
    url.searchParams.set('radius', numericRadius);
    url.searchParams.set('onlyPoints', 'true');

    const fetchSummary = async () => {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Request failed');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Unable to load summary');
        }

        setSummaryData(result.data);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load planet features summary:', error);
        setSummaryError('Unable to load OpenStreetMap features for this market.');
        setSummaryData(null);
      } finally {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      controller.abort();
      setSummaryLoading(false);
    };
  }, [selectedMarket, clearDetail]);

  const tagKeyRows = useMemo(() => summaryData?.tagKeys || [], [summaryData]);

  const filteredTagKeys = useMemo(() => {
    if (!tagKeyRows.length) return [];
    const term = tagKeyQuery.trim().toLowerCase();
    if (!term) return tagKeyRows;
    return tagKeyRows.filter((row) => {
      if (row?.key?.toLowerCase().includes(term)) {
        return true;
      }
      return (row?.top_values || []).some((value) => {
        const normalized = value?.value ?? '';
        return typeof normalized === 'string' && normalized.toLowerCase().includes(term);
      });
    });
  }, [tagKeyRows, tagKeyQuery]);

  const chipTagKeys = useMemo(() => {
    const source = tagKeyQuery.trim() ? filteredTagKeys : tagKeyRows;
    return source.slice(0, 120);
  }, [filteredTagKeys, tagKeyRows, tagKeyQuery]);

  const mapCenter = useMemo(() => {
    if (!selectedMarket) return null;
    return {
      lat: Number(selectedMarket.latitude),
      lng: Number(selectedMarket.longitude),
    };
  }, [selectedMarket]);

  const mapFeaturesToRender = activeDetail ? detailFeatures : [];
  const hasMapFeatures = Boolean(activeDetail) && Boolean(mapCenter) && mapFeaturesToRender.length > 0;
  const mapUpdating = Boolean(activeDetail) && detailLoading;

  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    setMarketDropdownOpen(false);
  };

  const fetchDetailFeatures = useCallback(
    async ({ featureType, featureClass, featureCount, searchMode, searchValue, tagKey }) => {
      if (!selectedMarket) {
        return;
      }

      const effectiveSearchTerm = searchMode 
        ? (typeof searchValue === 'string' ? searchValue : '') 
        : (tagKey && typeof searchValue === 'string' && searchValue ? searchValue : '');

      setDetailLoading(true);
      setDetailError(null);
      setDetailMeta(null);

      try {
        const url = new URL(apiUrl('/api/planet-features/features'), window.location.origin);
        url.searchParams.set('latitude', selectedMarket.latitude);
        url.searchParams.set('longitude', selectedMarket.longitude);
        url.searchParams.set('radius', selectedMarket.radius_miles);
        url.searchParams.set('featureType', featureType);
        url.searchParams.set('featureClass', featureClass);
        url.searchParams.set('onlyPoints', 'true');
        url.searchParams.set('includeAreas', 'true');
        if (tagKey) {
          url.searchParams.set('tagKey', tagKey);
        }
        if (effectiveSearchTerm) {
          url.searchParams.set('searchTerm', effectiveSearchTerm);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Request failed');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Unable to load feature details');
        }

        const features = Array.isArray(result.data?.features) ? result.data.features : [];
        setDetailFeatures(
          features.map((feature) => ({
            ...feature,
            geometryType: formatGeometryType(feature.geometryType),
          }))
        );
        setDetailMeta(result.data?.query || null);
      } catch (error) {
        console.error('Failed to load feature details:', error);
        setDetailError(error.message || 'Unable to load feature details right now.');
        setDetailMeta(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [selectedMarket, searchTerm]
  );

  const fetchOverpassFeatures = useCallback(
    async ({ searchValue }) => {
      if (!selectedMarket) {
        return;
      }

      const trimmed = typeof searchValue === 'string' ? searchValue.trim() : '';
      if (!trimmed) {
        setDetailError('Enter a search term to query live data.');
        setDetailFeatures([]);
        setDetailMeta(null);
        return;
      }

      setDetailLoading(true);
      setDetailError(null);
      setDetailMeta(null);

      try {
        const url = new URL(apiUrl('/api/planet-features/overpass'), window.location.origin);
        url.searchParams.set('lat', selectedMarket.latitude);
        url.searchParams.set('lon', selectedMarket.longitude);
        url.searchParams.set('radius', selectedMarket.radius_miles);
        url.searchParams.set('search', trimmed);

        const response = await fetch(url.toString());
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Request failed');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Unable to load live OpenStreetMap data');
        }

        const elements = Array.isArray(result.data?.elements) ? result.data.elements : [];
        const focusedKeys = ['name', 'brand', 'amenity', 'shop', 'cuisine', 'addr:housenumber', 'addr:street', 'addr:city', 'addr:postcode'];
        const features = elements
          .map((element) => {
            const lat = Number(element.lat ?? element.center?.lat);
            const lon = Number(element.lon ?? element.center?.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
              return null;
            }
            const tags = element.tags || {};
            const primary =
              tags.amenity ||
              tags.shop ||
              tags.leisure ||
              tags.tourism ||
              tags.landuse ||
              tags.highway ||
              tags.natural ||
              tags.place ||
              null;

            const focusedTags = focusedKeys
              .filter((key) => key in tags)
              .map((key) => ({ key, value: tags[key] }));

            const extraTags = Object.entries(tags)
              .filter(([key]) => !focusedKeys.includes(key))
              .slice(0, 10)
              .map(([key, value]) => ({ key, value }));

            return {
              key: `${element.type}-${element.id}`,
              osmId: String(element.id),
              featureType: primary || element.type,
              featureClass: primary || element.type,
              geometryType: element.type === 'node' ? 'point' : element.type,
              lon,
              lat,
              name: tags.name || null,
              focusedTags,
              extraTags,
            };
          })
          .filter(Boolean)
          .map((feature) => ({
            ...feature,
            geometryType: formatGeometryType(feature.geometryType),
          }));

        setDetailFeatures(features);
        setDetailMeta({
          provider: 'overpass',
          returnedCount: features.length,
          executedAt: new Date().toISOString(),
          endpoint: result.data?.query?.endpoint || null,
        });
      } catch (error) {
        console.error('Failed to query Overpass:', error);
        setDetailError(error.message || 'Unable to load live OpenStreetMap data.');
        setDetailMeta(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [selectedMarket]
  );


  const handleTagChipToggle = useCallback(
    (tagKey) => {
      if (!tagKey) {
        return;
      }

      if (expandedTagKey === tagKey) {
        setExpandedTagKey(null);
        setSelectedTagValue(null);
        return;
      }

      setExpandedTagKey(tagKey);
      setSelectedTagValue(null);
    },
    [expandedTagKey]
  );

  const handleTagValueSelect = useCallback(
    (tagKey, tagValue) => {
      if (!tagKey) {
        return;
      }

      const isSameSelection = activeTagChip === tagKey && selectedTagValue === tagValue;

      if (isSameSelection) {
        clearDetail();
        setActiveTagChip(null);
        setSelectedTagValue(null);
        setExpandedTagKey(null);
        return;
      }

      setSearchDetailMode(false);
      setActiveTagChip(tagKey);
      setSelectedTagValue(tagValue);
      setActiveDetail({
        featureType: 'ALL',
        featureClass: 'ALL',
        featureCount: 0,
        requestId: Date.now(),
        searchMode: false,
        searchValue: tagValue || '',
        tagKey,
        provider: 'bigquery',
      });
      setDetailFeatures([]);
    },
    [activeTagChip, selectedTagValue, clearDetail]
  );

  const handleOverpassSearch = useCallback(() => {
    if (!selectedMarket) {
      return;
    }

    const value = searchInputRef.current ? searchInputRef.current.value : searchTerm;
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed) {
      setDetailError('Enter a search term to query live data.');
      return;
    }

    setSearchTerm(trimmed);
    setSearchDetailMode(true);
    setActiveTagChip(null);
    setDetailFeatures([]);
    setDetailMeta(null);
    setDetailError(null);
    setActiveDetail({
      featureType: 'ALL',
      featureClass: 'ALL',
      featureCount: 0,
      requestId: Date.now(),
      searchMode: true,
      searchValue: trimmed,
      tagKey: null,
      provider: 'overpass',
    });
  }, [selectedMarket, searchTerm]);

  useEffect(() => {
    if (!activeDetail) {
      return;
    }
    const effectiveSearchValue = activeDetail.searchMode 
      ? activeDetail.searchValue 
      : (activeDetail.tagKey && activeDetail.searchValue ? activeDetail.searchValue : '');

    if (activeDetail.provider === 'overpass') {
      fetchOverpassFeatures({ searchValue: effectiveSearchValue });
      return;
    }

    fetchDetailFeatures({ ...activeDetail, searchValue: effectiveSearchValue });
  }, [activeDetail, fetchDetailFeatures, fetchOverpassFeatures]);

  return (
    <div className={styles.page}>
      <div className={styles.controlsBar}>
        <div className={styles.controlsBarLeft}>
          <Dropdown
            trigger={
              <button type="button" className={styles.marketSelectTrigger}>
                <span>{selectedMarket ? selectedMarket.name : marketsLoading ? 'Loading markets…' : 'Select market'}</span>
                <ChevronDown strokeWidth={1.75} />
              </button>
            }
            isOpen={marketDropdownOpen}
            onToggle={setMarketDropdownOpen}
            className={styles.dropdownMenu}
          >
            {marketsLoading ? (
              <div className={styles.dropdownMessage}>Loading saved markets…</div>
            ) : marketsError ? (
              <div className={styles.dropdownMessage}>{marketsError}</div>
            ) : markets.length === 0 ? (
              <div className={styles.dropdownMessage}>No saved markets available.</div>
            ) : (
              markets.map((market) => (
                <button
                  key={market.id}
                  type="button"
                  className={`${styles.dropdownItem} ${selectedMarket?.id === market.id ? styles.dropdownItemActive : ''}`}
                  onClick={() => handleMarketSelect(market)}
                >
                  <div className={styles.marketName}>{market.name}</div>
                  <div className={styles.marketMeta}>
                    {market.city}, {market.state} • {market.radius_miles} mi radius
                  </div>
                </button>
              ))
            )}
          </Dropdown>

          {selectedMarket && (
            <div className={styles.marketSummary}>
              <span>{selectedMarket.city}, {selectedMarket.state}</span>
              <span className={styles.marketSummaryBadge}>{selectedMarket.radius_miles} mi radius</span>
            </div>
          )}

          {activeDetail && !searchDetailMode && (
            <div className={styles.activeFilters}>
              {activeDetail.tagKey && (
                <div className={styles.activeFilterChip}>
                  <span>{activeDetail.tagKey}{selectedTagValue ? ` = ${selectedTagValue}` : ''}</span>
                  <button
                    type="button"
                    onClick={clearDetail}
                    className={styles.activeFilterClose}
                  >
                    ×
                  </button>
                </div>
              )}
              {!activeDetail.tagKey && activeDetail.featureClass && activeDetail.featureClass !== 'ALL' && (
                <div className={styles.activeFilterChip}>
                  <span>{activeDetail.featureClass}</span>
                  <button
                    type="button"
                    onClick={clearDetail}
                    className={styles.activeFilterClose}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.controlsBarRight}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <SearchIcon size={16} strokeWidth={1.75} />
            <input
              ref={searchInputRef}
              type="search"
              defaultValue={searchTerm}
              placeholder="Search names or tags"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchTerm('');
                  if (searchInputRef.current) {
                    searchInputRef.current.value = '';
                  }
                  setSearchDetailMode(false);
                  clearDetail();
                }
              }}
            />
          </form>
          <button
            type="button"
            className={styles.liveSearchButton}
            onClick={handleOverpassSearch}
            disabled={!selectedMarket || detailLoading}
          >
            Live OSM search
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            {summaryLoading ? (
              <div className={styles.sidebarMessage}>Loading filters…</div>
            ) : summaryError ? (
              <div className={styles.sidebarMessage}>{summaryError}</div>
            ) : !selectedMarket ? (
              <div className={styles.sidebarMessage}>Select a saved market to start exploring features.</div>
            ) : !summaryData ? (
              <div className={styles.sidebarMessage}>No OpenStreetMap data is available for this market.</div>
            ) : (
              <>
                {quickFilters.length > 0 && (
                  <div className={styles.sidebarSection}>
                    <div className={styles.sidebarSectionHeader}>
                      <h3>Quick Filters</h3>
                      <span>Common locations for healthcare analysis</span>
                    </div>
                    <div className={styles.quickFiltersGrid}>
                      {quickFilters.map((filter) => {
                        const isActive = activeTagChip === filter.tagKey && selectedTagValue === filter.tagValue;
                        const IconComponent = filter.Icon;
                        return (
                          <button
                            key={`${filter.tagKey}-${filter.tagValue}`}
                            type="button"
                            className={`${styles.quickFilterButton} ${isActive ? styles.quickFilterButtonActive : ''}`}
                            onClick={() => handleTagValueSelect(filter.tagKey, filter.tagValue)}
                          >
                            {IconComponent && <IconComponent size={16} strokeWidth={1.75} />}
                            <span className={styles.quickFilterLabel}>{filter.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tagKeyRows.length > 0 && (
                  <div className={styles.sidebarSection}>
                    <div className={styles.sidebarSectionHeader}>
                      <h3>Tag Explorer</h3>
                      <span>{formatNumber(tagKeyRows.length)} tag keys available</span>
                    </div>
                    <div className={styles.tagKeyToolbar}>
                      <input
                        type="search"
                        value={tagKeyQuery}
                        onChange={(event) => setTagKeyQuery(event.target.value)}
                        className={styles.tagKeySearch}
                        placeholder="Find tag keys or values"
                      />
                      {tagKeyQuery && (
                        <button
                          type="button"
                          className={styles.tagKeyClear}
                          onClick={() => setTagKeyQuery('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {chipTagKeys.length === 0 ? (
                      <div className={styles.emptyState}>No tags match this filter.</div>
                    ) : (
                      <div className={styles.filterChipsScrollable}>
                        {chipTagKeys.map((tag) => {
                          const isExpanded = expandedTagKey === tag.key;
                          const isActive = activeTagChip === tag.key;
                          const hasValues = tag.top_values && tag.top_values.length > 0;
                          
                          return (
                            <div key={tag.key} className={styles.tagKeyGroup}>
                              <button
                                type="button"
                                className={`${styles.filterChip} ${styles.tagKeyChip} ${isActive ? styles.filterChipActive : styles.filterChipInactive} ${isExpanded ? styles.tagKeyExpanded : ''}`}
                                onClick={() => handleTagChipToggle(tag.key)}
                              >
                                <span>{tag.key}</span>
                                <span className={styles.filterChipCount}>{formatNumber(tag.tag_count)}</span>
                                {hasValues && (
                                  <ChevronDown 
                                    size={14} 
                                    strokeWidth={2}
                                    className={`${styles.tagKeyChevron} ${isExpanded ? styles.tagKeyChevronExpanded : ''}`}
                                  />
                                )}
                              </button>
                              {isExpanded && hasValues && (
                                <div className={styles.tagValuesContainer}>
                                  <div className={styles.tagValuesList}>
                                    {tag.top_values.map((valueEntry, idx) => {
                                      const value = valueEntry?.value ?? valueEntry?.tag_value ?? '';
                                      const count = valueEntry?.value_count ?? valueEntry?.count ?? 0;
                                      const isValueSelected = isActive && selectedTagValue === value;
                                      
                                      return (
                                        <button
                                          key={`${tag.key}-${value}-${idx}`}
                                          type="button"
                                          className={`${styles.tagValueChip} ${isValueSelected ? styles.tagValueChipActive : ''}`}
                                          onClick={() => handleTagValueSelect(tag.key, value)}
                                        >
                                          <span className={styles.tagValueText}>
                                            {value === null || value === '' ? '(no value)' : value}
                                          </span>
                                          <span className={styles.tagValueCount}>{formatNumber(count)}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {tag.top_values.length < tag.tag_count && (
                                    <div className={styles.tagValueHint}>
                                      Showing top {tag.top_values.length} values
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        <div className={styles.resultsArea}>
          {summaryLoading && (
            <div className={styles.loadingState}>
              <Spinner />
              <span>Loading OpenStreetMap data…</span>
            </div>
          )}

          {!summaryLoading && summaryError && (
            <div className={styles.errorState}>{summaryError}</div>
          )}

          {!summaryLoading && !summaryError && (!selectedMarket || !summaryData) && (
            <div className={styles.emptyState}>Select a saved market to explore OpenStreetMap data.</div>
          )}

          {!summaryLoading && !summaryError && selectedMarket && summaryData && (
            <>
              <div className={styles.resultsTabs}>
                <button
                  type="button"
                  className={`${styles.resultsTab} ${activeResultsTab === 'map' ? styles.resultsTabActive : ''}`}
                  onClick={() => setActiveResultsTab('map')}
                >
                  Map
                </button>
                <button
                  type="button"
                  className={`${styles.resultsTab} ${activeResultsTab === 'listing' ? styles.resultsTabActive : ''}`}
                  onClick={() => setActiveResultsTab('listing')}
                >
                  Listing
                </button>
              </div>

              <div className={styles.tabPanel}>
                {activeResultsTab === 'listing' ? (
                  activeDetail ? (
                    <section className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h2>
                          {activeDetail.searchMode
                            ? 'Search results'
                            : activeDetail.tagKey
                            ? `${activeDetail.tagKey}${selectedTagValue ? ` = ${selectedTagValue}` : ''}`
                            : `${activeDetail.featureClass} features`}
                        </h2>
                        <span className={styles.sectionMeta}>
                          {activeDetail.searchMode
                            ? `Showing ${formatNumber(detailFeatures.length)} results${activeDetail.searchValue ? ` for "${activeDetail.searchValue}"` : ''}`
                            : activeDetail.tagKey
                            ? `Showing ${formatNumber(detailFeatures.length)} features${selectedTagValue ? ` where ${activeDetail.tagKey} = "${selectedTagValue}"` : ` with ${activeDetail.tagKey} tag`}`
                            : `Showing ${formatNumber(detailFeatures.length)} of ${formatNumber(activeDetail.featureCount)} results`}
                        </span>
                        {activeDetail.provider === 'overpass' && (
                          <span className={styles.sectionMetaHint}>
                            Live OpenStreetMap (Overpass)
                            {detailMeta?.endpoint
                              ? ` • ${detailMeta.endpoint.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`
                              : ''}
                          </span>
                        )}
                        <div className={styles.sectionActions}>
                          <button type="button" className={styles.clearDetailButton} onClick={clearDetail}>
                            Clear selection
                          </button>
                        </div>
                      </div>

                      {detailLoading ? (
                        <div className={styles.loadingState}>
                          <Spinner />
                          <span>Loading feature list…</span>
                        </div>
                      ) : detailError ? (
                        <div className={styles.errorState}>{detailError}</div>
                      ) : detailFeatures.length === 0 ? (
                        <div className={styles.emptyState}>
                          {activeDetail.searchMode
                            ? 'No features matched this search.'
                            : activeDetail.tagKey
                            ? 'No features found with this tag.'
                            : 'No features matched this classification.'}
                        </div>
                      ) : (
                        <>
                          <table className={`${styles.table} ${styles.detailTable}`}>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Coordinates</th>
                                <th>Key tags</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailFeatures.map((feature, index) => {
                                const fallbackKey = `${feature.featureType || 'feature'}-${feature.name || 'unnamed'}-${index}`;
                                const rowKey = feature.osmId || fallbackKey;
                                return (
                                <tr key={rowKey}>
                                  <td className={styles.detailNameCell}>
                                    <div>{feature.name || '(Unnamed feature)'}</div>
                                    <div className={styles.detailSub}>
                                      {feature.featureType}
                                      {feature.geometryType && ` • ${feature.geometryType}`}
                                    </div>
                                  </td>
                                  <td>
                                    {Number.isFinite(feature.lat) && Number.isFinite(feature.lon)
                                      ? `${feature.lat.toFixed(4)}, ${feature.lon.toFixed(4)}`
                                      : '—'}
                                  </td>
                                  <td>
                                    <div className={styles.detailTagList}>
                                      {(feature.focusedTags || []).map((tag) => (
                                        <span key={`${feature.osmId}-${tag.key}`} className={styles.detailTagChip}>
                                          {tag.key}={tag.value ?? '(no value)'}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )})}
                            </tbody>
                          </table>
                          {detailMeta && detailMeta.limit && detailMeta.returnedCount >= detailMeta.limit && (
                            <div className={styles.detailMetaNote}>
                              Showing the first {formatNumber(detailMeta.limit)} results. Narrow the selection to load more.
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  ) : (
                    <div className={styles.emptyState}>
                      Select a feature type, class, or tag to view the listing.
                    </div>
                  )
                ) : (
                  <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h2>
                        {activeDetail
                          ? activeDetail.searchMode
                            ? 'Search results map'
                            : activeDetail.tagKey
                            ? `${activeDetail.tagKey}${selectedTagValue ? ` = ${selectedTagValue}` : ''} map`
                          : `${activeDetail.featureClass} map`
                          : 'Map'}
                      </h2>
                      <span className={styles.sectionMeta}>
                        {activeDetail
                          ? activeDetail.searchMode
                            ? `Plotting ${formatNumber(detailFeatures.length)} results${activeDetail.searchValue ? ` for "${activeDetail.searchValue}"` : ''}`
                            : activeDetail.tagKey
                            ? `Plotting ${formatNumber(detailFeatures.length)} features${selectedTagValue ? ` where ${activeDetail.tagKey} = "${selectedTagValue}"` : ` with ${activeDetail.tagKey} tag`}`
                            : `Plotting ${formatNumber(detailFeatures.length)} of ${formatNumber(activeDetail.featureCount)} results`
                          : 'Select a feature type, class, or tag to view the map.'}
                      </span>
                      {activeDetail?.provider === 'overpass' && (
                        <span className={styles.sectionMetaHint}>
                          Live OpenStreetMap (Overpass)
                          {detailMeta?.endpoint
                            ? ` • ${detailMeta.endpoint.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`
                            : ''}
                        </span>
                      )}
                      {activeDetail && (
                        <div className={styles.sectionActions}>
                          <button type="button" className={styles.clearDetailButton} onClick={clearDetail}>
                            Clear selection
                          </button>
                        </div>
                      )}
                    </div>

                    {!activeDetail ? (
                      <div className={styles.resultsMapEmpty}>
                        Select a feature type, class, or tag to view the map.
                      </div>
                    ) : mapUpdating ? (
                      <div className={styles.resultsMapEmpty}>Updating map…</div>
                    ) : !hasMapFeatures ? (
                      <div className={styles.resultsMapEmpty}>
                        Map updates when results include coordinates.
                      </div>
                    ) : (
                      <div className={styles.mapWrapper}>
                        <PlanetFeaturesMap
                          center={mapCenter}
                          features={mapFeaturesToRender}
                          onlyPoints
                          detailMode={Boolean(activeDetail)}
                        />
                      </div>
                    )}
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

