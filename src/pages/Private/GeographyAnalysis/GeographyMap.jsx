import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './GeographyMap.module.css';
import { getColorForValue, formatMetricValue, getMetricLabel } from '../../../utils/demographicColors';

export default function GeographyMap({ 
  center, 
  radius, 
  boundaryType = 'tracts',
  demographicMetric = null,
  useDemographics = false,
  showColors = true,
  hoveredTractId = null,
  onDemographicStatsUpdate = null,
  onDemographicFeaturesUpdate = null
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demographicData, setDemographicData] = useState(null);
  const previousHoveredId = useRef(null);
  const featuresData = useRef(null);

  useEffect(() => {
    console.log('🔄 GeographyMap useEffect triggered', {
      hasCenter: !!center,
      hasRadius: !!radius,
      useDemographics,
      demographicMetric,
      boundaryType
    });
    
    if (!center || !radius) {
      console.log('⚠️ Missing center or radius, skipping');
      return;
    }

    // Initialize map
    if (!map.current) {
      console.log('🗺️ Initializing new map');
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
    } else {
      // Update map center and zoom when props change
      map.current.setCenter([center.lng, center.lat]);
      map.current.setZoom(getZoomLevel(radius));
    }

    // Load boundary data
    loadBoundaries();

    return () => {
      // Cleanup is handled when component unmounts completely
    };
  }, [center?.lat, center?.lng, radius, boundaryType, demographicMetric, useDemographics, showColors]);

  // Handle hover highlighting from list
  useEffect(() => {
    if (!map.current || !map.current.getSource('boundaries') || !featuresData.current) return;

    // Remove hover from previously hovered feature
    if (previousHoveredId.current !== null) {
      try {
        map.current.setFeatureState(
          { source: 'boundaries', id: previousHoveredId.current },
          { hover: false }
        );
      } catch (e) {
        console.warn('Could not remove hover state:', e);
      }
    }

    // Add hover to newly hovered feature
    if (hoveredTractId !== null && featuresData.current) {
      // Find the feature index by geo_id
      const featureIndex = featuresData.current.findIndex(
        f => f.properties.geo_id === hoveredTractId
      );
      
      if (featureIndex !== -1) {
        try {
          map.current.setFeatureState(
            { source: 'boundaries', id: featureIndex },
            { hover: true }
          );
          previousHoveredId.current = featureIndex;
        } catch (e) {
          console.warn('Could not set hover state:', e);
        }
      }
    } else {
      previousHoveredId.current = null;
    }
  }, [hoveredTractId]);

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

      console.log('🔍 loadBoundaries called with:', {
        useDemographics,
        demographicMetric,
        boundaryType,
        center,
        radius
      });

      let geojson;
      
      // Load demographic data or regular boundaries based on mode
      if (useDemographics && demographicMetric && boundaryType === 'tracts') {
        console.log('📊 Loading demographics data...');
        const params = new URLSearchParams({
          latitude: center.lat,
          longitude: center.lng,
          radius: radius,
          metric: demographicMetric,
          year: '2023'
        });

        console.log('🌐 Fetching:', `/api/market-geography/demographics-map?${params}`);
        const response = await fetch(`/api/market-geography/demographics-map?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to load demographic data');
        }

        const data = await response.json();
        console.log('✅ Demographics data received:', {
          featureCount: data.features?.length,
          metadata: data.metadata,
          sampleFeature: data.features?.[0]
        });
        
        geojson = data;
        setDemographicData(data.metadata);
        
        // Notify parent component of demographic stats
        if (onDemographicStatsUpdate && data.metadata) {
          onDemographicStatsUpdate(data.metadata);
        }
        
        // Notify parent component of demographic features for the list
        if (onDemographicFeaturesUpdate && data.features) {
          onDemographicFeaturesUpdate(data.features);
        }
      } else {
        console.log('🗺️ Loading regular boundaries (non-demographics mode)');
        // Regular boundaries mode
        const params = new URLSearchParams({
          latitude: center.lat,
          longitude: center.lng,
          radius: radius,
          type: boundaryType
        });

        console.log('🌐 Fetching:', `/api/market-geography/boundaries?${params}`);
        const response = await fetch(`/api/market-geography/boundaries?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to load boundary data');
        }

        geojson = await response.json();
        setDemographicData(null);
        
        // Clear demographic stats in parent
        if (onDemographicStatsUpdate) {
          onDemographicStatsUpdate(null);
        }
        
        // Clear demographic features in parent
        if (onDemographicFeaturesUpdate) {
          onDemographicFeaturesUpdate(null);
        }
      }

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
      if (map.current.getLayer('market-circle-fill')) {
        map.current.removeLayer('market-circle-fill');
      }
      if (map.current.getLayer('market-circle-border')) {
        map.current.removeLayer('market-circle-border');
      }
      if (map.current.getLayer('center-marker')) {
        map.current.removeLayer('center-marker');
      }
      if (map.current.getSource('market-circle')) {
        map.current.removeSource('market-circle');
      }
      if (map.current.getSource('center-marker')) {
        map.current.removeSource('center-marker');
      }

      // Add boundary polygons with feature IDs for feature-state
      // Add unique IDs to each feature for feature-state to work
      const geojsonWithIds = {
        ...geojson,
        features: geojson.features.map((feature, index) => ({
          ...feature,
          id: index // MapLibre requires numeric IDs
        }))
      };
      
      // Store features data for hover effect
      featuresData.current = geojsonWithIds.features;
      
      map.current.addSource('boundaries', {
        type: 'geojson',
        data: geojsonWithIds,
        promoteId: 'id' // Use the id field for feature-state
      });

      // Check if features are points or polygons
      const firstFeature = geojson.features[0];
      const isPoint = firstFeature && firstFeature.geometry.type === 'Point';

      // Determine colors based on demographics mode
      if (useDemographics && demographicMetric && demographicData?.statistics?.breaks) {
        const breaks = demographicData.statistics.breaks;
        
        console.log('🎨 Building color expression for metric:', demographicMetric);
        console.log('📊 Breaks:', breaks);
        console.log('📍 Features count:', geojson.features.length);
        console.log('📋 Sample feature properties:', geojson.features[0]?.properties);
        console.log('🎨 showColors:', showColors);
        
        // Build color expression based on showColors toggle
        let colorExpression;
        
        if (showColors) {
          // Build step expression for discrete color classes based on quantile breaks
          // Use step instead of interpolate for clearer class boundaries
          const stepPairs = [];
          for (let i = 0; i < breaks.length - 1; i++) {
            const midPoint = (breaks[i] + breaks[i + 1]) / 2;
            const color = getColorForValue(midPoint, breaks, demographicMetric);
            console.log(`🎨 Break ${i}: ${breaks[i]} - ${breaks[i + 1]} -> ${color}`);
            stepPairs.push(breaks[i + 1]); // The threshold value
            stepPairs.push(color); // The color to use when >= this threshold
          }

          const baseColor = getColorForValue(breaks[0], breaks, demographicMetric);
          console.log('🎨 Base color (lowest):', baseColor);
          console.log('🎨 Step pairs:', stepPairs);

          colorExpression = [
            'case',
            // Check if has_data is false or metric_value is null
            ['!', ['get', 'has_data']],
            '#e0e0e0', // No data color
            [
              'step',
              ['get', 'metric_value'],
              baseColor, // Base color for lowest values
              ...stepPairs
            ]
          ];
        } else {
          // When colors are off, use a single neutral color
          colorExpression = '#d0d0d0';
        }
        
        console.log('🎨 Final color expression:', JSON.stringify(colorExpression, null, 2));

        if (isPoint) {
          // For points, use circles with demographic colors
          map.current.addLayer({
            id: 'boundaries-fill',
            type: 'circle',
            source: 'boundaries',
            paint: {
              'circle-radius': 6,
              'circle-color': colorExpression,
              'circle-opacity': 0.8,
              'circle-stroke-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3, // Thicker stroke when hovered
                1
              ],
              'circle-stroke-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#FFD700', // Gold when hovered
                '#ffffff'
              ]
            }
          });
        } else {
          // For polygons, use fills with demographic colors
          map.current.addLayer({
            id: 'boundaries-fill',
            type: 'fill',
            source: 'boundaries',
            paint: {
              'fill-color': colorExpression,
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.95, // More opaque when hovered
                0.75
              ]
            }
          });

          // Add clear borders to distinguish between tracts
          map.current.addLayer({
            id: 'boundaries-outline',
            type: 'line',
            source: 'boundaries',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#FFD700', // Gold when hovered
                '#333333'
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3, // Thicker when hovered
                1.5
              ],
              'line-opacity': 1
            }
          });
        }
      } else {
        // Regular boundary visualization (non-demographic)
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
      }

      // Add market radius circle with consistent styling
      const radiusInMeters = radius * 1609.34;
      const circleGeoJSON = createCircle(center, radiusInMeters, 64);
      
      map.current.addSource('market-circle', {
        type: 'geojson',
        data: circleGeoJSON
      });

      // Add circle fill layer
      map.current.addLayer({
        id: 'market-circle-fill',
        type: 'fill',
        source: 'market-circle',
        paint: {
          'fill-color': '#1DADBE',
          'fill-opacity': 0.3
        }
      });

      // Add circle border layer
      map.current.addLayer({
        id: 'market-circle-border',
        type: 'line',
        source: 'market-circle',
        paint: {
          'line-color': '#1DADBE',
          'line-width': 2
        }
      });

      // Add center marker with consistent styling
      map.current.addSource('center-marker', {
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

      map.current.addLayer({
        id: 'center-marker',
        type: 'circle',
        source: 'center-marker',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 6,   // At zoom level 4 (national view), radius = 6
            8, 8,   // At zoom level 8, radius = 8
            12, 12, // At zoom level 12, radius = 12
            16, 16  // At zoom level 16 (very zoomed in), radius = 16
          ],
          'circle-color': '#1DADBE',
          'circle-stroke-color': 'white',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 1.5,  // At zoom level 4, stroke = 1.5
            8, 2,    // At zoom level 8, stroke = 2
            12, 2.5, // At zoom level 12, stroke = 2.5
            16, 3    // At zoom level 16, stroke = 3
          ]
        }
      });

      // Add popup on click
      map.current.on('click', 'boundaries-fill', (e) => {
        const properties = e.features[0].properties;
        let description = '';
        
        if (useDemographics && demographicMetric) {
          // Demographic popup
          description = `
            <div style="min-width: 200px;">
              <strong>${getMetricLabel(demographicMetric)}</strong><br/>
              <div style="font-size: 18px; font-weight: 600; color: #2c3e50; margin: 8px 0;">
                ${formatMetricValue(properties.metric_value, demographicMetric)}
              </div>
              <div style="font-size: 11px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                Census Tract: ${properties.geo_id || 'N/A'}<br/>
                Population: ${properties.total_population ? properties.total_population.toLocaleString() : 'N/A'}
              </div>
            </div>
          `;
        } else {
          // Regular boundary popup
          if (boundaryType === 'tracts') {
            description = `<strong>Census Tract</strong><br/>ID: ${properties.geo_id}`;
          } else if (boundaryType === 'zips') {
            const city = properties.city || properties.area_name || '';
            const state = properties.state_code || '';
            const details = [
              city ? `City: ${city}` : null,
              state ? `State: ${state}` : null
            ].filter(Boolean).join('<br/>');

            description = `
              <div style="min-width: 180px;">
                <strong>ZIP Code</strong><br/>
                <div style="font-size: 16px; font-weight: 600; color: #2c3e50; margin: 6px 0;">
                  ${properties.zip_code || 'N/A'}
                </div>
                ${details ? `<div style="font-size: 12px; color: #555;">${details}</div>` : ''}
              </div>
            `;
          } else if (boundaryType === 'counties') {
            description = `<strong>County</strong><br/>${properties.county_name}`;
          }
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

      console.log('✅ Boundaries loaded successfully');
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading boundaries:', err);
      console.error('Error stack:', err.stack);
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
