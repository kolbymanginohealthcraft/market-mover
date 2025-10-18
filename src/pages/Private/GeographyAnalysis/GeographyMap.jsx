import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './GeographyMap.module.css';

export default function GeographyMap({ center, radius, boundaryType = 'tracts' }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!center || !radius) return;

    // Initialize map
    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
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
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }]
        },
        center: [center.lng, center.lat],
        zoom: getZoomLevel(radius)
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    } else {
      // Update map center and zoom when props change
      map.current.setCenter([center.lng, center.lat]);
      map.current.setZoom(getZoomLevel(radius));
    }

    // Load boundary data
    loadBoundaries();

    return () => {
      // Cleanup is handled when component unmounts completely
    };
  }, [center, radius, boundaryType]);

  const getZoomLevel = (radiusMiles) => {
    if (radiusMiles <= 5) return 11;
    if (radiusMiles <= 10) return 10;
    if (radiusMiles <= 20) return 9;
    if (radiusMiles <= 30) return 8.5;
    return 8;
  };

  const loadBoundaries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        latitude: center.lat,
        longitude: center.lng,
        radius: radius,
        type: boundaryType
      });

      const response = await fetch(`/api/market-geography/boundaries?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load boundary data');
      }

      const geojson = await response.json();

      // Remove existing layers and sources
      if (map.current.getLayer('boundaries-fill')) {
        map.current.removeLayer('boundaries-fill');
      }
      if (map.current.getLayer('boundaries-outline')) {
        map.current.removeLayer('boundaries-outline');
      }
      if (map.current.getSource('boundaries')) {
        map.current.removeSource('boundaries');
      }
      if (map.current.getLayer('market-circle-fill')) {
        map.current.removeLayer('market-circle-fill');
      }
      if (map.current.getLayer('market-circle-border')) {
        map.current.removeLayer('market-circle-border');
      }
      if (map.current.getLayer('center-marker')) {
        map.current.removeLayer('center-marker');
      }
      if (map.current.getSource('market-circle')) {
        map.current.removeSource('market-circle');
      }
      if (map.current.getSource('center-marker')) {
        map.current.removeSource('center-marker');
      }

      // Add boundary polygons
      map.current.addSource('boundaries', {
        type: 'geojson',
        data: geojson
      });

      // Check if features are points or polygons
      const firstFeature = geojson.features[0];
      const isPoint = firstFeature && firstFeature.geometry.type === 'Point';

      if (isPoint) {
        // For points (census tracts), add circle markers
        map.current.addLayer({
          id: 'boundaries-fill',
          type: 'circle',
          source: 'boundaries',
          paint: {
            'circle-radius': 6,
            'circle-color': getBoundaryColor(boundaryType),
            'circle-opacity': 0.6,
            'circle-stroke-width': 2,
            'circle-stroke-color': getBoundaryOutlineColor(boundaryType)
          }
        });
      } else {
        // For polygons (ZIPs, counties), add fill and outline
        map.current.addLayer({
          id: 'boundaries-fill',
          type: 'fill',
          source: 'boundaries',
          paint: {
            'fill-color': getBoundaryColor(boundaryType),
            'fill-opacity': 0.3
          }
        });

        map.current.addLayer({
          id: 'boundaries-outline',
          type: 'line',
          source: 'boundaries',
          paint: {
            'line-color': getBoundaryOutlineColor(boundaryType),
            'line-width': 2
          }
        });
      }

      // Add market radius circle with consistent styling
      const radiusInMeters = radius * 1609.34;
      const circleGeoJSON = createCircle(center, radiusInMeters, 64);
      
      map.current.addSource('market-circle', {
        type: 'geojson',
        data: circleGeoJSON
      });

      // Add circle fill layer
      map.current.addLayer({
        id: 'market-circle-fill',
        type: 'fill',
        source: 'market-circle',
        paint: {
          'fill-color': '#1DADBE',
          'fill-opacity': 0.3
        }
      });

      // Add circle border layer
      map.current.addLayer({
        id: 'market-circle-border',
        type: 'line',
        source: 'market-circle',
        paint: {
          'line-color': '#1DADBE',
          'line-width': 2
        }
      });

      // Add center marker with consistent styling
      map.current.addSource('center-marker', {
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

      map.current.addLayer({
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

      // Add popup on click
      map.current.on('click', 'boundaries-fill', (e) => {
        const properties = e.features[0].properties;
        let description = '';
        
        if (boundaryType === 'tracts') {
          description = `<strong>Census Tract</strong><br/>ID: ${properties.geo_id}`;
        } else if (boundaryType === 'zips') {
          description = `<strong>ZIP Code</strong><br/>${properties.zip_code}`;
        } else if (boundaryType === 'counties') {
          description = `<strong>County</strong><br/>${properties.county_name}`;
        }

        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(description)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'boundaries-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'boundaries-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading boundaries:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getBoundaryColor = (type) => {
    if (type === 'tracts') return '#4A90E2';
    if (type === 'zips') return '#50C878';
    if (type === 'counties') return '#9B59B6';
    return '#4A90E2';
  };

  const getBoundaryOutlineColor = (type) => {
    if (type === 'tracts') return '#2E5C8A';
    if (type === 'zips') return '#2E7D4E';
    if (type === 'counties') return '#5D3570';
    return '#2E5C8A';
  };

  const createCircle = (center, radiusInMeters, points = 64) => {
    const coords = {
      latitude: center.lat,
      longitude: center.lng
    };

    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);

      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ret]
      }
    };
  };

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.loading}>
          Loading {boundaryType}...
        </div>
      )}
      {error && (
        <div className={styles.error}>
          Error: {error}
        </div>
      )}
      <div ref={mapContainer} className={styles.map} />
    </div>
  );
}
