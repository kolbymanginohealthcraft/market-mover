import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../app/supabaseClient';
import GeographyMap from './GeographyMap';
import Dropdown from '../../../components/Buttons/Dropdown';
import DemographicLegend from '../../../components/UI/DemographicLegend';
import { MapPin, ChevronDown, Activity } from 'lucide-react';
import { DEMOGRAPHIC_METRICS, getMetricsByCategory, formatMetricValue } from '../../../utils/demographicColors';
import styles from './GeographyAnalysis.module.css';

export default function GeographyAnalysis() {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [error, setError] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [boundaryType, setBoundaryType] = useState('tracts');
  const [boundaryElements, setBoundaryElements] = useState([]);
  const [loadingBoundaries, setLoadingBoundaries] = useState(false);
  
  // Demographics state
  const [useDemographics, setUseDemographics] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('median_income');
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [demographicStats, setDemographicStats] = useState(null);
  const [showColors, setShowColors] = useState(true);
  const [hoveredTractId, setHoveredTractId] = useState(null);
  const mapComponentRef = useRef(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoadingMarkets(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marketsError) {
        throw marketsError;
      }

      setMarkets(data || []);
    } catch (error) {
      console.error('Error fetching markets:', error);
      setError(error.message);
    } finally {
      setLoadingMarkets(false);
    }
  }, []);

  // Fetch user's saved markets
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const handleMarketSelect = useCallback((market) => {
    setSelectedMarket(market);
    setBoundaryElements([]);
    setDemographicStats(null);
  }, []);

  // Callback to receive demographic statistics from the map component
  const handleDemographicStatsUpdate = useCallback((stats) => {
    setDemographicStats(stats);
  }, []);

  // Callback to receive demographic features data from the map
  const handleDemographicFeaturesUpdate = useCallback((features) => {
    setBoundaryElements(features || []);
  }, []);

  const fetchBoundaryElements = useCallback(async () => {
    if (!selectedMarket) return;

    setLoadingBoundaries(true);
    try {
      const params = new URLSearchParams({
        latitude: selectedMarket.latitude,
        longitude: selectedMarket.longitude,
        radius: selectedMarket.radius_miles,
        type: boundaryType
      });

      const response = await fetch(`/api/market-geography/boundaries?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch boundary elements');
      }

      const data = await response.json();
      setBoundaryElements(data.features || []);
    } catch (error) {
      console.error('Error fetching boundary elements:', error);
      setBoundaryElements([]);
    } finally {
      setLoadingBoundaries(false);
    }
  }, [selectedMarket, boundaryType]);

  // Fetch boundary elements when boundary type changes
  useEffect(() => {
    if (selectedMarket) {
      fetchBoundaryElements();
    }
  }, [fetchBoundaryElements]);

  // Memoize the center object to prevent unnecessary re-renders
  const mapCenter = useMemo(() => {
    if (!selectedMarket) return null;
    return { lat: selectedMarket.latitude, lng: selectedMarket.longitude };
  }, [selectedMarket]);

  return (
    <div className={styles.container}>
      <div className={styles.controlsRow}>
        {/* Market Selector */}
        <Dropdown
          trigger={
            <button className={styles.dropdownTrigger}>
              <MapPin size={14} />
              {selectedMarket ? selectedMarket.name : 'Select Market'}
              <ChevronDown size={14} />
            </button>
          }
          isOpen={marketDropdownOpen}
          onToggle={setMarketDropdownOpen}
          className={styles.dropdownMenu}
        >
          {loadingMarkets ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              Loading markets...
            </div>
          ) : markets.length === 0 ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              No saved markets
            </div>
          ) : (
            markets.map((market) => (
              <button
                key={market.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleMarketSelect(market);
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
            ))
          )}
        </Dropdown>

        {/* Boundary Type Selector - Only show when market is selected */}
        {selectedMarket && (
          <div className={styles.boundaryTypeSelector}>
            <button
              className={`sectionHeaderButton ${boundaryType === 'tracts' && !useDemographics ? 'primary' : ''}`}
              onClick={() => {
                setBoundaryType('tracts');
                setUseDemographics(false);
              }}
            >
              Census Tracts
            </button>
            <button
              className={`sectionHeaderButton ${boundaryType === 'zips' ? 'primary' : ''}`}
              onClick={() => {
                setBoundaryType('zips');
                setUseDemographics(false);
              }}
            >
              ZIP Codes
            </button>
            <button
              className={`sectionHeaderButton ${boundaryType === 'counties' ? 'primary' : ''}`}
              onClick={() => {
                setBoundaryType('counties');
                setUseDemographics(false);
              }}
            >
              Counties
            </button>
            <button
              className={`sectionHeaderButton ${useDemographics ? 'primary' : ''}`}
              onClick={() => {
                console.log('📊 Demographics button clicked');
                setBoundaryType('tracts');
                setUseDemographics(true);
                console.log('📊 Setting useDemographics to true');
              }}
            >
              <Activity size={14} style={{ marginRight: '4px' }} />
              Demographics
            </button>
          </div>
        )}

        {/* Demographic Metric Selector - Only show when demographics mode is active */}
        {selectedMarket && useDemographics && (
          <>
            <Dropdown
              trigger={
                <button className={styles.metricDropdownTrigger}>
                  {DEMOGRAPHIC_METRICS.find(m => m.id === selectedMetric)?.label || 'Select Metric'}
                  <ChevronDown size={14} />
                </button>
              }
              isOpen={metricDropdownOpen}
              onToggle={setMetricDropdownOpen}
              className={styles.dropdownMenu}
            >
              {Object.entries(getMetricsByCategory()).map(([category, metrics]) => (
                <div key={category}>
                  <div className={styles.dropdownCategory}>{category}</div>
                  {metrics.map((metric) => (
                    <button
                      key={metric.id}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setSelectedMetric(metric.id);
                        setMetricDropdownOpen(false);
                      }}
                      style={{
                        fontWeight: selectedMetric === metric.id ? '600' : '500',
                        background: selectedMetric === metric.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                      }}
                    >
                      <div>{metric.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                        {metric.description}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </Dropdown>
            
            <button
              className={`sectionHeaderButton ${showColors ? 'primary' : ''}`}
              onClick={() => setShowColors(!showColors)}
              title={showColors ? 'Hide Colors' : 'Show Colors'}
            >
              {showColors ? '🎨 Colors On' : '⚪ Colors Off'}
            </button>
          </>
        )}

        {/* Market Info - Only show when market is selected */}
        {selectedMarket && (
          <div className={styles.queryTime}>
            {selectedMarket.radius_miles} mi radius
          </div>
        )}
      </div>

      {selectedMarket ? (
        <div className={styles.content}>
          <div className={styles.mapAndListContainer}>
            <GeographyMap
              key={`${selectedMarket.id}-${boundaryType}-${useDemographics ? selectedMetric : 'boundary'}`}
              center={mapCenter}
              radius={selectedMarket.radius_miles}
              boundaryType={boundaryType}
              demographicMetric={selectedMetric}
              useDemographics={useDemographics}
              showColors={showColors}
              hoveredTractId={hoveredTractId}
              onDemographicStatsUpdate={(stats) => {
                console.log('📈 Demographic stats received in parent:', stats);
                handleDemographicStatsUpdate(stats);
              }}
              onDemographicFeaturesUpdate={handleDemographicFeaturesUpdate}
            />

            <div className={styles.elementsList}>
              <h3>
                {useDemographics && DEMOGRAPHIC_METRICS.find(m => m.id === selectedMetric)?.label}
                {!useDemographics && boundaryType === 'tracts' && 'Census Tracts'}
                {!useDemographics && boundaryType === 'zips' && 'ZIP Codes'}
                {!useDemographics && boundaryType === 'counties' && 'Counties'}
                {loadingBoundaries && ' (Loading...)'}
                {!loadingBoundaries && boundaryElements.length > 0 && ` (${boundaryElements.length})`}
              </h3>
              
              {useDemographics && demographicStats && (
                <div className={styles.demographicsSummary}>
                  <div className={styles.summaryStats}>
                    <div className={styles.summaryStatItem}>
                      <span className={styles.summaryStatLabel}>Min:</span>
                      <span className={styles.summaryStatValue}>
                        {formatMetricValue(demographicStats.statistics.min, selectedMetric)}
                      </span>
                    </div>
                    <div className={styles.summaryStatItem}>
                      <span className={styles.summaryStatLabel}>Median:</span>
                      <span className={styles.summaryStatValue}>
                        {formatMetricValue(demographicStats.statistics.median, selectedMetric)}
                      </span>
                    </div>
                    <div className={styles.summaryStatItem}>
                      <span className={styles.summaryStatLabel}>Max:</span>
                      <span className={styles.summaryStatValue}>
                        {formatMetricValue(demographicStats.statistics.max, selectedMetric)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {loadingBoundaries ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading {useDemographics ? 'demographic data' : boundaryType}...</p>
                </div>
              ) : boundaryElements.length > 0 ? (
                <div className={styles.elementsContainer}>
                  {boundaryElements
                    .sort((a, b) => {
                      // Sort by metric value in demographics mode, descending
                      if (useDemographics && a.properties.metric_value && b.properties.metric_value) {
                        return b.properties.metric_value - a.properties.metric_value;
                      }
                      return 0;
                    })
                    .map((element, index) => (
                    <div 
                      key={index} 
                      className={styles.elementItem}
                      onMouseEnter={() => useDemographics ? setHoveredTractId(element.properties.geo_id) : null}
                      onMouseLeave={() => useDemographics ? setHoveredTractId(null) : null}
                    >
                      {useDemographics ? (
                        <div className={styles.tractInfo}>
                          <div className={styles.tractId}>
                            {element.properties.geo_id || 'Tract ID N/A'}
                          </div>
                          <div className={styles.tractDetails}>
                            <div className={styles.metricValue}>
                              {element.properties.has_data 
                                ? formatMetricValue(element.properties.metric_value, selectedMetric)
                                : 'No data'}
                            </div>
                            {element.properties.total_population && (
                              <div className={styles.tractLocation}>
                                Pop: {element.properties.total_population.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {boundaryType === 'tracts' && (
                            <div className={styles.tractInfo}>
                              <div className={styles.tractId}>{element.properties.geo_id}</div>
                              <div className={styles.tractDetails}>
                                {element.properties.state_fips_code && element.properties.county_fips_code && (
                                  <span className={styles.tractLocation}>
                                    State: {element.properties.state_fips_code}, County: {element.properties.county_fips_code}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {boundaryType === 'zips' && (
                            <div className={styles.zipInfo}>
                              <div className={styles.zipCode}>{element.properties.zip_code}</div>
                            </div>
                          )}
                          {boundaryType === 'counties' && (
                            <div className={styles.countyInfo}>
                              <div className={styles.countyName}>{element.properties.county_name}</div>
                              <div className={styles.countyDetails}>
                                {element.properties.state_fips_code && (
                                  <span className={styles.countyLocation}>
                                    State: {element.properties.state_fips_code}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No {useDemographics ? 'data' : boundaryType} found within this market radius.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>Select a Market to Begin</h3>
          <p>Choose a market from the dropdown above to explore its geographic boundaries.</p>
        </div>
      )}
    </div>
  );
}
