import { useEffect, useRef, useState } from 'react';
import styles from './HCOMap.module.css';

export default function HCOMap({ center, radius, organizations = [] }) {
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Create circle GeoJSON (same pattern as your other maps)
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

  // Calculate map bounds
  const calculateMapBounds = (lat, lng, radiusMiles) => {
    const radiusInDegrees = radiusMiles / 69;
    
    const minLat = lat - radiusInDegrees;
    const maxLat = lat + radiusInDegrees;
    const minLng = lng - radiusInDegrees;
    const maxLng = lng + radiusInDegrees;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom;
    if (maxDiff >= 30) zoom = 4;
    else if (maxDiff >= 15) zoom = 5;
    else if (maxDiff >= 8) zoom = 6;
    else if (maxDiff >= 4) zoom = 7;
    else if (maxDiff >= 2) zoom = 8;
    else if (maxDiff >= 1) zoom = 9;
    else if (maxDiff >= 0.5) zoom = 10;
    else zoom = 11;

    const bounds = [
      [minLng - lngDiff * 0.1, minLat - latDiff * 0.1],
      [maxLng + lngDiff * 0.1, maxLat + latDiff * 0.1]
    ];

    return { bounds, zoom };
  };

  // Load MapLibre GL JS and initialize map
  useEffect(() => {
    const loadMapLibre = async () => {
      if (typeof maplibregl === 'undefined') {
        const maplibregl = await import('maplibre-gl');
        window.maplibregl = maplibregl.default;
      }
      
      if (mapContainerRef.current && !map && center) {
        initializeMap();
      }
    };

    loadMapLibre();
    
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
  }, []);

  const initializeMap = () => {
    if (!window.maplibregl || !center) return;

    const bounds = calculateMapBounds(center.lat, center.lng, radius);

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
      zoom: bounds.zoom,
      maxZoom: 18,
      minZoom: 3,
      maxPitch: 0,
      preserveDrawingBuffer: false,
      antialias: false
    });

    mapRef.current = newMap;
    setMap(newMap);

    newMap.on('load', () => {
      // Add radius circle
      newMap.addSource('radius-circle', {
        type: 'geojson',
        data: createCircleGeoJSON(center.lat, center.lng, radius)
      });

      newMap.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#1DADBE',
          'fill-opacity': 0.15
        }
      });

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
          'circle-radius': 8,
          'circle-color': '#1DADBE',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2
        }
      });
    });
  };

  // Update organizations on map when data changes
  useEffect(() => {
    if (!map || organizations.length === 0) return;

    // Convert organizations to GeoJSON with clustering
    const geojson = {
      type: 'FeatureCollection',
      features: organizations.map(org => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [org.address.longitude, org.address.latitude]
        },
        properties: {
          name: org.name,
          classification: org.taxonomy?.classification,
          specialty: org.taxonomy?.consolidated_specialty,
          city: org.address.city,
          state: org.address.state,
          distance: org.distance_miles
        }
      }))
    };

    // Remove existing sources/layers if they exist
    if (map.getSource('organizations')) {
      if (map.getLayer('clusters')) map.removeLayer('clusters');
      if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
      if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
      map.removeSource('organizations');
    }

    // Add source with clustering
    map.addSource('organizations', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Cluster circles
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'organizations',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });

    // Cluster count labels
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'organizations',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Individual (unclustered) points
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'organizations',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Click handler for clusters
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('organizations').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Click handler for individual points - show popup
    map.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;

      new window.maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="font-family: inherit;">
            <strong style="display: block; margin-bottom: 6px; color: #1a1a1a;">${props.name}</strong>
            <div style="font-size: 12px; color: #666;">
              <div><strong>Service Type:</strong> ${props.classification || 'N/A'}</div>
              <div><strong>Specialty:</strong> ${props.specialty || 'N/A'}</div>
              <div><strong>Location:</strong> ${props.city}, ${props.state}</div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
                <strong>Distance:</strong> ${parseFloat(props.distance).toFixed(2)} mi
              </div>
            </div>
          </div>
        `)
        .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'unclustered-point', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
    });

  }, [map, organizations]);

  return (
    <div 
      className={styles.mapContainer} 
      ref={mapContainerRef}
      style={{ marginTop: '12px' }}
    />
  );
}

