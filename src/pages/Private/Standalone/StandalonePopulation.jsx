import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapPin, CalendarDays, ChevronDown, BarChart3, TrendingUp, Map } from 'lucide-react';
import { supabase } from '../../../app/supabaseClient';
import { apiUrl } from '../../../utils/api';
import useCensusData, { useAvailableCensusYears } from '../../../hooks/useCensusData';
import useCensusZipTrend from '../../../hooks/useCensusZipTrend';
import Spinner from '../../../components/Buttons/Spinner';
import Dropdown from '../../../components/Buttons/Dropdown';
import CensusDataPanel from '../Results/Population/CensusDataPanel';
import GeographyMap from '../GeographyAnalysis/GeographyMap';
import PageLayout from '../../../components/Layouts/PageLayout';
import styles from './StandalonePopulation.module.css';

export default function StandalonePopulation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [savedMarkets, setSavedMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsError, setMarketsError] = useState(null);

  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedMarketId, setSelectedMarketId] = useState(searchParams.get('marketId') || null);

  const initialRadius = useMemo(() => {
    const param = Number(searchParams.get('radius'));
    return Number.isFinite(param) && param > 0 ? param : 10;
  }, [searchParams]);

  const dhcParam = searchParams.get('dhc');
  const marketIdParam = searchParams.get('marketId');
  const [radiusInMiles, setRadiusInMiles] = useState(initialRadius);

  const [geoLevel, setGeoLevel] = useState('zip');

  const { years: availableYears, loading: yearsLoading, error: yearsError } = useAvailableCensusYears();

  const latestYear = useMemo(() => {
    if (!availableYears || availableYears.length === 0) return '2023';
    const sortedYears = [...availableYears]
      .map((year) => String(year))
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));
    return sortedYears[0] || '2023';
  }, [availableYears]);

  const [selectedYear, setSelectedYear] = useState(() => {
    const urlYear = searchParams.get('year');
    return urlYear || null;
  });

  const effectiveYear = useMemo(() => {
    if (selectedYear && availableYears && availableYears.length > 0 && availableYears.includes(Number(selectedYear))) {
      return selectedYear;
    }
    return latestYear;
  }, [selectedYear, latestYear, availableYears]);

  const updateSearchParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const validTabs = useMemo(() => new Set(['overview', 'trend', 'map']), []);

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/+/g, '/').replace(/\/$/, '');
    if (normalizedPath === '/app/population') {
      navigate('/app/population/overview', { replace: true });
    } else {
      const segments = normalizedPath.split('/');
      const lastSegment = segments[segments.length - 1] || '';
      if (lastSegment && lastSegment !== 'population' && !validTabs.has(lastSegment)) {
        navigate('/app/population/overview', { replace: true });
      }
    }
  }, [location.pathname, navigate, validTabs]);

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (validTabs.has(lastSegment)) {
      return lastSegment;
    }
    return 'overview';
  }, [location.pathname, validTabs]);

  useEffect(() => {
    setMarketsLoading(true);
    setMarketsError(null);

    const loadMarkets = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSavedMarkets([]);
          return;
        }

        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSavedMarkets(data || []);
      } catch (err) {
        console.error('Error fetching markets:', err);
        setMarketsError('Unable to load saved markets right now.');
        setSavedMarkets([]);
      } finally {
        setMarketsLoading(false);
      }
    };

    loadMarkets();
  }, []);

  useEffect(() => {
    if (!dhcParam) {
      return;
    }

    let isMounted = true;

    const fetchProviderByDhc = async () => {
      try {
        const response = await fetch(apiUrl('/api/getProvidersByDhc'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: [String(dhcParam)] }),
        });

        if (!response.ok) {
          throw new Error(`Failed to load provider (${response.status})`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.providers) || result.providers.length === 0) {
          if (isMounted) {
            setSelectedProvider(null);
          }
          return;
        }

        const provider = result.providers[0];
        const normalized = {
          ...provider,
          dhc: provider.dhc ? String(provider.dhc) : String(dhcParam),
          latitude: provider.latitude ? Number(provider.latitude) : null,
          longitude: provider.longitude ? Number(provider.longitude) : null,
        };

        const displayName =
          provider.name ||
          provider.facility_name ||
          (provider.city && provider.state ? `${provider.city}, ${provider.state}` : 'Selected provider');

        normalized.name = displayName;
        normalized.facility_name = provider.facility_name || displayName;

        if (isMounted) {
          setSelectedProvider(normalized);
          setSelectedMarketId(null);
        }
      } catch (err) {
        console.error('Error loading provider by DHC:', err);
        if (isMounted) {
          setSelectedProvider(null);
        }
      }
    };

    fetchProviderByDhc();

    return () => {
      isMounted = false;
    };
  }, [dhcParam]);

  useEffect(() => {
    if (marketIdParam) {
      setSelectedProvider(null);
      setSelectedMarketId(marketIdParam);
    } else {
      setSelectedMarketId(null);
    }
  }, [marketIdParam]);

  const selectedMarket = useMemo(() => {
    if (!selectedMarketId) return null;
    return savedMarkets.find((market) => String(market.id) === String(selectedMarketId)) || null;
  }, [savedMarkets, selectedMarketId]);

  useEffect(() => {
    if (!selectedProvider) return;
    const paramRadius = Number(searchParams.get('radius'));
    if (Number.isFinite(paramRadius) && paramRadius > 0) {
      setRadiusInMiles(paramRadius);
    } else {
      setRadiusInMiles(10);
    }
  }, [selectedProvider, searchParams]);

  useEffect(() => {
    if (latestYear && !selectedYear) {
      setSelectedYear(latestYear);
    } else if (latestYear && selectedYear && !availableYears?.includes(Number(selectedYear))) {
      setSelectedYear(latestYear);
    }
  }, [latestYear, selectedYear, availableYears]);

  const handleMarketSelect = (market) => {
    if (!market) {
      setSelectedMarketId(null);
      updateSearchParams({ marketId: null });
      return;
    }
    setSelectedMarketId(String(market.id));
    setSelectedProvider(null);
    updateSearchParams({
      marketId: market.id,
      dhc: null,
      radius: null,
    });
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    updateSearchParams({ year });
  };


  const effectiveProvider = useMemo(() => {
    if (selectedProvider) {
      const { latitude, longitude } = selectedProvider;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }
      return selectedProvider;
    }

    if (selectedMarket) {
      const lat = Number(selectedMarket.latitude);
      const lon = Number(selectedMarket.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }
      return {
        name: selectedMarket.name || 'Saved market',
        facility_name: selectedMarket.name || 'Saved market',
        latitude: lat,
        longitude: lon,
        city: selectedMarket.city,
        state: selectedMarket.state,
      };
    }

    return null;
  }, [selectedProvider, selectedMarket]);

  const effectiveRadius = useMemo(() => {
    if (selectedProvider) {
      return radiusInMiles;
    }
    if (selectedMarket) {
      const value = Number(selectedMarket.radius_miles);
      return Number.isFinite(value) ? value : null;
    }
    return null;
  }, [selectedProvider, selectedMarket, radiusInMiles]);

  const mapCenter = useMemo(() => {
    if (!effectiveProvider) return null;
    return {
      lat: effectiveProvider.latitude,
      lng: effectiveProvider.longitude
    };
  }, [effectiveProvider?.latitude, effectiveProvider?.longitude]);

  const { data: censusData, loading: censusLoading, error: censusError } = useCensusData(
    effectiveProvider,
    effectiveRadius,
    effectiveYear,
    geoLevel
  );

  const hasSelection = useMemo(
    () => Boolean(effectiveProvider && effectiveRadius),
    [effectiveProvider, effectiveRadius]
  );

  const zipTrendYears = useMemo(() => {
    if (!availableYears || availableYears.length === 0) {
      return { start: effectiveYear, end: effectiveYear };
    }
    const filtered = availableYears
      .map((year) => Number(year))
      .filter((year) => Number.isFinite(year) && year >= 2020)
      .sort((a, b) => a - b);

    if (filtered.length === 0) {
      const latest = Number(effectiveYear) >= 2020 ? Number(effectiveYear) : 2020;
      return { start: String(latest), end: String(latest) };
    }

    return {
      start: String(filtered[0]),
      end: String(filtered[filtered.length - 1]),
    };
  }, [availableYears, effectiveYear]);

  const {
    data: zipTrendData,
    loading: zipTrendLoading,
    error: zipTrendError,
  } = useCensusZipTrend(
    geoLevel === 'zip' && hasSelection ? effectiveProvider : null,
    geoLevel === 'zip' && hasSelection ? effectiveRadius : null,
    zipTrendYears.start,
    zipTrendYears.end,
    geoLevel === 'zip' && hasSelection
  );

  const marketTotals = censusData?.market_totals || {};
  const geographyLabel = geoLevel === 'zip' ? 'ZIP codes' : 'census tracts';
  const totalUnits = geoLevel === 'zip'
    ? (marketTotals.total_zip_codes ?? marketTotals.total_tracts ?? 0)
    : (marketTotals.total_tracts ?? 0);
  const selectedTrendEntry = useMemo(() => {
    if (geoLevel !== 'zip' || !zipTrendData?.trend) return null;
    const targetYear = String(effectiveYear);
    return zipTrendData.trend.find((entry) => entry.year === targetYear) || null;
  }, [geoLevel, zipTrendData, effectiveYear]);
  const zipTrendRows = useMemo(() => {
    if (geoLevel !== 'zip' || !zipTrendData?.trend) return [];
    return [...zipTrendData.trend].sort((a, b) => Number(b.year) - Number(a.year));
  }, [geoLevel, zipTrendData]);
  const matchedZipCount = geoLevel === 'zip'
    ? (selectedTrendEntry?.matchedZipCount
      ?? marketTotals.matched_zip_codes
      ?? zipTrendData?.matchedZipCodes?.length
      ?? censusData?.metadata?.matched_zips?.length
      ?? 0)
    : null;
  const missingZipList = geoLevel === 'zip'
    ? (selectedTrendEntry?.missingZips ?? [])
    : [];
  const missingZipCount = geoLevel === 'zip' ? missingZipList.length : null;
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatNumber = useCallback(
    (value) => numberFormatter.format(Math.round(value || 0)),
    [numberFormatter]
  );

  return (
    <PageLayout fullWidth>
      <div className={styles.container}>
        <div className={styles.controlsBar}>
        <div className={styles.controlsGroup}>
          {savedMarkets.length > 0 ? (
            <Dropdown
              trigger={
                <button type="button" className="sectionHeaderButton">
                  <MapPin size={14} />
                  {selectedMarket ? selectedMarket.name : 'My Markets'}
                  <ChevronDown size={14} />
                </button>
              }
              isOpen={marketDropdownOpen}
              onToggle={setMarketDropdownOpen}
              className={styles.dropdownMenu}
            >
              {marketsLoading ? (
                <div className={styles.dropdownStatus}>Loading markets…</div>
              ) : marketsError ? (
                <div className={styles.dropdownStatus}>{marketsError}</div>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      handleMarketSelect(null);
                      setMarketDropdownOpen(false);
                    }}
                  >
                    No Market
                  </button>
                    {savedMarkets.map((market) => {
                      const isActive =
                        selectedMarket && String(selectedMarket.id) === String(market.id);
                      return (
                        <button
                          key={market.id}
                          type="button"
                        className={styles.dropdownItem}
                          onClick={() => {
                            handleMarketSelect(market);
                            setMarketDropdownOpen(false);
                          }}
                        style={{
                          fontWeight: isActive ? '600' : '500',
                          background: isActive ? 'rgba(0, 192, 139, 0.1)' : 'none',
                        }}
                        >
                        <div>{market.name || 'Unnamed market'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                            {market.city}, {market.state} • {market.radius_miles} mi
                        </div>
                        </button>
                      );
                    })}
                </>
              )}
            </Dropdown>
          ) : (
            <div className={styles.emptyNotice}>
              {marketsLoading ? 'Loading saved markets…' : 'No saved markets yet'}
            </div>
          )}
        </div>

        <div className={styles.spacer} />

        <div className={styles.metaGroup}>
          {hasSelection && (
            <div className={styles.metaPill}>
              <span>{totalUnits}</span>
              <span className={styles.metaDivider}>•</span>
              <span>{geographyLabel}</span>
            </div>
          )}
          {geoLevel === 'zip' && hasSelection && (
            <div className={`${styles.metaPill} ${missingZipCount ? styles.metaPillWarning : ''}`}>
              <span>{matchedZipCount} ZIPs in ACS</span>
              {missingZipCount ? (
                <>
                  <span className={styles.metaDivider}>•</span>
                  <span>{missingZipCount} missing</span>
                </>
              ) : null}
            </div>
          )}
          {selectedMarket && (
            <div className={styles.metaPill}>
              <span>{selectedMarket.city}, {selectedMarket.state}</span>
              {selectedMarket.radius_miles && (
                <>
                  <span className={styles.metaDivider}>•</span>
                  <span>{selectedMarket.radius_miles} mi radius</span>
                </>
              )}
            </div>
          )}
          {selectedProvider && (
            <div className={styles.metaPill}>
              <span>{selectedProvider.name}</span>
              {radiusInMiles && (
                <>
                  <span className={styles.metaDivider}>•</span>
                  <span>{radiusInMiles} mi radius</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
{hasSelection && (
        <div className={styles.tabNav}>
          <div className={styles.tabNavLeft}>
            <Link
              to={`/app/population/overview${location.search}`}
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            >
              <BarChart3 size={16} />
              Overview
            </Link>
            <Link
              to={`/app/population/trend${location.search}`}
              className={`${styles.tab} ${activeTab === 'trend' ? styles.active : ''}`}
            >
              <TrendingUp size={16} />
              Trend
            </Link>
            <Link
              to={`/app/population/map${location.search}`}
              className={`${styles.tab} ${activeTab === 'map' ? styles.active : ''}`}
            >
              <Map size={16} />
              Map
            </Link>
          </div>
        </div>
      )}

      {geoLevel === 'zip' && hasSelection && selectedTrendEntry && missingZipCount && activeTab !== 'trend' ? (
        <div className={styles.missingNotice}>
          Some ZIP codes in this circle are not available for ACS {effectiveYear}:{" "}
          {missingZipList.slice(0, 6).join(', ')}
          {missingZipCount > 6 ? ` (+${missingZipCount - 6} more)` : ''}
        </div>
      ) : null}

      <div className={styles.content}>
        {!hasSelection ? (
          <div className={styles.emptyState}>
            <h2>Select a saved market</h2>
            <p>Choose a market from the controls above to explore {geographyLabel.toLowerCase()} demographics.</p>
          </div>
        ) : censusLoading ? (
          <div className={styles.loadingState}>
            <Spinner message="Loading population data…" />
          </div>
        ) : censusError ? (
          <div className={styles.errorPanel}>
            <h3>Population data unavailable</h3>
            <p>{censusError}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className={styles.overviewContent}>
                {geoLevel === 'zip' && selectedTrendEntry && missingZipCount ? (
                  <div className={styles.missingNotice}>
                    Some ZIP codes in this circle are not available for ACS {effectiveYear}:{" "}
                    {missingZipList.slice(0, 6).join(', ')}
                    {missingZipCount > 6 ? ` (+${missingZipCount - 6} more)` : ''}
                  </div>
                ) : null}
                <CensusDataPanel
                  provider={effectiveProvider}
                  radiusInMiles={effectiveRadius}
                  censusData={censusData}
                />
              </div>
            )}

            {activeTab === 'trend' && (
              <div className={styles.trendSection}>
                <div className={styles.trendCard}>
                  <div className={styles.trendHeader}>
                    <div>
                      <h3>ZIP population trend</h3>
                      <p>
                        ACS 5-year estimates ({zipTrendYears.start}–{zipTrendYears.end})
                      </p>
                    </div>
                  </div>
                  {zipTrendLoading ? (
                    <div className={styles.trendLoading}>
                      <Spinner message="Loading ZIP trend…" />
                    </div>
                  ) : zipTrendError ? (
                    <div className={styles.trendError}>
                      Unable to load ZIP trend data: {zipTrendError}
                    </div>
                  ) : zipTrendRows?.length ? (
                    <>
                      {missingZipCount ? (
                        <div className={styles.missingNotice}>
                          Some ZIP codes in this circle are not available for ACS {effectiveYear}:{" "}
                          {missingZipList.slice(0, 6).join(', ')}
                          {missingZipCount > 6 ? ` (+${missingZipCount - 6} more)` : ''}
                        </div>
                      ) : null}
                      <table className={styles.trendTable}>
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Total population</th>
                            <th>ZIPs matched</th>
                            <th>Missing ZIPs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zipTrendRows.map((entry) => (
                            <tr
                              key={entry.year}
                              className={entry.year === String(effectiveYear) ? styles.trendRowActive : undefined}
                            >
                              <td>{entry.year}</td>
                              <td>{formatNumber(entry.totalPopulation)}</td>
                              <td>{entry.matchedZipCount}</td>
                              <td className={entry.missingZipCount ? styles.missingCell : undefined}>
                                {entry.missingZipCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div className={styles.trendEmpty}>
                      No ZIP trend data available for this location.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'map' && mapCenter && effectiveRadius && (
              <div className={styles.mapView}>
                <div className={styles.mapContainer}>
                  <GeographyMap
                    center={mapCenter}
                    radius={effectiveRadius}
                    boundaryType={geoLevel === 'zip' ? 'zips' : 'tracts'}
                    useDemographics={false}
                    showColors={false}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </PageLayout>
  );
}


