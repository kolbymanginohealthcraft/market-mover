import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import styles from './MarketsList.module.css';

import Spinner from '../../../components/Buttons/Spinner';
import InteractiveMarketCreation from './InteractiveMarketCreation';
import MarketMap from './components/MarketMap';
import { useDropdownClose } from '../../../hooks/useDropdownClose';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { Lock, ExternalLink, Trash2 } from 'lucide-react';

export default function MarketsList() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMarket, setDeletingMarket] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasTeam, loading: teamLoading } = useUserTeam();

  useEffect(() => {
    fetchMarkets();
  }, []);

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

  // Markets List View Component
  const MarketsListView = () => (
    <div className={styles.content}>
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
                    <button className="sectionHeaderButton">
                      <ExternalLink size={14} />
                      <span>View</span>
                    </button>
                  </Link>
                  <button
                    className="sectionHeaderButton"
                    onClick={() => handleDeleteMarket(market.id)}
                    disabled={deletingMarket === market.id}
                  >
                    <Trash2 size={14} />
                    <span>{deletingMarket === market.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Markets Map View Component
  const MarketsMapView = () => {
    const mapContainerRef = useRef(null);
    const [map, setMap] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [tooltip, setTooltip] = useState(null); // { market, x, y }
    
    // Use global dropdown close hook for tooltip
    useDropdownClose({
      dropdownSelector: '.market-tooltip',
      closeCallback: () => setTooltip(null),
      isOpen: tooltip !== null
    });
    
    // Calculate bounds and initial zoom from all markets
    const calculateMapBounds = () => {
      if (markets.length === 0) {
        return {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          zoom: 4
        };
      }
      
      // Calculate bounds including market radius
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      markets.forEach(market => {
        const lat = market.latitude;
        const lng = market.longitude;
        const radiusDegrees = market.radius_miles / 69; // Approximate degrees per mile
        
        minLat = Math.min(minLat, lat - radiusDegrees);
        maxLat = Math.max(maxLat, lat + radiusDegrees);
        minLng = Math.min(minLng, lng - radiusDegrees);
        maxLng = Math.max(maxLng, lng + radiusDegrees);
      });
      
      // Calculate center
      const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      };
      
      // Calculate the exact zoom level needed to fit all markets
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Calculate zoom using the formula: zoom = log2(360 / maxDiff) - 1
      const zoom = Math.log2(360 / maxDiff) - 1;
      
      // Clamp zoom to reasonable bounds
      const clampedZoom = Math.max(3, Math.min(15, zoom));
      
      // Create bounds array for fitBounds
      const bounds = [
        [minLng, minLat], // Southwest corner
        [maxLng, maxLat]  // Northeast corner
      ];
      
      return { center, bounds, zoom: clampedZoom };
    };

    // Initialize map for displaying all markets
    useEffect(() => {
      const initializeMarketsMap = async () => {
        if (!mapContainerRef.current) return;
        
        // If no markets, don't initialize the map
        if (markets.length === 0) {
          return;
        }

        try {
          // Load MapLibre GL JS
          if (typeof window.maplibregl === 'undefined') {
            const maplibreglModule = await import('maplibre-gl');
            window.maplibregl = maplibreglModule.default;
          }

                     const bounds = calculateMapBounds();
           
           const newMap = new window.maplibregl.Map({
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
                           center: [bounds.center.lng, bounds.center.lat],
              zoom: bounds.zoom, // Use calculated zoom level - closer to final position
              maxZoom: 18,
              minZoom: 3,
              maxPitch: 0,
              preserveDrawingBuffer: false,
              antialias: false
           });

          setMap(newMap);

                     newMap.on('load', () => {
             setMapReady(true);
             
             // Add all markets as circles
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
                    'fill-color': '#52bad7',
                    'fill-opacity': 0.3
                  }
               });

               newMap.addLayer({
                 id: `market-border-${market.id}`,
                 type: 'line',
                 source: `market-${market.id}`,
                                   paint: {
                    'line-color': '#52bad7',
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
                    'circle-color': '#52bad7',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 1
                  }
               });

               // Add click handler for each market
               newMap.on('click', `market-circle-${market.id}`, (e) => {
                 e.preventDefault();
                 setTooltip({
                   market,
                   x: e.point.x,
                   y: e.point.y
                 });
               });

               newMap.on('click', `market-center-marker-${market.id}`, (e) => {
                 e.preventDefault();
                 setTooltip({
                   market,
                   x: e.point.x,
                   y: e.point.y
                 });
               });

               // Change cursor on hover
               newMap.on('mouseenter', `market-circle-${market.id}`, () => {
                 newMap.getCanvas().style.cursor = 'pointer';
               });

               newMap.on('mouseleave', `market-circle-${market.id}`, () => {
                 newMap.getCanvas().style.cursor = '';
               });

               newMap.on('mouseenter', `market-center-marker-${market.id}`, () => {
                 newMap.getCanvas().style.cursor = 'pointer';
               });

               newMap.on('mouseleave', `market-center-marker-${market.id}`, () => {
                 newMap.getCanvas().style.cursor = '';
               });
             });
             
                           // Fit the map to show all markets with their radius circles
              setTimeout(() => {
                newMap.fitBounds(bounds.bounds, {
                  padding: 20, // Add some padding around the bounds
                  maxZoom: 15, // Don't zoom in too much
                  duration: 300 // Very short, subtle animation
                });
              }, 100); // Small delay to ensure all layers are rendered
           });

        } catch (error) {
          console.error('Error initializing markets map:', error);
        }
      };

      initializeMarketsMap();

      // Cleanup
      return () => {
        if (map) {
          map.remove();
        }
      };
    }, [markets]);

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

         return (
       <div className={styles.content}>
         {markets.length === 0 ? (
           <div className={styles.emptyState}>
             <h3>No Markets Yet</h3>
             <p>You haven't created any markets yet. Create your first market to get started.</p>
             <Link to="/app/markets/create">
               <Button variant="teal" size="lg">
                 <span>Create Your First Market</span>
               </Button>
             </Link>
           </div>
         ) : (
           <div className={styles.mapView}>
             <div ref={mapContainerRef} className={`${styles.mapContainer} mapContainer`}>
               {!mapReady && (
                 <div className={styles.mapLoading}>
                   Loading markets map...
                 </div>
               )}
             </div>
             
             {/* Market Tooltip */}
             {tooltip && (
               <div 
                 className={`${styles.marketTooltip} market-tooltip`}
                 style={{
                   left: tooltip.x + 10,
                   top: tooltip.y - 10
                 }}
               >
                 <div className={styles.tooltipContent}>
                   <h4>{tooltip.market.name}</h4>
                   <p>{tooltip.market.city}, {tooltip.market.state}</p>
                   <p>{tooltip.market.radius_miles} mile radius</p>
                   <Button 
                     ghost
                     size="sm"
                     onClick={() => navigate(`/app/market/${tooltip.market.id}/overview`)}
                   >
                     <ExternalLink size={14} />
                     <span>View Market</span>
                   </Button>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
     );
  };

  if (loading || teamLoading) {
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
                 <Button ghost onClick={fetchMarkets}>Try Again</Button>
      </div>
    );
  }

  // Show team required message if user doesn't have a team
  if (!hasTeam) {
    return (
      <div className={styles.container}>
        <div className={styles.teamRequiredState}>
          <div className={styles.teamRequiredIcon}>
            <Lock size={48} />
          </div>
          <h3>Team Required</h3>
          <p>Join or create a team to access markets and network features.</p>
          <p>These features help you collaborate with your team and manage geographic market intelligence.</p>
                     <div className={styles.teamRequiredActions}>
             <Button variant="teal" size="lg" onClick={() => navigate('/app/settings/company')}>
               <span>Create Team</span>
             </Button>
             <Button variant="blue" size="lg" outline onClick={() => navigate('/app/settings/users')}>
               <span>Join Team</span>
             </Button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Routes>
        <Route path="list" element={
          markets.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No Markets Yet</h3>
              <p>You haven't created any markets yet. Create your first market to get started.</p>
                             <Link to="/app/markets/create">
                 <Button variant="teal" size="lg">
                   <span>Create Your First Market</span>
                 </Button>
               </Link>
            </div>
          ) : (
            <MarketsListView />
          )
        } />
        <Route path="map" element={<MarketsMapView />} />
        <Route path="create" element={<InteractiveMarketCreation />} />
        <Route path="*" element={<Navigate to="list" replace />} />
      </Routes>
    </div>
  );
}