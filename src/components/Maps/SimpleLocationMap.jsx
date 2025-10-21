import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * SimpleLocationMap - Display a single location on a map with a marker
 * @param {Object} center - { lat, lng }
 * @param {number} zoom - Zoom level (default: 14)
 * @param {string} markerLabel - Optional label for the marker
 */
export default function SimpleLocationMap({ center, zoom = 14, markerLabel }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (!center || !center.lat || !center.lng) return;

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
        zoom: zoom
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    // Add or update marker
    if (marker.current) {
      marker.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'simple-map-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzAwYzA4YiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+)';
    el.style.backgroundSize = 'contain';
    el.style.cursor = 'pointer';

    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

    if (markerLabel) {
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<strong>${markerLabel}</strong>`);
      marker.current.setPopup(popup);
    }

    // Update map center if it changes
    map.current.setCenter([center.lng, center.lat]);

    return () => {
      // Cleanup on unmount
      if (marker.current) {
        marker.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, markerLabel]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
}

