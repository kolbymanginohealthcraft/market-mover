import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MultiMarkerMap({
  center,
  markers = [],
  zoom = 8,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRefs = useRef([]);

  const validMarkers = useMemo(() => {
    return markers.filter(
      (marker) =>
        marker &&
        marker.latitude != null &&
        marker.longitude != null &&
        Number.isFinite(Number(marker.latitude)) &&
        Number.isFinite(Number(marker.longitude))
    );
  }, [markers]);

  useEffect(() => {
    if (!center || !center.lat || !center.lng) return;

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

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    const updateMarkers = () => {
      markerRefs.current.forEach((marker) => {
        if (marker) marker.remove();
      });
      markerRefs.current = [];

      if (validMarkers.length === 0) {
        const el = document.createElement('div');
        el.className = 'simple-map-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzAwYzA4YiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+)';
        el.style.backgroundSize = 'contain';
        el.style.cursor = 'pointer';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([center.lng, center.lat])
          .addTo(map.current);

        markerRefs.current.push(marker);
        return;
      }

      validMarkers.forEach((markerData, index) => {
        const el = document.createElement('div');
        el.className = 'simple-map-marker';
        el.style.width = index === 0 ? '32px' : '24px';
        el.style.height = index === 0 ? '32px' : '24px';
        el.style.backgroundImage = index === 0
          ? 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzAwYzA4YiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+)'
          : 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5IiBmaWxsPSIjRkY2QjZCIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=)';
        el.style.backgroundSize = 'contain';
        el.style.cursor = 'pointer';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([Number(markerData.longitude), Number(markerData.latitude)])
          .addTo(map.current);

        if (markerData.name || markerData.label) {
          const popup = new maplibregl.Popup({ offset: 25 })
            .setHTML(`<strong>${markerData.name || markerData.label || 'Provider'}</strong>`);
          marker.setPopup(popup);
        }

        markerRefs.current.push(marker);
      });

      if (validMarkers.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([center.lng, center.lat]);
        validMarkers.forEach((markerData) => {
          bounds.extend([Number(markerData.longitude), Number(markerData.latitude)]);
        });

        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, {
            padding: 50,
            duration: 500,
          });
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.current.once('load', updateMarkers);
    }

    return () => {
      markerRefs.current.forEach((marker) => {
        if (marker) marker.remove();
      });
      markerRefs.current = [];
    };
  }, [center, validMarkers, zoom]);

  useEffect(() => {
    return () => {
      markerRefs.current.forEach((marker) => {
        if (marker) marker.remove();
      });
      markerRefs.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

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

