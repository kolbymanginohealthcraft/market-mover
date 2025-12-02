import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import GeographyMap from './GeographyMap';
import DemographicLegend from '../../../components/UI/DemographicLegend';
import { DEMOGRAPHIC_METRICS, getMetricsByCategory, formatMetricValue } from '../../../utils/demographicColors';
import Dropdown from '../../../components/Buttons/Dropdown';
import { ChevronDown } from 'lucide-react';
import PageLayout from '../../../components/Layouts/PageLayout';
import styles from './GeographyAnalysis.module.css';
import DetailedLoadingSpinner from '../../../components/Buttons/DetailedLoadingSpinner';
import { apiUrl } from '../../../utils/api';

const STATE_FIPS_TO_NAME = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
  '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
  '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
  '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
  '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
  '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
  '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
  '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
  '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
  '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
  '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
};

export default function GeographyAnalysis() {
  const { marketId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [error, setError] = useState(null);
  
  // Get boundary type and demographics from URL query params
  const boundaryType = searchParams.get('view') || 'zips';
  const useDemographics = searchParams.get('demographics') === 'true';
  const selectedMetric = searchParams.get('metric') || 'median_income';
  const showColors = searchParams.get('colors') !== 'false';
  
  const [boundaryTypeDropdownOpen, setBoundaryTypeDropdownOpen] = useState(false);
  
  const [boundaryElements, setBoundaryElements] = useState([]);
  const [loadingBoundaries, setLoadingBoundaries] = useState(false);
  const [demographicStats, setDemographicStats] = useState(null);
  const [hoveredBoundaryId, setHoveredBoundaryId] = useState(null);
  const mapComponentRef = useRef(null);

  // Fetch market by ID from route parameter
  const fetchMarket = useCallback(async () => {
    if (!marketId) {
      setLoadingMarket(false);
      setError('No market ID provided');
      return;
    }

    try {
      setLoadingMarket(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: market, error: marketError } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .eq('user_id', user.id)
        .single();

      if (marketError) {
        throw new Error('Market not found');
      }

      setSelectedMarket(market);
    } catch (error) {
      console.error('Error fetching market:', error);
      setError(error.message);
      setSelectedMarket(null);
    } finally {
      setLoadingMarket(false);
    }
  }, [marketId]);

  // Fetch market when route parameter changes
  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

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

      const response = await fetch(apiUrl(`/api/market-geography/boundaries?${params}`));

      if (!response.ok) {
        throw new Error('Failed to fetch boundary elements');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch boundary elements');
      }

      setBoundaryElements(result.data?.features || []);
    } catch (error) {
      console.error('Error fetching boundary elements:', error);
      setBoundaryElements([]);
    } finally {
      setLoadingBoundaries(false);
    }
  }, [selectedMarket, boundaryType]);

  // Fetch boundary elements when boundary type, demographics, or market changes
  useEffect(() => {
    if (selectedMarket) {
      // Reset boundary elements when view type changes
      setBoundaryElements([]);
      setDemographicStats(null);
      fetchBoundaryElements();
    }
  }, [selectedMarket, boundaryType, useDemographics, fetchBoundaryElements]);

  // Memoize the center object to prevent unnecessary re-renders
  const mapCenter = useMemo(() => {
    if (!selectedMarket) return null;
    return { lat: selectedMarket.latitude, lng: selectedMarket.longitude };
  }, [selectedMarket]);

  // Loading state
  if (loadingMarket) {
    return (
      <DetailedLoadingSpinner 
        message="Loading market geography..." 
        showProgress={false}
      />
    );
  }

  // Error state
  if (error || !selectedMarket) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3>Market Not Found</h3>
          <p>{error || 'The requested market could not be found.'}</p>
          <button 
            className="sectionHeaderButton"
            onClick={() => navigate('/app/markets/list')}
          >
            Back to Markets
          </button>
        </div>
      </div>
    );
  }

  const handleBoundaryTypeChange = (newType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', newType);
    newParams.delete('demographics');
    newParams.delete('metric');
    setSearchParams(newParams);
    setBoundaryTypeDropdownOpen(false);
  };

  const getBoundaryTypeLabel = () => {
    const labels = {
      'tracts': 'Census Tracts',
      'zips': 'ZIP Codes',
      'counties': 'Counties'
    };
    return labels[boundaryType] || 'ZIP Codes';
  };

  return (
    <PageLayout>
      <div className={styles.container}>
        {selectedMarket && (
          <>
            <div className={styles.content}>
          <div className={styles.mapAndListContainer}>
            <div className={styles.elementsList}>
              <div className={styles.controlsGroup}>
                <span className={styles.viewAsLabel}>View as</span>
                <Dropdown
                  trigger={
                    <button type="button" className="sectionHeaderButton">
                      {getBoundaryTypeLabel()}
                      {loadingBoundaries && ' (Loading...)'}
                      {!loadingBoundaries && boundaryElements.length > 0 && ` (${boundaryElements.length})`}
                      <ChevronDown size={14} />
                    </button>
                  }
                  isOpen={boundaryTypeDropdownOpen}
                  onToggle={setBoundaryTypeDropdownOpen}
                  className={styles.dropdownMenu}
                >
                  <button
                    className={styles.dropdownItem}
                    onClick={() => handleBoundaryTypeChange('tracts')}
                    style={{
                      fontWeight: boundaryType === 'tracts' ? '600' : '500',
                      background: boundaryType === 'tracts' ? 'rgba(0, 192, 139, 0.1)' : 'none',
                    }}
                  >
                    Census Tracts
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => handleBoundaryTypeChange('zips')}
                    style={{
                      fontWeight: boundaryType === 'zips' ? '600' : '500',
                      background: boundaryType === 'zips' ? 'rgba(0, 192, 139, 0.1)' : 'none',
                    }}
                  >
                    ZIP Codes
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => handleBoundaryTypeChange('counties')}
                    style={{
                      fontWeight: boundaryType === 'counties' ? '600' : '500',
                      background: boundaryType === 'counties' ? 'rgba(0, 192, 139, 0.1)' : 'none',
                    }}
                  >
                    Counties
                  </button>
                </Dropdown>
              </div>
              
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
                  .map((element, index) => {
                    const zipCityLine = [
                      element?.properties?.city || element?.properties?.area_name,
                      element?.properties?.state_code
                    ].filter(Boolean).join(', ');

                    // Get unique identifier based on boundary type
                    const getBoundaryId = () => {
                      if (boundaryType === 'zips') {
                        return element.properties.zip_code;
                      } else if (boundaryType === 'tracts') {
                        return element.properties.geo_id;
                      } else if (boundaryType === 'counties') {
                        // Use county_fips_code for uniqueness (handles independent cities like Fairfax City vs Fairfax County)
                        return `${element.properties.state_fips_code || ''}_${element.properties.county_fips_code || ''}`;
                      }
                      return null;
                    };

                    const boundaryId = getBoundaryId();

                    return (
                      <div 
                        key={index} 
                        className={styles.elementItem}
                        onMouseEnter={() => {
                          if (boundaryId) {
                            setHoveredBoundaryId(boundaryId);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredBoundaryId(null);
                        }}
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
                              </div>
                            )}
                            {boundaryType === 'zips' && (
                              <div className={styles.zipInfo}>
                                <div className={styles.zipCode}>
                                  {element.properties.zip_code}
                                  {zipCityLine && (
                                    <span className={styles.zipCity}>, {zipCityLine}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            {boundaryType === 'counties' && (
                              <div className={styles.countyInfo}>
                                <div className={styles.countyName}>
                                  {element.properties.lsad_name || element.properties.county_name}
                                  {element.properties.state_fips_code && (
                                    <span className={styles.countyState}>
                                      , {STATE_FIPS_TO_NAME[element.properties.state_fips_code] || element.properties.state_fips_code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No {useDemographics ? 'data' : boundaryType} found within this market radius.</p>
                </div>
              )}
            </div>

            <GeographyMap
              key={`${selectedMarket.id}-${boundaryType}-${useDemographics ? selectedMetric : 'boundary'}`}
              center={mapCenter}
              radius={selectedMarket.radius_miles}
              boundaryType={boundaryType}
              demographicMetric={selectedMetric}
              useDemographics={useDemographics}
              showColors={showColors}
              hoveredBoundaryId={hoveredBoundaryId}
              onDemographicStatsUpdate={handleDemographicStatsUpdate}
              onDemographicFeaturesUpdate={handleDemographicFeaturesUpdate}
            />
          </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
