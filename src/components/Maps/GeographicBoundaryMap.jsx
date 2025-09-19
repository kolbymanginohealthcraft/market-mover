import { useEffect, useRef, useState } from 'react';
import useGeographicBoundaries from '../../hooks/useGeographicBoundaries';
import styles from './GeographicBoundaryMap.module.css';

export default function GeographicBoundaryMap({ 
  centerPoint, 
  radiusInMiles, 
  boundaryType = 'tracts',
  showBoundaries = true,
  boundaryStyle = {
    fillColor: '#1DADBE',
    fillOpacity: 0.2,
    strokeColor: '#1DADBE',
    strokeWidth: 2,
    strokeOpacity: 0.8
  },
  onBoundaryClick = null,
  mapContainerRef 
}) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Fetch boundary data
  const { data: boundaryData, loading: boundaryLoading, error: boundaryError } = useGeographicBoundaries(
    centerPoint, 
    radiusInMiles, 
    boundaryType
  );

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainerRef?.current || !centerPoint?.latitude || !centerPoint?.longitude) return;

      try {
        // Load MapLibre GL JS
        if (typeof window.maplibregl === 'undefined') {
          const maplibreglModule = await import('maplibre-gl');
          window.maplibregl = maplibreglModule.default;
        }

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
          center: [centerPoint.longitude, centerPoint.latitude],
          zoom: 10,
          maxZoom: 18,
          minZoom: 3,
          maxPitch: 0,
          preserveDrawingBuffer: false,
          antialias: false
        });

        mapRef.current = newMap;

        newMap.on('load', () => {
          setMapReady(true);
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

    initializeMap();

    // Cleanup
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
  }, [centerPoint?.latitude, centerPoint?.longitude]);

  // Add boundary layers when data is available
  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    try {
      // Remove existing boundary layers if they exist
      if (map.getLayer('boundary-fill')) {
        map.removeLayer('boundary-fill');
      }
      if (map.getLayer('boundary-stroke')) {
        map.removeLayer('boundary-stroke');
      }
      if (map.getSource('boundary-data')) {
        map.removeSource('boundary-data');
      }

      // Only add boundary layers if we have data and showBoundaries is true
      if (boundaryData && boundaryData.features && boundaryData.features.length > 0 && showBoundaries) {
        // Add boundary source
        map.addSource('boundary-data', {
          type: 'geojson',
          data: boundaryData
        });

        // Add fill layer
        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary-data',
          paint: {
            'fill-color': boundaryStyle.fillColor,
            'fill-opacity': boundaryStyle.fillOpacity
          }
        });

        // Add stroke layer
        map.addLayer({
          id: 'boundary-stroke',
          type: 'line',
          source: 'boundary-data',
          paint: {
            'line-color': boundaryStyle.strokeColor,
            'line-width': boundaryStyle.strokeWidth,
            'line-opacity': boundaryStyle.strokeOpacity
          }
        });

        // Add click handler if provided
        if (onBoundaryClick) {
          map.on('click', 'boundary-fill', (e) => {
            if (e.features.length > 0) {
              const feature = e.features[0];
              onBoundaryClick(feature, e);
            }
          });

          // Change cursor on hover
          map.on('mouseenter', 'boundary-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', 'boundary-fill', () => {
            map.getCanvas().style.cursor = '';
          });
        }

        // Fit map to boundary data
        const bounds = new window.maplibregl.LngLatBounds();
        boundaryData.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => {
              bounds.extend([coord[0], coord[1]]);
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
              polygon[0].forEach(coord => {
                bounds.extend([coord[0], coord[1]]);
              });
            });
          }
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 20,
            maxZoom: 15
          });
        }
      } else {
        // If no boundary data, just center on the center point
        if (centerPoint?.latitude && centerPoint?.longitude) {
          map.setCenter([centerPoint.longitude, centerPoint.latitude]);
          map.setZoom(10);
        }
      }

    } catch (error) {
      console.error('Error adding boundary layers:', error);
    }
  }, [mapReady, boundaryData, showBoundaries, boundaryStyle, onBoundaryClick, centerPoint]);

  // Update map center when centerPoint changes
  useEffect(() => {
    if (mapRef.current && centerPoint?.latitude && centerPoint?.longitude) {
      mapRef.current.setCenter([centerPoint.longitude, centerPoint.latitude]);
    }
  }, [centerPoint?.latitude, centerPoint?.longitude]);

  if (mapError) {
    return (
      <div className={styles.error}>
        <h3>Map Error</h3>
        <p>{mapError}</p>
      </div>
    );
  }

  if (boundaryError) {
    return (
      <div className={styles.error}>
        <h3>Boundary Data Error</h3>
        <p>{boundaryError}</p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={mapContainerRef} className={styles.map} />
      {boundaryLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading {boundaryType} boundaries...</p>
        </div>
      )}
    </div>
  );
}
