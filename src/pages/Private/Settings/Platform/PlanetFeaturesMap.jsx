import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './PlanetFeaturesExplorer.module.css';

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const buildPopupContent = (feature) => {
  const lines = [];
  if (feature.name) {
    lines.push(`<strong>${feature.name}</strong>`);
  } else {
    lines.push(`<strong>${feature.featureType ?? 'OSM feature'}</strong>`);
  }

  if (feature.featureType) {
    const geometrySuffix = feature.geometryType ? ` • ${feature.geometryType}` : '';
    lines.push(`<div>${feature.featureType}${geometrySuffix}</div>`);
  }

  if (feature.featureClass) {
    lines.push(`<div>Primary tag: ${feature.featureClass}</div>`);
  }

  const tags = feature.focusedTags ?? [];
  if (tags.length > 0) {
    const formatted = tags
      .map((tag) => `${tag.key}=${tag.value ?? '(no value)'}`)
      .join('<br />');
    lines.push(`<div style="margin-top:6px;"><em>${formatted}</em></div>`);
  }

  return lines.join('');
};

export default function PlanetFeaturesMap({ center, features, onlyPoints, detailMode = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const bounds = useMemo(() => {
    if (!features || features.length === 0) return null;
    const initial = new maplibregl.LngLatBounds();
    features.forEach((feature) => {
      if (!feature.lat || !feature.lon) return;
      initial.extend([feature.lon, feature.lat]);
    });
    return initial.isEmpty() ? null : initial;
  }, [features]);

  useEffect(() => {
    if (!containerRef.current || !center) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: [center.lng, center.lat],
        zoom: 12,
      });
      mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!features || features.length === 0) {
      mapRef.current.easeTo({
        center: center ? [center.lng, center.lat] : undefined,
        zoom: 11,
        duration: 300,
      });
      return;
    }

    features.forEach((feature) => {
      if (!feature.lat || !feature.lon) {
        return;
      }
      const marker = new maplibregl.Marker({
        color: detailMode ? '#ff7a45' : (onlyPoints ? '#00c08b' : '#2266ff'),
      })
        .setLngLat([feature.lon, feature.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(buildPopupContent({
            ...feature,
            geometryType: feature.geometryType ? feature.geometryType.replace(/^ST_/i, '').toLowerCase() : null,
          }))
        )
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    if (bounds) {
      mapRef.current.fitBounds(bounds, {
        padding: { top: 32, bottom: 32, left: 32, right: 32 },
        duration: 500,
      });
    } else if (center) {
      mapRef.current.easeTo({
        center: [center.lng, center.lat],
        zoom: 12,
        duration: 300,
      });
    }
  }, [features, center, bounds, onlyPoints, detailMode]);

  return <div ref={containerRef} className={styles.mapContainer} />;
}

