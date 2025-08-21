import { useEffect, useRef, useState } from 'react';
import styles from '../InteractiveMarketCreation.module.css';

export default function MarketMap({ 
  center, 
  radius, 
  onCenterChange, 
  onRadiusChange,
  mapContainerRef 
}) {
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef(null);
  const lastUpdateTime = useRef(0);
  const UPDATE_THROTTLE = 16; // ~60fps
  const errorCount = useRef(0);
  const MAX_ERRORS = 3;
  const updateTimeoutRef = useRef(null);

  // Load MapLibre GL JS
  useEffect(() => {
    const loadMapLibre = async () => {
      if (typeof maplibregl === 'undefined') {
        const maplibregl = await import('maplibre-gl');
        window.maplibregl = maplibregl.default;
      }
      
      if (mapContainerRef.current && !map) {
        initializeMap();
      }
    };

    loadMapLibre();
    
    // Periodic memory cleanup
    const cleanupInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    }, 30000); // Every 30 seconds
    
    // Cleanup function
    return () => {
      clearInterval(cleanupInterval);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapRef.current = null;
      }
    };
  }, []);

  const createCircleGeoJSON = (lat, lng, radiusMiles) => {
    const points = [];
    const steps = 64;
    const radiusInDegrees = radiusMiles / 69; // Approximate conversion

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const pointLat = lat + (radiusInDegrees * Math.cos(angle));
      const pointLng = lng + (radiusInDegrees * Math.sin(angle) / Math.cos(lat * Math.PI / 180));
      points.push([pointLng, pointLat]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [points]
      },
      properties: {}
    };
  };

  const updateCircle = (lat, lng, radiusMiles) => {
    // Don't update if we're currently dragging
    if (isDragging.current) {
      return;
    }
    
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce updates to prevent excessive rendering
    updateTimeoutRef.current = setTimeout(() => {
      try {
        if (map && mapRef.current && !mapRef.current._removed) {
          const circleSource = map.getSource('radius-circle');
          const centerSource = map.getSource('center-marker');
          
          if (circleSource) {
            circleSource.setData(createCircleGeoJSON(lat, lng, radiusMiles));
          }
          
          if (centerSource) {
            centerSource.setData({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              properties: {}
            });
          }
          
          // Use requestAnimationFrame to ensure the update is rendered
          requestAnimationFrame(() => {
            if (map && mapRef.current && !mapRef.current._removed) {
              map.resize();
            }
          });
        }
      } catch (error) {
        console.error('Error updating circle:', error);
      }
    }, 50); // 50ms debounce
  };

  const initializeMap = () => {
    if (!window.maplibregl) return;

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
      center: [center.lng, center.lat],
      zoom: 8,
      // Add performance optimizations
      maxZoom: 18,
      minZoom: 3,
      maxPitch: 0, // Disable 3D to reduce memory usage
      preserveDrawingBuffer: false, // Reduce memory usage
      antialias: false // Reduce GPU memory usage
    });
    
    // Store map reference for cleanup
    mapRef.current = newMap;
    setMap(newMap);

    newMap.on('load', () => {
      // Add circle source
      newMap.addSource('radius-circle', {
        type: 'geojson',
        data: createCircleGeoJSON(center.lat, center.lng, radius)
      });

      // Add circle fill layer
      newMap.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#1DADBE',
          'fill-opacity': 0.3
        }
      });

      // Add circle border layer
      newMap.addLayer({
        id: 'radius-circle-border',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#1DADBE',
          'line-width': 2
        }
      });

      // Add center marker
      newMap.addSource('center-marker', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat]
          },
          properties: {}
        }
      });

      newMap.addLayer({
        id: 'center-marker',
        type: 'circle',
        source: 'center-marker',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 6,   // At zoom level 4 (national view), radius = 6
            8, 8,   // At zoom level 8, radius = 8
            12, 12, // At zoom level 12, radius = 12
            16, 16  // At zoom level 16 (very zoomed in), radius = 16
          ],
          'circle-color': '#1DADBE',
          'circle-stroke-color': 'white',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 1.5,  // At zoom level 4, stroke = 1.5
            8, 2,    // At zoom level 8, stroke = 2
            12, 2.5, // At zoom level 12, stroke = 2.5
            16, 3    // At zoom level 16, stroke = 3
          ]
        }
      });

      // Add a larger invisible hit area for easier dragging
      newMap.addLayer({
        id: 'center-marker-hit',
        type: 'circle',
        source: 'center-marker',
        paint: {
          'circle-radius': 20,
          'circle-color': 'transparent'
        }
      });

      setMap(newMap);
    });

    // Handle circle dragging with optimized interaction
    newMap.on('mousedown', (e) => {
      // Prevent dragging if too many errors
      if (errorCount.current >= MAX_ERRORS) {
        console.log('Drag disabled due to errors');
        return;
      }
      
      // Check if clicking on the circle or center marker
      const features = newMap.queryRenderedFeatures(e.point, { 
        layers: ['radius-circle-fill', 'radius-circle-border', 'center-marker', 'center-marker-hit'] 
      });
      
      if (features.length > 0) {
        console.log('Drag started'); // Debug log
        isDragging.current = true;
        dragStart.current = e.point;
        newMap.getCanvas().style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    newMap.on('mousemove', (e) => {
      if (isDragging.current && dragStart.current) {
        const now = Date.now();
        if (now - lastUpdateTime.current < UPDATE_THROTTLE) {
          e.preventDefault();
          return; // Throttle updates
        }
        lastUpdateTime.current = now;
        
        try {
          const newCenter = newMap.unproject(e.point);
          // Update circle immediately without React state
          const circleSource = newMap.getSource('radius-circle');
          const centerSource = newMap.getSource('center-marker');
          
          if (circleSource) {
            // Use cached radius value to avoid DOM queries
            circleSource.setData(createCircleGeoJSON(newCenter.lat, newCenter.lng, radius));
          }
          
          if (centerSource) {
            centerSource.setData({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [newCenter.lng, newCenter.lat]
              },
              properties: {}
            });
          }
          
          // Store the new center temporarily without updating React state
          // We'll update state only when drag is released
          e.preventDefault();
        } catch (error) {
          console.error('Error during drag:', error);
          errorCount.current++;
          
          // Reset drag state on error
          isDragging.current = false;
          dragStart.current = null;
          newMap.getCanvas().style.cursor = '';
          
          // If too many errors, disable dragging temporarily
          if (errorCount.current >= MAX_ERRORS) {
            console.warn('Too many drag errors, disabling drag temporarily');
            // Reset error count after a delay
            setTimeout(() => {
              errorCount.current = 0;
            }, 5000);
          }
        }
      }
    });

    newMap.on('mouseup', (e) => {
      if (isDragging.current) {
        console.log('Drag ended'); // Debug log
        try {
          // Get the final position and update React state only on release
          const finalCenter = newMap.unproject(e.point);
          onCenterChange({ lat: finalCenter.lat, lng: finalCenter.lng });
        } catch (error) {
          console.error('Error on mouseup:', error);
        }
        
        isDragging.current = false;
        dragStart.current = null;
        newMap.getCanvas().style.cursor = '';
      }
    });

    // Add touch support for mobile
    newMap.on('touchstart', (e) => {
      if (e.points.length === 1) {
        const point = e.points[0];
        const features = newMap.queryRenderedFeatures(point, { 
          layers: ['radius-circle-fill', 'radius-circle-border', 'center-marker', 'center-marker-hit'] 
        });
        
        if (features.length > 0) {
          isDragging.current = true;
          dragStart.current = point;
          e.preventDefault();
        }
      }
    });

    newMap.on('touchmove', (e) => {
      if (isDragging.current && dragStart.current && e.points.length === 1) {
        const now = Date.now();
        if (now - lastUpdateTime.current < UPDATE_THROTTLE) {
          e.preventDefault();
          return; // Throttle updates
        }
        lastUpdateTime.current = now;
        
        try {
          const newCenter = newMap.unproject(e.points[0]);
          // Update circle immediately without React state
          const circleSource = newMap.getSource('radius-circle');
          const centerSource = newMap.getSource('center-marker');
          
          if (circleSource) {
            // Use cached radius value to avoid DOM queries
            circleSource.setData(createCircleGeoJSON(newCenter.lat, newCenter.lng, radius));
          }
          
          if (centerSource) {
            centerSource.setData({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [newCenter.lng, newCenter.lat]
              },
              properties: {}
            });
          }
          
          // Store the new center temporarily without updating React state
          // We'll update state only when drag is released
          e.preventDefault();
        } catch (error) {
          console.error('Error during touch drag:', error);
          // Reset drag state on error
          isDragging.current = false;
          dragStart.current = null;
        }
      }
    });

    newMap.on('touchend', (e) => {
      if (isDragging.current && e.changedTouches.length > 0) {
        try {
          // Get the final position and update React state only on release
          const finalCenter = newMap.unproject(e.changedTouches[0]);
          onCenterChange({ lat: finalCenter.lat, lng: finalCenter.lng });
        } catch (error) {
          console.error('Error on touchend:', error);
        }
        
        isDragging.current = false;
        dragStart.current = null;
      }
    });

    // Handle wheel events for radius resizing
    newMap.on('wheel', (e) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
        e.preventDefault();
        const delta = e.originalEvent.deltaY > 0 ? -2 : 2;
        const newRadius = Math.max(1, Math.min(100, radius + delta));
        if (newRadius !== radius) {
          onRadiusChange(newRadius);
          updateCircle(center.lat, center.lng, newRadius);
        }
      }
    });
  };

  // Update circle when center or radius changes
  useEffect(() => {
    if (map) {
      updateCircle(center.lat, center.lng, radius);
    }
  }, [center, radius, map]);

  // Fly to new location when center changes externally
  useEffect(() => {
    if (map && center) {
      map.flyTo({
        center: [center.lng, center.lat],
        zoom: 10,
        duration: 1500
      });
      
      setTimeout(() => {
        updateCircle(center.lat, center.lng, radius);
      }, 300);
    }
  }, [center]);

  return (
    <div className={styles.mapSection}>
      <div className={styles.mapContainer} ref={mapContainerRef} />
    </div>
  );
} 