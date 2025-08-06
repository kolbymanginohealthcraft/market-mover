import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import styles from './MarketsList.module.css';
import Banner from '../../../components/Buttons/Banner';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';

export default function MarketsList() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMarket, setDeletingMarket] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [map, setMap] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && markets.length > 0) {
      initializeMap();
    } else if (viewMode === 'list' && map) {
      // Clean up map when switching to list view
      cleanupMap();
    }
  }, [viewMode, markets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

  const cleanupMap = () => {
    if (map && typeof map.remove === 'function') {
      try {
        map.remove();
      } catch (error) {
        console.warn('Error cleaning up map:', error);
      }
    }
    setMap(null);
    setMapReady(false);
  };

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marketsError) {
        throw new Error(marketsError.message);
      }

      setMarkets(marketsData || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      const maplibregl = await import('maplibre-gl');
      
      if (!mapContainerRef.current) return;

      // Calculate bounds that include all markets and their radius circles
      const bounds = calculateMapBounds(markets);

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
        center: bounds.center,
        zoom: bounds.zoom
      });

      setMap(newMap);

      newMap.on('load', () => {
        setMapReady(true);
        
        // Add markets as circles
        markets.forEach((market) => {
          const circle = createCircleGeoJSON(
            market.latitude, 
            market.longitude, 
            market.radius_miles
          );

          newMap.addSource(`market-${market.id}`, {
            type: 'geojson',
            data: circle
          });

          newMap.addLayer({
            id: `market-circle-${market.id}`,
            type: 'fill',
            source: `market-${market.id}`,
            paint: {
              'fill-color': '#1DADBE',
              'fill-opacity': 0.3
            }
          });

          newMap.addLayer({
            id: `market-border-${market.id}`,
            type: 'line',
            source: `market-${market.id}`,
            paint: {
              'line-color': '#1DADBE',
              'line-width': 2
            }
          });

          // Add center marker for each market
          newMap.addSource(`market-center-${market.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [market.longitude, market.latitude]
              },
              properties: {}
            }
          });

          newMap.addLayer({
            id: `market-center-marker-${market.id}`,
            type: 'circle',
            source: `market-center-${market.id}`,
            paint: {
              'circle-radius': 3,
              'circle-color': '#1DADBE',
              'circle-stroke-color': 'white',
              'circle-stroke-width': 1
            }
          });

          // Add click handler
          newMap.on('click', `market-circle-${market.id}`, () => {
            navigate(`/app/market/${market.id}/overview`);
          });

          // Change cursor on hover
          newMap.on('mouseenter', `market-circle-${market.id}`, () => {
            newMap.getCanvas().style.cursor = 'pointer';
          });

          newMap.on('mouseleave', `market-circle-${market.id}`, () => {
            newMap.getCanvas().style.cursor = '';
          });
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const calculateMapBounds = (markets) => {
    if (markets.length === 0) {
      return {
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4
      };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    // Calculate bounds including market centers and their radius circles
    markets.forEach((market) => {
      const lat = market.latitude;
      const lng = market.longitude;
      const radiusMiles = market.radius_miles;
      
      // Convert radius from miles to degrees (approximate)
      const latRadius = radiusMiles / 69; // 1 degree latitude ≈ 69 miles
      const lngRadius = radiusMiles / (69 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
      
      // Update bounds to include the entire circle
      minLat = Math.min(minLat, lat - latRadius);
      maxLat = Math.max(maxLat, lat + latRadius);
      minLng = Math.min(minLng, lng - lngRadius);
      maxLng = Math.max(maxLng, lng + lngRadius);
    });

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate zoom level based on the span
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const maxSpan = Math.max(latSpan, lngSpan);

    // Calculate appropriate zoom level
    // This is an approximation - you may need to adjust these values
    let zoom = 20;
    if (maxSpan > 180) zoom = 1;
    else if (maxSpan > 90) zoom = 2;
    else if (maxSpan > 45) zoom = 3;
    else if (maxSpan > 20) zoom = 4;
    else if (maxSpan > 10) zoom = 5;
    else if (maxSpan > 5) zoom = 6;
    else if (maxSpan > 2) zoom = 7;
    else if (maxSpan > 1) zoom = 8;
    else if (maxSpan > 0.5) zoom = 9;
    else if (maxSpan > 0.2) zoom = 10;
    else if (maxSpan > 0.1) zoom = 11;
    else if (maxSpan > 0.05) zoom = 12;
    else if (maxSpan > 0.02) zoom = 13;
    else if (maxSpan > 0.01) zoom = 14;
    else if (maxSpan > 0.005) zoom = 15;
    else if (maxSpan > 0.002) zoom = 16;
    else if (maxSpan > 0.001) zoom = 17;
    else if (maxSpan > 0.0005) zoom = 18;
    else if (maxSpan > 0.0002) zoom = 19;
    else zoom = 20;

    // Add some padding by reducing zoom slightly
    zoom = Math.max(1, zoom - 1);

    return {
      center: [centerLng, centerLat],
      zoom
    };
  };

  const createCircleGeoJSON = (lat, lng, radiusMiles) => {
    const points = 64;
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lat1 = lat + (radiusMiles / 69) * Math.cos(angle);
      const lng1 = lng + (radiusMiles / (69 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
      coordinates.push([lng1, lat1]);
    }
    
    coordinates.push(coordinates[0]); // Close the circle
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      properties: {}
    };
  };

  const handleDeleteMarket = async (marketId) => {
    if (!window.confirm('Are you sure you want to delete this market? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingMarket(marketId);

      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', marketId);

      if (error) {
        throw new Error(error.message);
      }

      // Remove from local state
      setMarkets(markets.filter(market => market.id !== marketId));
    } catch (err) {
      console.error('Error deleting market:', err);
      alert('Failed to delete market: ' + err.message);
    } finally {
      setDeletingMarket(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner message="Loading your markets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Markets</h2>
        <p>{error}</p>
        <Button onClick={fetchMarkets}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Banner
        title="My Markets"
        subtitle="Manage your markets and analyze provider data"
        gradient="blue"
        buttons={[
          {
            text: '📋 List',
            onClick: () => setViewMode('list'),
            variant: viewMode === 'list' ? 'active' : 'default',
            size: 'sm',
            group: 'viewMode'
          },
          {
            text: '🗺️ Map',
            onClick: () => setViewMode('map'),
            variant: viewMode === 'map' ? 'active' : 'default',
            size: 'sm',
            group: 'viewMode'
          },
          {
            text: 'Create New Market',
            onClick: () => navigate('/app/market/create'),
            variant: 'primary',
            size: 'lg'
          }
        ]}
      />

      {markets.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No Markets Yet</h3>
          <p>You haven't created any markets yet. Create your first market to get started.</p>
          <Link to="/app/market/create">
            <Button variant="gold" size="lg">
              Create Your First Market
            </Button>
          </Link>
        </div>
      ) : (
        <div className={styles.content}>
          {viewMode === 'list' ? (
            <div className={styles.listView}>
              <div className={styles.marketsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>Market Name</div>
                  <div className={styles.tableCell}>Location</div>
                  <div className={styles.tableCell}>Radius</div>
                  <div className={styles.tableCell}>Created</div>
                  <div className={styles.tableCell}>Actions</div>
                </div>
                {markets.map((market) => (
                  <div key={market.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>
                      <div className={styles.marketName}>{market.name}</div>
                    </div>
                    <div className={styles.tableCell}>
                      {market.city}, {market.state}
                    </div>
                    <div className={styles.tableCell}>
                      {market.radius_miles} miles
                    </div>
                    <div className={styles.tableCell}>
                      {formatDate(market.created_at)}
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.actions}>
                        <Link to={`/app/market/${market.id}/overview`}>
                          <Button variant="blue" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="red"
                          size="sm"
                          outline
                          onClick={() => handleDeleteMarket(market.id)}
                          disabled={deletingMarket === market.id}
                        >
                          {deletingMarket === market.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.mapView}>
              <div ref={mapContainerRef} className={styles.mapContainer}>
                {!mapReady && (
                  <div className={styles.mapLoading}>
                    Loading map...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}