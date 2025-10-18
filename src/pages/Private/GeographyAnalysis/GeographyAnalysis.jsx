import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../app/supabaseClient';
import GeographyMap from './GeographyMap';
import Dropdown from '../../../components/Buttons/Dropdown';
import { MapPin, ChevronDown } from 'lucide-react';
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
              className={`sectionHeaderButton ${boundaryType === 'tracts' ? 'primary' : ''}`}
              onClick={() => setBoundaryType('tracts')}
            >
              Census Tracts
            </button>
            <button
              className={`sectionHeaderButton ${boundaryType === 'zips' ? 'primary' : ''}`}
              onClick={() => setBoundaryType('zips')}
            >
              ZIP Codes
            </button>
            <button
              className={`sectionHeaderButton ${boundaryType === 'counties' ? 'primary' : ''}`}
              onClick={() => setBoundaryType('counties')}
            >
              Counties
            </button>
          </div>
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
            <div className={styles.mapSection}>
              <h3>Geographic Boundaries</h3>
              <p className={styles.sectionHint}>
                {boundaryType === 'tracts' && 'Census tracts that intersect with your market radius (blue points - click for details)'}
                {boundaryType === 'zips' && 'ZIP codes that intersect with your market radius (green polygons - click for details)'}
                {boundaryType === 'counties' && 'Counties that intersect with your market radius (purple polygons - click for details)'}
                {' • Red dashed circle shows your market radius'}
              </p>
              <GeographyMap
                key={`${selectedMarket.id}-${boundaryType}`}
                center={mapCenter}
                radius={selectedMarket.radius_miles}
                boundaryType={boundaryType}
              />
            </div>

            <div className={styles.elementsList}>
              <h3>
                {boundaryType === 'tracts' && 'Census Tracts'}
                {boundaryType === 'zips' && 'ZIP Codes'}
                {boundaryType === 'counties' && 'Counties'}
                {loadingBoundaries && ' (Loading...)'}
                {!loadingBoundaries && boundaryElements.length > 0 && ` (${boundaryElements.length})`}
              </h3>
              
              {loadingBoundaries ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading {boundaryType}...</p>
                </div>
              ) : boundaryElements.length > 0 ? (
                <div className={styles.elementsContainer}>
                  {boundaryElements.map((element, index) => (
                    <div key={index} className={styles.elementItem}>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No {boundaryType} found within this market radius.</p>
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
