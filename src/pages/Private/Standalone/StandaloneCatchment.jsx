import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Target, MapPin, Users, TrendingUp, Calendar, Building2, Navigation, ChevronDown } from 'lucide-react';
import { supabase } from '../../../app/supabaseClient';
import { apiUrl } from '../../../utils/api';
import Spinner from '../../../components/Buttons/Spinner';
import Dropdown from '../../../components/Buttons/Dropdown';
import PageLayout from '../../../components/Layouts/PageLayout';
import styles from './StandaloneCatchment.module.css';

export default function StandaloneCatchment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [savedMarkets, setSavedMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsError, setMarketsError] = useState(null);

  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedMarketId, setSelectedMarketId] = useState(searchParams.get('marketId') || null);

  const initialRadius = useMemo(() => {
    const param = Number(searchParams.get('radius'));
    return Number.isFinite(param) && param > 0 ? param : 10;
  }, [searchParams]);

  const dhcParam = searchParams.get('dhc');
  const marketIdParam = searchParams.get('marketId');
  const [radiusInMiles, setRadiusInMiles] = useState(initialRadius);

  const [analysisType, setAnalysisType] = useState('zip_to_hospitals');
  const [catchmentData, setCatchmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facilityNames, setFacilityNames] = useState(new Map());
  const [loadingFacilityNames, setLoadingFacilityNames] = useState(false);

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

  const hasSelection = useMemo(
    () => Boolean(effectiveProvider && effectiveRadius),
    [effectiveProvider, effectiveRadius]
  );

  useEffect(() => {
    if (!hasSelection || !effectiveProvider) {
      setCatchmentData(null);
      setError(null);
      return;
    }

    async function fetchCatchmentData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl('/api/catchment-zip-analysis'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            centerLat: effectiveProvider.latitude,
            centerLon: effectiveProvider.longitude,
            radiusInMiles: effectiveRadius,
            analysisType: analysisType,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setCatchmentData(result.data);
        } else {
          setError(result.message || 'Failed to fetch catchment data');
        }
      } catch (err) {
        console.error('Error fetching catchment data:', err);
        setError('Failed to fetch catchment data');
      } finally {
        setLoading(false);
      }
    }

    fetchCatchmentData();
  }, [effectiveProvider, effectiveRadius, analysisType, hasSelection]);

  // Helper function to get specialty label from CCN letter
  const getSpecialtyLabel = (letter) => {
    const labels = {
      'M': ' - Psychiatric Unit in Critical Access Hospital',
      'R': ' - Rehabilitation Unit in Critical Access Hospital',
      'S': ' - Psychiatric Unit',
      'T': ' - Rehabilitation Unit',
      'U': ' - Swing-Bed Hospital Designation for Short-Term Hospitals',
      'W': ' - Swing-Bed Hospital Designation for Long Term Care Hospitals',
      'Y': ' - Swing-Bed Hospital Designation for Rehabilitation Hospitals'
    };
    return labels[letter] || '';
  };

  // Helper function to find main CCN pattern from specialty CCN
  // For specialty CCNs like 14S054, we want to find the main CCN that matches
  // the pattern: first 2 digits + any digit + last 3 digits (e.g., 140054)
  // This function returns a pattern we can use to search for the main CCN
  const getMainCcnPattern = (ccn) => {
    if (!ccn || ccn.length < 6) return null;
    const thirdChar = ccn[2];
    // Check if 3rd character is a letter (specialty unit indicator)
    if (/[A-Z]/.test(thirdChar)) {
      // Return pattern: first 2 digits + last 3 digits
      // We'll search for CCNs matching this pattern (e.g., 14X054 where X is 0-9)
      return {
        prefix: ccn.substring(0, 2), // "14"
        suffix: ccn.substring(3),    // "054"
        fullPattern: ccn.substring(0, 2) + '\\d' + ccn.substring(3) // "14\\d054" for regex
      };
    }
    return null;
  };

  useEffect(() => {
    if (!catchmentData?.hospitalData || catchmentData.hospitalData.length === 0) {
      setFacilityNames(new Map());
      return;
    }

    async function fetchFacilityNames() {
      const uniqueCcns = Array.from(
        new Set(
          catchmentData.hospitalData
            .map(row => row.MEDICARE_PROV_NUM)
            .filter(ccn => ccn && ccn !== '*')
        )
      );

      if (uniqueCcns.length === 0) {
        setFacilityNames(new Map());
        return;
      }

      setLoadingFacilityNames(true);
      const nameMap = new Map();

      try {
        // Step 1: Try provider-of-services first
        const posResponse = await fetch(apiUrl('/api/provider-of-services'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: { PRVDR_NUM: uniqueCcns },
            limit: uniqueCcns.length,
          }),
        });

        if (posResponse.ok) {
          const posResult = await posResponse.json();
          if (posResult.success && Array.isArray(posResult.data)) {
            posResult.data.forEach((record) => {
              const ccn = record?.PRVDR_NUM;
              const facName = record?.FAC_NAME;
              if (ccn && facName) {
                nameMap.set(String(ccn), String(facName));
              }
            });
            console.log(`✅ Provider-of-Services: Found ${nameMap.size} names from ${posResult.data.length} records`);
          }
        }

        // Step 2: For remaining missing CCNs, try specialty unit fallback
        const missingCcns = uniqueCcns.filter(ccn => !nameMap.has(String(ccn)));
        if (missingCcns.length > 0) {
          console.log(`🔍 ${missingCcns.length} CCNs missing names, trying specialty unit fallback...`);
          
          // Find specialty CCNs (those with letters in 3rd position)
          const specialtyCcns = missingCcns.filter(ccn => {
            return ccn && ccn.length >= 6 && /[A-Z]/.test(ccn[2]);
          });

          if (specialtyCcns.length > 0) {
            // Get patterns for main CCNs (first 2 + last 3 digits)
            const specialtyPatterns = specialtyCcns
              .map(ccn => getMainCcnPattern(ccn))
              .filter(pattern => pattern !== null);

            if (specialtyPatterns.length > 0) {
              // Generate all possible main CCNs (try digits 0-9 in the 3rd position)
              const possibleMainCcns = new Set();
              specialtyPatterns.forEach(pattern => {
                for (let digit = 0; digit <= 9; digit++) {
                  const possibleCcn = pattern.prefix + digit + pattern.suffix;
                  possibleMainCcns.add(possibleCcn);
                }
              });

              const mainCcnsToLookup = Array.from(possibleMainCcns);

              if (mainCcnsToLookup.length > 0) {
                // Try to get names for possible main CCNs from provider-of-services
                const mainPosResponse = await fetch(apiUrl('/api/provider-of-services'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filters: { PRVDR_NUM: mainCcnsToLookup },
                    limit: mainCcnsToLookup.length,
                  }),
                });

                if (mainPosResponse.ok) {
                  const mainPosResult = await mainPosResponse.json();
                  if (mainPosResult.success && Array.isArray(mainPosResult.data)) {
                    const mainNameMap = new Map();
                    mainPosResult.data.forEach((record) => {
                      const ccn = record?.PRVDR_NUM;
                      const facName = record?.FAC_NAME;
                      if (ccn && facName) {
                        mainNameMap.set(String(ccn), String(facName));
                      }
                    });

                    // Now create names for specialty units by matching patterns
                    let specialtyCount = 0;
                    specialtyCcns.forEach(specialtyCcn => {
                      const pattern = getMainCcnPattern(specialtyCcn);
                      if (pattern) {
                        // Find matching main CCN (try digits 0-9)
                        let foundMainCcn = null;
                        let foundMainName = null;
                        for (let digit = 0; digit <= 9; digit++) {
                          const testCcn = pattern.prefix + digit + pattern.suffix;
                          if (mainNameMap.has(testCcn)) {
                            foundMainCcn = testCcn;
                            foundMainName = mainNameMap.get(testCcn);
                            break;
                          }
                        }

                        if (foundMainName) {
                          const specialtyLetter = specialtyCcn[2];
                          const specialtyLabel = getSpecialtyLabel(specialtyLetter);
                          const fullName = foundMainName + specialtyLabel;
                          nameMap.set(String(specialtyCcn), fullName);
                          specialtyCount++;
                        }
                      }
                    });
                    console.log(`✅ Specialty Unit Fallback: Added ${specialtyCount} names from main hospital CCNs`);
                  }
                }
              }
            }
          }
        }

        console.log(`✅ Total facility names mapped: ${nameMap.size} out of ${uniqueCcns.length} CCNs`);
        setFacilityNames(nameMap);
      } catch (err) {
        console.error('Error fetching facility names:', err);
      } finally {
        setLoadingFacilityNames(false);
      }
    }

    fetchFacilityNames();
  }, [catchmentData]);

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
          <div className={styles.analysisToggle}>
            <div className={styles.toggleContainer}>
              <button
                className={`${styles.toggleButton} ${analysisType === 'zip_to_hospitals' ? styles.active : ''}`}
                onClick={() => setAnalysisType('zip_to_hospitals')}
              >
                <Navigation size={16} />
                ZIP Codes → Hospitals
              </button>
              <button
                className={`${styles.toggleButton} ${analysisType === 'zip_codes_grouped' ? styles.active : ''}`}
                onClick={() => setAnalysisType('zip_codes_grouped')}
              >
                <MapPin size={16} />
                ZIP Codes Grouped
              </button>
              <button
                className={`${styles.toggleButton} ${analysisType === 'hospitals_grouped' ? styles.active : ''}`}
                onClick={() => setAnalysisType('hospitals_grouped')}
              >
                <Users size={16} />
                Hospitals Grouped
              </button>
            </div>
            <p className={styles.toggleDescription}>
              {analysisType === 'zip_to_hospitals'
                ? 'Analyze which hospitals patients visit from ZIP codes in your geographic area'
                : analysisType === 'zip_codes_grouped'
                ? 'Group ZIP codes and aggregate their total patient volume and charges'
                : 'Group hospitals and aggregate their total patient volume and charges'}
            </p>
          </div>
        )}

        <div className={styles.content}>
          {!hasSelection ? (
            <div className={styles.emptyState}>
              <h2>Select a saved market</h2>
              <p>Choose a market from the controls above to explore hospital service area data.</p>
            </div>
          ) : loading ? (
            <div className={styles.loadingContainer}>
              <Spinner />
              <p>Loading catchment data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          ) : catchmentData ? (
            <>
              <div className={styles.summary}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>ZIP Codes</h3>
                    <p>{catchmentData.summary?.totalZipCodes || 0} in area</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <Building2 size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Hospitals</h3>
                    <p>{catchmentData.summary?.totalUniqueHospitals || 0}</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <Users size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Cases</h3>
                    <p>{catchmentData.summary?.totalCases?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}>
                    <TrendingUp size={20} />
                  </div>
                  <div className={styles.summaryContent}>
                    <h3>Total Charges</h3>
                    <p>${catchmentData.summary?.totalCharges?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>

              <div className={styles.tableContainer}>
                {analysisType === 'zip_to_hospitals' ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Resident ZIP Code</th>
                        <th>Hospital</th>
                        <th>CCN</th>
                        <th>Total Cases</th>
                        <th>Total Charges</th>
                        <th>Avg Days</th>
                        <th>Avg Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catchmentData.hospitalData
                        ?.sort((a, b) => {
                          const casesA = parseInt(a.TOTAL_CASES) || 0;
                          const casesB = parseInt(b.TOTAL_CASES) || 0;
                          return casesB - casesA;
                        })
                        ?.map((row, index) => {
                          const cases = parseInt(row.TOTAL_CASES) || 0;
                          const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                          const charges = parseInt(row.TOTAL_CHARGES) || 0;
                          const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                          const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';
                          const facilityName = facilityNames.get(row.MEDICARE_PROV_NUM);

                          return (
                            <tr key={index}>
                              <td>{row.ZIP_CD_OF_RESIDENCE}</td>
                              <td>{facilityName || '—'}</td>
                              <td className={styles.ccnCell}>{row.MEDICARE_PROV_NUM}</td>
                              <td>{cases.toLocaleString()}</td>
                              <td>${charges.toLocaleString()}</td>
                              <td>{avgDays}</td>
                              <td>${parseInt(avgCharges).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                ) : analysisType === 'zip_codes_grouped' ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Resident ZIP Code</th>
                        <th>Total Cases</th>
                        <th>Total Charges</th>
                        <th>Avg Days</th>
                        <th>Avg Charge</th>
                        <th>Hospitals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groupedData = {};
                        catchmentData.hospitalData?.forEach((row) => {
                          const zipCode = row.ZIP_CD_OF_RESIDENCE;
                          if (!groupedData[zipCode]) {
                            groupedData[zipCode] = {
                              ZIP_CD_OF_RESIDENCE: zipCode,
                              TOTAL_CASES: 0,
                              TOTAL_DAYS_OF_CARE: 0,
                              TOTAL_CHARGES: 0,
                              HOSPITAL_COUNT: new Set(),
                            };
                          }
                          groupedData[zipCode].TOTAL_CASES += parseInt(row.TOTAL_CASES) || 0;
                          groupedData[zipCode].TOTAL_DAYS_OF_CARE += parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                          groupedData[zipCode].TOTAL_CHARGES += parseInt(row.TOTAL_CHARGES) || 0;
                          if (row.MEDICARE_PROV_NUM && row.MEDICARE_PROV_NUM !== '*') {
                            groupedData[zipCode].HOSPITAL_COUNT.add(row.MEDICARE_PROV_NUM);
                          }
                        });

                        return Object.values(groupedData)
                          .map(row => ({
                            ...row,
                            HOSPITAL_COUNT: row.HOSPITAL_COUNT.size
                          }))
                          .sort((a, b) => {
                            const casesA = parseInt(a.TOTAL_CASES) || 0;
                            const casesB = parseInt(b.TOTAL_CASES) || 0;
                            return casesB - casesA;
                          })
                          .map((row, index) => {
                            const cases = parseInt(row.TOTAL_CASES) || 0;
                            const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                            const charges = parseInt(row.TOTAL_CHARGES) || 0;
                            const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                            const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';

                            return (
                              <tr key={index}>
                                <td>{row.ZIP_CD_OF_RESIDENCE}</td>
                                <td>{cases.toLocaleString()}</td>
                                <td>${charges.toLocaleString()}</td>
                                <td>{avgDays}</td>
                                <td>${parseInt(avgCharges).toLocaleString()}</td>
                                <td>{row.HOSPITAL_COUNT}</td>
                              </tr>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Hospital</th>
                        <th>CCN</th>
                        <th>Total Cases</th>
                        <th>Total Charges</th>
                        <th>Avg Days</th>
                        <th>Avg Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groupedData = {};
                        catchmentData.hospitalData?.forEach((row) => {
                          const ccn = row.MEDICARE_PROV_NUM;
                          if (!groupedData[ccn]) {
                            groupedData[ccn] = {
                              MEDICARE_PROV_NUM: ccn,
                              TOTAL_CASES: 0,
                              TOTAL_DAYS_OF_CARE: 0,
                              TOTAL_CHARGES: 0,
                            };
                          }
                          groupedData[ccn].TOTAL_CASES += parseInt(row.TOTAL_CASES) || 0;
                          groupedData[ccn].TOTAL_DAYS_OF_CARE += parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                          groupedData[ccn].TOTAL_CHARGES += parseInt(row.TOTAL_CHARGES) || 0;
                        });

                        return Object.values(groupedData)
                          .sort((a, b) => {
                            const casesA = parseInt(a.TOTAL_CASES) || 0;
                            const casesB = parseInt(b.TOTAL_CASES) || 0;
                            return casesB - casesA;
                          })
                          .map((row, index) => {
                            const cases = parseInt(row.TOTAL_CASES) || 0;
                            const days = parseInt(row.TOTAL_DAYS_OF_CARE) || 0;
                            const charges = parseInt(row.TOTAL_CHARGES) || 0;
                            const avgDays = cases > 0 ? (days / cases).toFixed(1) : '0';
                            const avgCharges = cases > 0 ? (charges / cases).toFixed(0) : '0';

                            const facilityName = facilityNames.get(row.MEDICARE_PROV_NUM);
                            return (
                              <tr key={index}>
                                <td>{facilityName || '—'}</td>
                                <td className={styles.ccnCell}>{row.MEDICARE_PROV_NUM}</td>
                                <td>{cases.toLocaleString()}</td>
                                <td>${charges.toLocaleString()}</td>
                                <td>{avgDays}</td>
                                <td>${parseInt(avgCharges).toLocaleString()}</td>
                              </tr>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}

