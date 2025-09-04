import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network as NetworkIcon } from 'lucide-react';
import Spinner from '../../../components/Buttons/Spinner';
import SectionHeader from '../../../components/Layouts/SectionHeader';
import ControlsRow from '../../../components/Layouts/ControlsRow';
import useTaggedProviders from '../../../hooks/useTaggedProviders';
import { getTagColor, getTagLabel, getMapboxTagColorsWithProperty } from '../../../utils/tagColors';
import styles from './Network.module.css';
import controlsStyles from '../../../components/Layouts/ControlsRow.module.css';

export default function NetworkMapView() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [legendFilters, setLegendFilters] = useState({
    me: true,
    partner: true,
    competitor: true,
    target: true
  });
  
  const {
    taggedProviders,
    loading,
    error,
  } = useTaggedProviders();



  // Calculate map bounds based on provider locations
  const calculateMapBounds = () => {
    if (!taggedProviders || taggedProviders.length === 0) {
      return {
        center: { lng: -98.5795, lat: 39.8283 }, // Center of US
        zoom: 4,
        bounds: [
          [-98.5795 - 10, 39.8283 - 10], // Southwest corner
          [-98.5795 + 10, 39.8283 + 10]  // Northeast corner
        ]
      };
    }

    const validProviders = taggedProviders.filter(p => p.latitude && p.longitude);
    
    if (validProviders.length === 0) {
      return {
        center: { lng: -98.5795, lat: 39.8283 },
        zoom: 4,
        bounds: [
          [-98.5795 - 10, 39.8283 - 10], // Southwest corner
          [-98.5795 + 10, 39.8283 + 10]  // Northeast corner
        ]
      };
    }

    // Calculate bounds including provider locations
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    validProviders.forEach(provider => {
      const lat = parseFloat(provider.latitude);
      const lng = parseFloat(provider.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    });

    const center = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    };

    // Calculate the exact zoom level needed to fit all providers
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

  // Toggle legend filter
  const toggleLegendFilter = (tagType) => {
    setLegendFilters(prev => ({
      ...prev,
      [tagType]: !prev[tagType]
    }));
  };

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainerRef.current || taggedProviders.length === 0) return;

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
          zoom: bounds.zoom,
          maxZoom: 18,
          minZoom: 3,
          maxPitch: 0,
          preserveDrawingBuffer: false,
          antialias: false
        });

        mapRef.current = newMap;

        newMap.on('load', () => {
          setMapReady(true);
          
          // Add providers as circle layers (like provider listing map)
          const validProviders = taggedProviders.filter(p => p.latitude && p.longitude);
          
          if (validProviders.length > 0) {
            // Create GeoJSON for providers
            const providerFeatures = validProviders.map(provider => {
              const lat = parseFloat(provider.latitude);
              const lng = parseFloat(provider.longitude);
              
              if (isNaN(lat) || isNaN(lng)) return null;

              const primaryTag = provider.tags && provider.tags.length > 0 ? provider.tags[0] : 'default';
              
              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                },
                properties: {
                  id: provider.provider_dhc,
                  name: provider.name,
                  street: provider.street,
                  city: provider.city,
                  state: provider.state,
                  primaryTag: primaryTag,
                  tags: provider.tags || []
                }
              };
            }).filter(Boolean);

            const providerGeoJSON = {
              type: 'FeatureCollection',
              features: providerFeatures
            };

            // Add provider circles source
            newMap.addSource('network-providers', {
              type: 'geojson',
              data: providerGeoJSON
            });

            // Add provider circles layer
            newMap.addLayer({
              id: 'network-providers',
              type: 'circle',
              source: 'network-providers',
              paint: {
                'circle-radius': 8,
                'circle-color': getMapboxTagColorsWithProperty('primaryTag'),
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': 0.9
              }
            });

            // Store original provider data for filtering
            newMap.originalProviderData = providerGeoJSON;

            // Add click handler for provider circles
            newMap.on('click', 'network-providers', (e) => {
              if (e.features.length > 0) {
                const feature = e.features[0];
                const [longitude, latitude] = feature.geometry.coordinates;
                
                const popup = new window.maplibregl.Popup({ offset: 25 })
                  .setLngLat([longitude, latitude])
                  .setHTML(`
                    <div style="padding: 12px; min-width: 200px;">
                      <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1a2e2a;">
                        ${feature.properties.name}
                      </h4>
                      <p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">
                        ${feature.properties.street || ''}, ${feature.properties.city || ''}, ${feature.properties.state || ''}
                      </p>
                      <div style="margin: 0 0 8px 0;">
                        ${feature.properties.tags && feature.properties.tags.length > 0 ? 
                          feature.properties.tags.map(tag => 
                            `<span style="display: inline-block; padding: 2px 6px; margin: 1px; border-radius: 8px; font-size: 10px; font-weight: 500; color: white; background-color: ${getTagColor(tag)};">
                              ${getTagLabel(tag)}
                            </span>`
                          ).join('') : 
                          '<span style="color: #999; font-size: 11px;">No tags</span>'
                        }
                      </div>
                      <button onclick="window.open('/app/provider/${feature.properties.id}/overview', '_blank')" 
                              style="background: #265947; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                        View Provider
                      </button>
                    </div>
                  `);

                popup.addTo(newMap);
              }
            });

            // Change cursor on hover
            newMap.on('mouseenter', 'network-providers', () => {
              newMap.getCanvas().style.cursor = 'pointer';
            });

            newMap.on('mouseleave', 'network-providers', () => {
              newMap.getCanvas().style.cursor = '';
            });
          }

          // Fit the map to show all providers
          setTimeout(() => {
            newMap.fitBounds(bounds.bounds, {
              padding: 20, // Add some padding around the bounds
              maxZoom: 15, // Don't zoom in too much
              duration: 300 // Very short, subtle animation
            });
          }, 100); // Small delay to ensure all layers are rendered
        });

        newMap.on('error', (error) => {
          console.error('Map error:', error);
          setMapError('Failed to load map');
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
      }
    };

    if (!loading && taggedProviders.length > 0) {
      initializeMap();
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapRef.current = null;
      }
    };
  }, [taggedProviders, loading, navigate]);

  // Update circle visibility when legend filters change
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.getSource('network-providers') || !mapRef.current.originalProviderData) return;

    console.log('Legend filters changed:', legendFilters);

    // Filter features from original data based on legend filters
    const filteredFeatures = mapRef.current.originalProviderData.features.filter(feature => {
      const primaryTag = feature.properties.primaryTag;
      const isVisible = primaryTag === 'default' ? true : legendFilters[primaryTag];
      return isVisible;
    });

    // Update the source with filtered data
    const filteredGeoJSON = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };

    mapRef.current.getSource('network-providers').setData(filteredGeoJSON);
  }, [legendFilters]);

  if (loading) return <Spinner message="Loading your network map..." />;

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Network</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={styles.error}>
        <h2>Map Error</h2>
        <p>{mapError}</p>
      </div>
    );
  }

  if (taggedProviders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏥</div>
        <h3>No Network Providers</h3>
        <p>You haven't added any providers to your network yet.</p>
        <p>Use the list view to add and manage your network providers.</p>
      </div>
    );
  }

  const validProviders = taggedProviders.filter(p => p.latitude && p.longitude);
  
  if (validProviders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📍</div>
        <h3>No Location Data</h3>
        <p>Your network providers don't have location coordinates.</p>
        <p>Use the list view to manage your network providers.</p>
      </div>
    );
  }

  // Calculate provider counts by tag type
  const providerCounts = validProviders.reduce((counts, provider) => {
    const primaryTag = provider.tags && provider.tags.length > 0 ? provider.tags[0] : 'default';
    const tagKey = primaryTag === 'default' ? 'default' : primaryTag;
    counts[tagKey] = (counts[tagKey] || 0) + 1;
    return counts;
  }, {});

  // Calculate visible providers count based on legend filters
  const visibleProvidersCount = validProviders.filter(provider => {
    const primaryTag = provider.tags && provider.tags.length > 0 ? provider.tags[0] : 'default';
    const filterKey = primaryTag === 'default' ? 'default' : primaryTag;
    return primaryTag === 'default' ? true : legendFilters[filterKey];
  }).length;

  return (
    <div className={styles.networkMapPage}>
      {/* Controls Row */}
      <ControlsRow
        leftContent={
          <div className={styles.legendItems}>
            {Object.entries(legendFilters).map(([tagType, isVisible]) => (
              <button
                key={tagType}
                className={`${styles.legendItem} ${isVisible ? styles.active : styles.inactive}`}
                onClick={() => toggleLegendFilter(tagType)}
              >
                <div 
                  className={styles.legendMarker} 
                  style={{ backgroundColor: getTagColor(tagType) }}
                ></div>
                <span>{getTagLabel(tagType)}</span>
                <span className={styles.legendCount}>({providerCounts[tagType] || 0})</span>
              </button>
            ))}
          </div>
        }
        rightContent={
          <span className={controlsStyles.summaryText}>
            Showing {visibleProvidersCount} of {validProviders.length} providers
          </span>
        }
      />

      {/* Map Container */}
      <div className={styles.mapView}>
        <div ref={mapContainerRef} className={`${styles.mapContainer} mapContainer`}>
          {!mapReady && (
            <div className={styles.mapLoading}>
              Loading network map...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
