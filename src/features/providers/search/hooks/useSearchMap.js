import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export const useSearchMap = () => {
  const [map, setMap] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const mapContainerRef = useRef(null);

  // Initialize map when selected provider changes and has valid coordinates
  useEffect(() => {
    try {
      console.log("🗺️ Map initialization effect triggered");
      console.log("Selected provider:", selectedProvider);
      console.log("Map container:", mapContainerRef.current);
      console.log("Map ready:", mapReady);
      
      // Clean up existing map if it exists
      if (map && typeof map.remove === 'function') {
        try {
          console.log("🗺️ Cleaning up existing map");
          map.remove();
        } catch (cleanupError) {
          console.warn("🗺️ Error cleaning up map:", cleanupError);
        }
      }

      // Initialize new map if we have a container and selected provider
      if (mapContainerRef.current && selectedProvider && selectedProvider.latitude && selectedProvider.longitude) {
        console.log("🗺️ Initializing new map");
        
        const newMap = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY',
          center: [selectedProvider.longitude, selectedProvider.latitude],
          zoom: 12
        });

        newMap.on('load', () => {
          console.log("🗺️ Map loaded successfully");
          setMapReady(true);
        });

        newMap.on('error', (error) => {
          console.error("🗺️ Map error:", error);
        });

        setMap(newMap);
      } else {
        console.log("🗺️ Skipping map initialization - missing requirements");
        setMapReady(false);
      }
    } catch (error) {
      console.error("🗺️ Map initialization error:", error);
      setMapReady(false);
    }
  }, [selectedProvider]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (map && typeof map.remove === 'function') {
        try {
          map.remove();
        } catch (error) {
          console.warn("🗺️ Error cleaning up map on unmount:", error);
        }
      }
    };
  }, [map]);

  const handleProviderSelect = (provider) => {
    console.log("🗺️ Provider selected:", provider);
    setSelectedProvider(provider);
  };

  return {
    map,
    mapReady,
    selectedProvider,
    setSelectedProvider,
    handleProviderSelect,
    mapContainerRef
  };
}; 