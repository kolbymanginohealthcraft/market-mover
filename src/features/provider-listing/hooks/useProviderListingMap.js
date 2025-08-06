import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

export const useProviderListingMap = (provider, radiusInMiles, uniqueResults, ccnProviderIds, tags) => {
  const [mapReady, setMapReady] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const [layersAdded, setLayersAdded] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [popup, setPopup] = useState(null);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const layersTimeoutRef = useRef(null);

  // Check if container is ready
  useEffect(() => {
    if (mapContainer.current && !containerReady) {
      setTimeout(() => {
        setContainerReady(true);
      }, 100);
    }
  }, [mapContainer.current, containerReady]);

  // Fallback: Force container ready if container exists but state is stuck
  useEffect(() => {
    if (mapContainer.current && !containerReady && provider) {
      setTimeout(() => {
        setContainerReady(true);
      }, 200);
    }
  }, [mapContainer.current, containerReady, provider]);

  // Reset states when component unmounts or provider changes
  useEffect(() => {
    setContainerReady(false);
    setMapReady(false);
    setLayersReady(false);
    setLayersAdded(false);
    setDataReady(false);
    
    if (layersTimeoutRef.current) {
      clearTimeout(layersTimeoutRef.current);
    }
  }, [provider]);

  // Initialize map when container is ready
  useEffect(() => {
    if (!containerReady || !provider || map.current) return;

    console.log('🗺️ Initializing map');
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [provider.longitude, provider.latitude],
      zoom: 10
    });

    map.current.on('load', () => {
      console.log('🗺️ Map loaded');
      setMapReady(true);
    });

    map.current.on('style.load', () => {
      console.log('🗺️ Style loaded');
      setLayersReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [containerReady, provider]);

  // Set data ready when we have results
  useEffect(() => {
    if (uniqueResults && uniqueResults.length > 0) {
      setDataReady(true);
    }
  }, [uniqueResults]);

  // Add custom layers
  const addCustomLayers = useCallback(() => {
    if (!map.current || !provider || !uniqueResults) return;

    layersTimeoutRef.current = setTimeout(() => {
      try {
        const radiusInMeters = radiusInMiles * 1609.34;
        
        const createCircle = (center, radius) => {
          const points = [];
          const segments = 64;
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const lat = center[1] + (radius / 111320) * Math.cos(angle);
            const lng = center[0] + (radius / (111320 * Math.cos(center[1] * Math.PI / 180))) * Math.sin(angle);
            points.push([lng, lat]);
          }
          return points;
        };

        const radiusCircleGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [createCircle([provider.longitude, provider.latitude], radiusInMeters)]
          },
          properties: {}
        };

        // Create GeoJSON for providers
        const providerFeatures = uniqueResults
          .filter(p => p.dhc !== provider.dhc)
          .map(p => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [p.longitude, p.latitude]
            },
            properties: {
              id: p.dhc,
              name: p.name,
              type: p.type || 'Unknown',
              network: p.network,
              distance: p.distance,
              hasCCN: ccnProviderIds.has(p.dhc),
              tag: tags[p.dhc]
            }
          }));

        const providerGeoJSON = {
          type: 'FeatureCollection',
          features: providerFeatures
        };

        // Add radius circle
        map.current.addSource('radius-circle', {
          type: 'geojson',
          data: radiusCircleGeoJSON
        });

        map.current.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': 'rgba(0, 123, 255, 0.1)',
            'fill-opacity': 0.3
          }
        });

        map.current.addLayer({
          id: 'radius-circle-stroke',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': 'rgba(0, 123, 255, 0.3)',
            'line-width': 2
          }
        });

        // Add provider markers
        if (providerFeatures.length > 0) {
          map.current.addSource('providers', {
            type: 'geojson',
            data: providerGeoJSON
          });

          map.current.addLayer({
            id: 'providers',
            type: 'circle',
            source: 'providers',
            paint: {
              'circle-radius': [
                'case',
                ['boolean', ['get', 'hasCCN'], false], 6,
                4
              ],
              'circle-color': [
                'case',
                ['boolean', ['get', 'hasCCN'], false], '#4caf50',
                '#2196f3'
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-opacity': 0.8
            }
          });

          // Add click handler for provider markers
          map.current.on('click', 'providers', (e) => {
            if (e.features.length > 0) {
              const feature = e.features[0];
              const [longitude, latitude] = feature.geometry.coordinates;
              
              if (popup) popup.remove();
              
              const newPopup = new maplibregl.Popup({ offset: 25 })
                .setLngLat([longitude, latitude])
                .setHTML(`
                  <div style="padding: 8px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">
                      ${feature.properties.name}
                    </h4>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                      ${feature.properties.type}
                    </p>
                    ${feature.properties.network ? `
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                        Network: ${feature.properties.network}
                      </p>
                    ` : ''}
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      Distance: ${feature.properties.distance.toFixed(2)} miles
                    </p>
                  </div>
                `);
              
              newPopup.addTo(map.current);
              setPopup(newPopup);
            }
          });

          // Change cursor on hover
          map.current.on('mouseenter', 'providers', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'providers', () => {
            map.current.getCanvas().style.cursor = '';
          });
        }
        
        setLayersAdded(true);
      } catch (error) {
        console.error('🗺️ Error adding custom layers:', error);
      }
    }, 300);
  }, [layersReady, dataReady, provider, radiusInMiles, uniqueResults, ccnProviderIds, tags]);

  // Update layers when both map and data are ready
  useEffect(() => {
    if (layersReady && dataReady && !layersAdded) {
      addCustomLayers();
    }
  }, [layersReady, dataReady, layersAdded, addCustomLayers]);

  // Handle data updates (CCNs, tags) without causing initial jumping
  useEffect(() => {
    if (layersAdded && map.current && map.current.getSource('providers')) {
      const providerFeatures = uniqueResults
        .filter(p => p.dhc !== provider.dhc)
        .map(p => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.longitude, p.latitude]
          },
          properties: {
            id: p.dhc,
            name: p.name,
            type: p.type || 'Unknown',
            network: p.network,
            distance: p.distance,
            hasCCN: ccnProviderIds.has(p.dhc),
            tag: tags[p.dhc]
          }
        }));

      const providerGeoJSON = {
        type: 'FeatureCollection',
        features: providerFeatures
      };

      map.current.getSource('providers').setData(providerGeoJSON);
    }
  }, [layersAdded, uniqueResults, ccnProviderIds, tags, provider]);

  return {
    mapContainer,
    map,
    mapReady,
    containerReady,
    layersReady,
    layersAdded,
    dataReady,
    popup,
    setPopup,
    addCustomLayers
  };
}; 