import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * ReferralPathwaysMap - Display referral sources on a map with connection lines
 * Uses GeoJSON sources for stable rendering
 */
export default function ReferralPathwaysMap({ facilities, inboundFacility }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!facilities || facilities.length === 0) return;

    // Helper to extract numeric value from BigQuery objects
    const getNumericValue = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'number') return val;
      if (val && val.value !== undefined) return Number(val.value);
      return Number(val);
    };

    // Filter facilities with valid coordinates
    const validFacilities = facilities.filter(f => {
      const lat = getNumericValue(f.latitude);
      const lng = getNumericValue(f.longitude);
      return lat && lng && !isNaN(lat) && !isNaN(lng);
    }).map(f => ({
      ...f,
      latitude: getNumericValue(f.latitude),
      longitude: getNumericValue(f.longitude)
    }));

    if (validFacilities.length === 0) return;

    // Get inbound facility coords
    const inboundLat = getNumericValue(inboundFacility?.latitude);
    const inboundLng = getNumericValue(inboundFacility?.longitude);
    const hasInbound = inboundLat && inboundLng && !isNaN(inboundLat) && !isNaN(inboundLng);

    // Initialize map
    if (!map.current) {
      const centerLat = hasInbound ? inboundLat : validFacilities[0].latitude;
      const centerLng = hasInbound ? inboundLng : validFacilities[0].longitude;

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
        center: [centerLng, centerLat],
        zoom: 10 // Start closer, fitBounds will adjust
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    // Wait for map to load before adding layers
    const addLayers = () => {
      if (!map.current.loaded()) {
        map.current.once('load', addLayers);
        return;
      }

      // Remove existing layers and sources if they exist
      ['connection-lines', 'outbound-facilities', 'inbound-facility'].forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });
      ['connections', 'outbound', 'inbound'].forEach(sourceId => {
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });

      // 1. Add connection lines (if inbound facility exists)
      if (hasInbound) {
        const lineFeatures = validFacilities.map(f => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [inboundLng, inboundLat],
              [f.longitude, f.latitude]
            ]
          },
          properties: {
            referrals: f.total_referrals || 0
          }
        }));

        map.current.addSource('connections', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: lineFeatures
          }
        });

        map.current.addLayer({
          id: 'connection-lines',
          type: 'line',
          source: 'connections',
          paint: {
            'line-color': '#667eea',
            'line-width': 1,
            'line-opacity': 0.4
          }
        });
      }

      // 2. Add outbound facilities (referral sources)
      const maxReferrals = Math.max(...validFacilities.map(f => f.total_referrals || 0));
      
      const outboundFeatures = validFacilities.map(f => {
        // Calculate size based on referral volume
        const referralRatio = (f.total_referrals || 0) / maxReferrals;
        const size = 10 + (referralRatio * 20); // 10px to 30px

        const formatNumber = (num) => num?.toLocaleString() || '0';
        const formatCurrency = (num) => {
          if (!num || isNaN(num)) return '-';
          return '$' + Math.round(num).toLocaleString();
        };

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [f.longitude, f.latitude]
          },
          properties: {
            name: f.definitive_name || f.outbound_facility_provider_name,
            npis: f.npis ? f.npis.join(', ') : (f.outbound_facility_provider_npi || ''),
            npiCount: f.npis ? f.npis.length : 1,
            city: f.outbound_facility_provider_city || '',
            state: f.outbound_facility_provider_state || '',
            distance: f.distance || 0,
            referrals: f.total_referrals || 0,
            charges: formatCurrency(f.total_charges),
            referralsFormatted: formatNumber(f.total_referrals),
            size: size
          }
        };
      });

      map.current.addSource('outbound', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: outboundFeatures
        }
      });

      map.current.addLayer({
        id: 'outbound-facilities',
        type: 'circle',
        source: 'outbound',
        paint: {
          'circle-radius': ['get', 'size'],
          'circle-color': '#667eea',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // 3. Add inbound facility (your facility) - green marker on top
      if (hasInbound) {
        map.current.addSource('inbound', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [inboundLng, inboundLat]
              },
              properties: {
                name: inboundFacility.name || 'Your Facility',
                npi: inboundFacility.npi
              }
            }]
          }
        });

        map.current.addLayer({
          id: 'inbound-facility',
          type: 'circle',
          source: 'inbound',
          paint: {
            'circle-radius': 12,
            'circle-color': '#10b981',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1
          }
        });

        // Add popup for inbound facility
        map.current.on('click', 'inbound-facility', (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { name, npi } = e.features[0].properties;

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div style="padding: 8px; min-width: 200px;">
                <strong style="color: #10b981;">Your Facility</strong>
                <div style="margin-top: 4px; font-size: 12px;">
                  ${name}
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #6b7280;">
                  NPI: ${npi}
                </div>
              </div>
            `)
            .addTo(map.current);
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'inbound-facility', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', 'inbound-facility', () => {
          map.current.getCanvas().style.cursor = '';
        });
      }

      // Add popups for outbound facilities
      map.current.on('click', 'outbound-facilities', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { name, npis, npiCount, city, state, distance, referralsFormatted, charges } = e.features[0].properties;

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 8px; min-width: 220px;">
              <strong style="color: #667eea;">${name}</strong>
              ${npiCount > 1 ? 
                `<div style="margin-top: 2px; font-size: 11px; color: #6b7280;">
                  ${npiCount} NPIs
                </div>` : 
                `<div style="margin-top: 2px; font-size: 11px; color: #6b7280;">
                  NPI: ${npis}
                </div>`
              }
              <div style="margin-top: 4px; font-size: 11px; color: #6b7280;">
                ${city}, ${state}
              </div>
              ${distance > 0 ? 
                `<div style="margin-top: 4px; font-size: 11px; color: #6b7280;">
                  ${distance} miles away
                </div>` : ''
              }
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 12px; color: #374151;">
                  <strong>${referralsFormatted}</strong> referrals
                </div>
                <div style="font-size: 12px; color: #374151; margin-top: 4px;">
                  ${charges} total charges
                </div>
              </div>
            </div>
          `)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'outbound-facilities', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'outbound-facilities', () => {
        map.current.getCanvas().style.cursor = '';
      });

      // Close popup on ESC key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          const popups = document.getElementsByClassName('maplibregl-popup');
          Array.from(popups).forEach(popup => popup.remove());
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      
      // Cleanup listener
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };

      // Fit map to show all markers
      const bounds = new maplibregl.LngLatBounds();
      
      if (hasInbound) {
        bounds.extend([inboundLng, inboundLat]);
      }
      
      validFacilities.forEach(f => {
        bounds.extend([f.longitude, f.latitude]);
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 12,
          duration: 800
        });
      }
    };

    // Call addLayers (will wait for map load if needed)
    addLayers();

  }, [facilities, inboundFacility]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
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
        height: '600px',
        borderRadius: '12px',
        overflow: 'hidden'
      }} 
    />
  );
}
