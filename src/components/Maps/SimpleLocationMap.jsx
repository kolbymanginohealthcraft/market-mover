import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * SimpleLocationMap - Display a single location on a map with a marker
 * @param {Object} center - { lat, lng }
 * @param {number} zoom - Zoom level (default: 14)
 * @param {string} markerLabel - Optional label for the marker
 * @param {Array} polygons - Optional array of GeoJSON Feature objects to render as filled areas
 * @param {Array} outlinePolygons - Optional array of GeoJSON Feature objects to render as outlines
 */
export default function SimpleLocationMap({
  center,
  zoom = 14,
  markerLabel,
  polygons,
  outlinePolygons,
  polygonStyle,
  outlineStyle,
  lineFeatures = [],
  lineStyle,
  secondaryMarker,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const secondaryMarkerRef = useRef(null);
  const overlayIds = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 9);
    return {
      source: `polygon-source-${suffix}`,
      fill: `polygon-fill-${suffix}`,
      outline: `polygon-outline-${suffix}`,
    };
  }, []);
  const outlineIds = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 9);
    return {
      source: `outline-source-${suffix}`,
      fill: `outline-fill-${suffix}`,
      outline: `outline-only-${suffix}`,
    };
  }, []);
  const lineIds = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 9);
    return {
      source: `line-source-${suffix}`,
      line: `line-layer-${suffix}`,
    };
  }, []);
  const polygonPaint = useMemo(
    () => ({
      fillColor: polygonStyle?.fillColor ?? '#5B8DEF',
      fillOpacity: polygonStyle?.fillOpacity ?? 0.16,
      outlineColor: polygonStyle?.outlineColor ?? '#274690',
      outlineWidth: polygonStyle?.outlineWidth ?? 2,
    }),
    [polygonStyle]
  );
  const outlinePaint = useMemo(
    () => ({
      fillColor: outlineStyle?.fillColor ?? '#4CC9F0',
      fillOpacity: outlineStyle?.fillOpacity ?? 0.14,
      outlineColor: outlineStyle?.outlineColor ?? '#2B7A9D',
      outlineWidth: outlineStyle?.outlineWidth ?? 2,
    }),
    [outlineStyle]
  );
  const linePaint = useMemo(
    () => ({
      color: lineStyle?.color ?? '#FF6B6B',
      width: lineStyle?.width ?? 2,
      opacity: lineStyle?.opacity ?? 0.9,
    }),
    [lineStyle]
  );

  const normalizedLineFeatures = useMemo(
    () => (Array.isArray(lineFeatures) ? lineFeatures : []),
    [lineFeatures]
  );

  const cleanSecondaryMarker = useMemo(() => {
    if (
      !secondaryMarker ||
      !secondaryMarker.position ||
      !Number.isFinite(secondaryMarker.position.lat) ||
      !Number.isFinite(secondaryMarker.position.lng)
    ) {
      return null;
    }

    return {
      position: {
        lat: secondaryMarker.position.lat,
        lng: secondaryMarker.position.lng,
      },
      label: secondaryMarker.label || null,
    };
  }, [secondaryMarker]);

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

    const validPolygons = Array.isArray(polygons)
      ? polygons.filter((feature) => feature && feature.geometry)
      : [];

    const featureCollection = {
      type: 'FeatureCollection',
      features: validPolygons,
    };

    const validOutlinePolygons = Array.isArray(outlinePolygons)
      ? outlinePolygons.filter((feature) => feature && feature.geometry)
      : [];

    const outlineCollection = {
      type: 'FeatureCollection',
      features: validOutlinePolygons,
    };

    const validLineFeatures = normalizedLineFeatures.filter((feature) => feature && feature.geometry);

    const lineCollection = {
      type: 'FeatureCollection',
      features: validLineFeatures,
    };

    const getBoundsFromFeatures = (features) => {
      let bounds = null;

      const extend = (coords) => {
        if (!Array.isArray(coords)) return;
        if (coords.length === 0) return;

        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          const [lng, lat] = coords;
          if (Number.isFinite(lng) && Number.isFinite(lat)) {
            if (!bounds) {
              bounds = new maplibregl.LngLatBounds([lng, lat], [lng, lat]);
            } else {
              bounds.extend([lng, lat]);
            }
          }
          return;
        }

        coords.forEach(extend);
      };

      features.forEach((feature) => {
        if (!feature?.geometry?.coordinates) return;
        extend(feature.geometry.coordinates);
      });

      return bounds;
    };

    const fitToFeatures = () => {
      if (!map.current) return;

      const targetFeatures =
        validPolygons.length > 0
          ? validPolygons
          : validOutlinePolygons.length > 0
          ? validOutlinePolygons
          : validLineFeatures.length > 0
          ? validLineFeatures
          : null;

      if (!targetFeatures) {
        map.current.easeTo({
          center: [center.lng, center.lat],
          zoom,
          duration: 400,
        });
        return;
      }

      const bounds = getBoundsFromFeatures(targetFeatures);
      if (!bounds) {
        map.current.easeTo({
          center: [center.lng, center.lat],
          zoom,
          duration: 400,
        });
        return;
      }

      bounds.extend([center.lng, center.lat]);
      if (cleanSecondaryMarker) {
        bounds.extend([cleanSecondaryMarker.position.lng, cleanSecondaryMarker.position.lat]);
      }

      const canvas = map.current.getCanvas();
      const paddingBase = canvas ? Math.round(Math.min(canvas.width, canvas.height) * 0.12) : 40;
      map.current.fitBounds(bounds, {
        padding: Math.max(paddingBase, 32),
        duration: 500,
      });
    };

    const applyPolygonOverlay = () => {
      if (!map.current) return;

      const source = map.current.getSource(overlayIds.source);
      if (validPolygons.length === 0) {
        if (source) {
          if (map.current.getLayer(overlayIds.fill)) {
            map.current.removeLayer(overlayIds.fill);
          }
          if (map.current.getLayer(overlayIds.outline)) {
            map.current.removeLayer(overlayIds.outline);
          }
          map.current.removeSource(overlayIds.source);
        }
        return;
      }

      if (source) {
        source.setData(featureCollection);
      } else {
        map.current.addSource(overlayIds.source, {
          type: 'geojson',
          data: featureCollection,
        });

        map.current.addLayer({
          id: overlayIds.fill,
          type: 'fill',
          source: overlayIds.source,
          paint: {
            'fill-color': polygonPaint.fillColor,
            'fill-opacity': polygonPaint.fillOpacity,
          },
        });

        map.current.addLayer({
          id: overlayIds.outline,
          type: 'line',
          source: overlayIds.source,
          paint: {
            'line-color': polygonPaint.outlineColor,
            'line-width': polygonPaint.outlineWidth,
          },
        });
      }
    };

    const applyOutlineOverlay = () => {
      if (!map.current) return;

      const source = map.current.getSource(outlineIds.source);
      if (validOutlinePolygons.length === 0) {
        if (source) {
          if (map.current.getLayer(outlineIds.fill)) {
            map.current.removeLayer(outlineIds.fill);
          }
          if (map.current.getLayer(outlineIds.outline)) {
            map.current.removeLayer(outlineIds.outline);
          }
          map.current.removeSource(outlineIds.source);
        }
        return;
      }

      if (source) {
        source.setData(outlineCollection);
      } else {
        map.current.addSource(outlineIds.source, {
          type: 'geojson',
          data: outlineCollection,
        });

        map.current.addLayer({
          id: outlineIds.fill,
          type: 'fill',
          source: outlineIds.source,
          paint: {
            'fill-color': outlinePaint.fillColor,
            'fill-opacity': outlinePaint.fillOpacity,
          },
        });

        map.current.addLayer({
          id: outlineIds.outline,
          type: 'line',
          source: outlineIds.source,
          paint: {
            'line-color': outlinePaint.outlineColor,
            'line-width': outlinePaint.outlineWidth,
          },
        });
      }
    };

    const applyLineOverlay = () => {
      if (!map.current) return;

      const source = map.current.getSource(lineIds.source);
      if (validLineFeatures.length === 0) {
        if (source) {
          if (map.current.getLayer(lineIds.line)) {
            map.current.removeLayer(lineIds.line);
          }
          map.current.removeSource(lineIds.source);
        }
        return;
      }

      if (source) {
        source.setData(lineCollection);
      } else {
        map.current.addSource(lineIds.source, {
          type: 'geojson',
          data: lineCollection,
        });

        map.current.addLayer({
          id: lineIds.line,
          type: 'line',
          source: lineIds.source,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': linePaint.color,
            'line-width': linePaint.width,
            'line-opacity': linePaint.opacity,
          },
        });
      }
    };

    const applyOverlays = () => {
      applyPolygonOverlay();
      applyOutlineOverlay();
      applyLineOverlay();
      fitToFeatures();
    };

    if (map.current.isStyleLoaded()) {
      applyOverlays();
    } else {
      map.current.once('load', applyOverlays);
    }

    if (secondaryMarkerRef.current) {
      secondaryMarkerRef.current.remove();
      secondaryMarkerRef.current = null;
    }

    if (cleanSecondaryMarker) {
      const { lat, lng } = cleanSecondaryMarker.position;
      const markerElement = document.createElement('div');
      markerElement.className = 'simple-map-marker secondary';
      markerElement.style.width = '24px';
      markerElement.style.height = '24px';
      markerElement.style.backgroundImage =
        'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5IiBmaWxsPSIjRkY2QjZCIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=)';
      markerElement.style.backgroundSize = 'contain';

      secondaryMarkerRef.current = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map.current);

      if (cleanSecondaryMarker.label) {
        const popup = new maplibregl.Popup({ offset: 14 }).setHTML(`<strong>${cleanSecondaryMarker.label}</strong>`);
        secondaryMarkerRef.current.setPopup(popup);
      }
    }

    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (secondaryMarkerRef.current) {
        secondaryMarkerRef.current.remove();
        secondaryMarkerRef.current = null;
      }
    };
  }, [
    center,
    zoom,
    markerLabel,
    polygons,
    outlinePolygons,
    normalizedLineFeatures,
    overlayIds,
    outlineIds,
    lineIds,
    polygonPaint,
    outlinePaint,
    linePaint,
    cleanSecondaryMarker,
  ]);

  useEffect(() => {
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (secondaryMarkerRef.current) {
        secondaryMarkerRef.current.remove();
        secondaryMarkerRef.current = null;
      }
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

