import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './SearchMap.module.css';

export const SearchMap = ({
  map,
  mapReady,
  selectedProvider,
  results,
  onProviderSelect
}) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already done
    if (!map && mapContainerRef.current) {
      const newMap = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4
      });

      newMap.on('load', () => {
        console.log('🗺️ Map loaded successfully');
      });

      newMap.on('error', (error) => {
        console.error('🗺️ Map error:', error);
      });
    }
  }, [map]);

  // Add markers for search results
  useEffect(() => {
    if (!map || !mapReady || !results.length) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each provider
    results.forEach(provider => {
      if (provider.latitude && provider.longitude) {
        const marker = new maplibregl.Marker({
          color: selectedProvider?.dhc === provider.dhc ? '#ff0000' : '#3b82f6'
        })
          .setLngLat([provider.longitude, provider.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <div class="map-popup">
                  <h3>${provider.name}</h3>
                  <p>${provider.type || 'Provider'}</p>
                  <p>${provider.city}, ${provider.state}</p>
                  <button onclick="window.selectProvider('${provider.dhc}')">View Details</button>
                </div>
              `)
          )
          .addTo(map);

        // Add click handler
        marker.getElement().addEventListener('click', () => {
          onProviderSelect(provider);
        });
      }
    });

    // Fit map to show all markers
    if (results.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      results.forEach(provider => {
        if (provider.latitude && provider.longitude) {
          bounds.extend([provider.longitude, provider.latitude]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [map, mapReady, results, selectedProvider, onProviderSelect]);

  return (
    <div className={styles.mapContainer}>
      <div className={styles.mapHeader}>
        <h3>Provider Locations</h3>
        {results.length > 0 && (
          <span className={styles.resultCount}>
            {results.length} providers found
          </span>
        )}
      </div>
      
      <div 
        ref={mapContainerRef} 
        className={styles.map}
        style={{ height: '400px' }}
      />
      
      {!mapReady && (
        <div className={styles.mapLoading}>
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
}; 