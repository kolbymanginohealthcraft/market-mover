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
      if (map.current.getLayer('market-radius')) {
        map.current.removeLayer('market-radius');
      }
      if (map.current.getSource('market-circle')) {
        map.current.removeSource('market-circle');
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

      // Add market radius circle
      const radiusInMeters = radius * 1609.34;
      const circleGeoJSON = createCircle(center, radiusInMeters, 64);
      
      map.current.addSource('market-circle', {
        type: 'geojson',
        data: circleGeoJSON
      });

      map.current.addLayer({
        id: 'market-radius',
        type: 'line',
        source: 'market-circle',
        paint: {
          'line-color': '#FF4444',
          'line-width': 2,
          'line-dasharray': [2, 2]
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

