import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './GeographyMap.module.css';
import { getColorForValue, formatMetricValue, getMetricLabel } from '../../../utils/demographicColors';
import { apiUrl } from '../../../utils/api';

export default function GeographyMap({ 
  center, 
  radius, 
  boundaryType = 'tracts',
  demographicMetric = null,
  useDemographics = false,
  showColors = true,
  hoveredBoundaryId = null,
  onDemographicStatsUpdate = null,
  onDemographicFeaturesUpdate = null
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demographicData, setDemographicData] = useState(null);
  const featuresData = useRef(null);

  const getBoundaryColor = useCallback((type) => {
    const colors = {
      tracts: '#4A90E2',
      zips: '#50C878',
      counties: '#9B59B6'
    };
    return colors[type] || colors.tracts;
  }, []);

  const getBoundaryOutlineColor = useCallback((type) => {
    const colors = {
      tracts: '#2E5C8A',
      zips: '#2E7D4E',
      counties: '#5D3570'
    };
    return colors[type] || colors.tracts;
  }, []);

  useEffect(() => {
    if (!center || !radius) {
      return;
    }

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

  // Handle hover highlighting from list using setPaintProperty
  useEffect(() => {
    if (!map.current || !map.current.getLayer('boundaries-fill')) {
      return;
    }

    const fillLayer = map.current.getLayer('boundaries-fill');
    if (!fillLayer) return;

    const hoverId = hoveredBoundaryId ? String(hoveredBoundaryId) : '';
    const isDemographic = useDemographics && demographicMetric;

    if (fillLayer.type === 'fill') {
      // For polygons (ZIPs, counties, or demographic tracts)
      map.current.setPaintProperty('boundaries-fill', 'fill-opacity', [
        'case',
        ['==', ['get', 'boundary_id'], hoverId],
        isDemographic ? 0.95 : 0.8,
        isDemographic ? 0.75 : 0.3
      ]);

      // Update outline layer for polygons
      if (map.current.getLayer('boundaries-outline')) {
        map.current.setPaintProperty('boundaries-outline', 'line-color', [
          'case',
          ['==', ['get', 'boundary_id'], hoverId],
          '#265947',
          isDemographic ? '#333333' : getBoundaryOutlineColor(boundaryType)
        ]);
        map.current.setPaintProperty('boundaries-outline', 'line-width', [
          'case',
          ['==', ['get', 'boundary_id'], hoverId],
          4,
          isDemographic ? 1.5 : 2
        ]);
      }
    } else if (fillLayer.type === 'circle') {
      // For points (census tracts as points)
      map.current.setPaintProperty('boundaries-fill', 'circle-stroke-width', [
        'case',
        ['==', ['get', 'boundary_id'], hoverId],
        4,
        isDemographic ? 1 : 2
      ]);
      map.current.setPaintProperty('boundaries-fill', 'circle-stroke-color', [
        'case',
        ['==', ['get', 'boundary_id'], hoverId],
        '#265947',
        isDemographic ? '#ffffff' : getBoundaryOutlineColor(boundaryType)
      ]);
    }
  }, [hoveredBoundaryId, boundaryType, useDemographics, demographicMetric, getBoundaryOutlineColor]);

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

      let geojson;
      let metadata = null;
      
      // Load demographic data or regular boundaries based on mode
      if (useDemographics && demographicMetric && boundaryType === 'tracts') {
        const params = new URLSearchParams({
          latitude: center.lat,
          longitude: center.lng,
          radius: radius,
          metric: demographicMetric,
          year: '2023'
        });

        const response = await fetch(apiUrl(`/api/market-geography/demographics-map?${params}`));
        
        if (!response.ok) {
          throw new Error('Failed to load demographic data');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to load demographic data');
        }
        
        const data = result.data;
        geojson = data;
        metadata = data.metadata;
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
        // Regular boundaries mode
        const params = new URLSearchParams({
          latitude: center.lat,
          longitude: center.lng,
          radius: radius,
          type: boundaryType
        });

        const response = await fetch(apiUrl(`/api/market-geography/boundaries?${params}`));
        
        if (!response.ok) {
          throw new Error('Failed to load boundary data');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to load boundary data');
        }
        geojson = result.data;
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

      // Add boundary polygons with IDs and boundary_id property for hover matching
      const geojsonWithIds = {
        ...geojson,
        features: geojson.features.map((feature, index) => {
          // Create a unique boundary_id based on boundary type
          let boundaryId = null;
          if (boundaryType === 'zips') {
            boundaryId = String(feature.properties.zip_code);
          } else if (boundaryType === 'tracts') {
            boundaryId = String(feature.properties.geo_id);
          } else if (boundaryType === 'counties') {
            // Use county_fips_code for uniqueness (handles independent cities like Fairfax City vs Fairfax County)
            boundaryId = `${feature.properties.state_fips_code || ''}_${feature.properties.county_fips_code || ''}`;
          }
          
          return {
            ...feature,
            id: index, // MapLibre requires numeric IDs
            properties: {
              ...feature.properties,
              boundary_id: boundaryId // Add boundary_id for hover matching
            }
          };
        })
      };
      
      // Store features data for hover effect
      featuresData.current = geojsonWithIds.features;
      
      const boundariesSource = {
        type: 'geojson',
        data: geojsonWithIds,
        promoteId: 'id' // Use the id field for feature-state
      };
      
      map.current.addSource('boundaries', boundariesSource);

      // Check if features are points or polygons
      const firstFeature = geojson.features[0];
      const isPoint = firstFeature && firstFeature.geometry.type === 'Point';

      // Determine colors based on demographics mode
      if (useDemographics && demographicMetric && metadata?.statistics?.breaks) {
        const breaks = metadata.statistics.breaks;
        
        // Build color expression based on showColors toggle
        let colorExpression;
        
        if (showColors) {
          // Build step expression for discrete color classes based on quantile breaks
          const stepPairs = [];
          for (let i = 0; i < breaks.length - 1; i++) {
            const midPoint = (breaks[i] + breaks[i + 1]) / 2;
            const color = getColorForValue(midPoint, breaks, demographicMetric);
            stepPairs.push(breaks[i + 1]);
            stepPairs.push(color);
          }

          const baseColor = getColorForValue(breaks[0], breaks, demographicMetric);

          colorExpression = [
            'case',
            ['!', ['get', 'has_data']],
            '#e0e0e0',
            [
              'step',
              ['get', 'metric_value'],
              baseColor,
              ...stepPairs
            ]
          ];
        } else {
          colorExpression = '#d0d0d0';
        }

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
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff'
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
              'fill-opacity': 0.75
            }
          });

          // Add clear borders to distinguish between tracts
          map.current.addLayer({
            id: 'boundaries-outline',
            type: 'line',
            source: 'boundaries',
            paint: {
              'line-color': '#333333',
              'line-width': 1.5,
              'line-opacity': 1
            }
          });
        }
        } else {
          // Regular boundary visualization (non-demographic)
          if (isPoint) {
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

      // Helper function to extract all coordinates from any geometry type
      const extractAllCoordinates = (geometry) => {
        const coords = [];
        
        if (!geometry || !geometry.coordinates) return coords;
        
        const processCoordinates = (coordsArray, depth = 0) => {
          if (Array.isArray(coordsArray)) {
            // Check if this is a coordinate pair [lng, lat]
            if (coordsArray.length >= 2 && 
                typeof coordsArray[0] === 'number' && 
                typeof coordsArray[1] === 'number') {
              coords.push(coordsArray);
            } else {
              // Recursively process nested arrays
              coordsArray.forEach(item => processCoordinates(item, depth + 1));
            }
          }
        };
        
        switch (geometry.type) {
          case 'Point':
            if (geometry.coordinates && geometry.coordinates.length >= 2) {
              coords.push(geometry.coordinates);
            }
            break;
          case 'LineString':
          case 'MultiPoint':
            processCoordinates(geometry.coordinates);
            break;
          case 'Polygon':
            // Include all rings (exterior and interior holes)
            geometry.coordinates.forEach(ring => {
              processCoordinates(ring);
            });
            break;
          case 'MultiPolygon':
            // Process each polygon, including all rings
            geometry.coordinates.forEach(polygon => {
              polygon.forEach(ring => {
                processCoordinates(ring);
              });
            });
            break;
          case 'MultiLineString':
            geometry.coordinates.forEach(lineString => {
              processCoordinates(lineString);
            });
            break;
          default:
            // Fallback: try to process coordinates anyway
            processCoordinates(geometry.coordinates);
        }
        
        return coords;
      };

      // Fit map bounds after source loads to ensure all data is available
      const fitBoundsToFeatures = () => {
        if (!map.current.getSource('boundaries') || !geojson.features || geojson.features.length === 0) {
          return;
        }

        // Ensure map has correct container dimensions
        if (map.current && mapContainer.current) {
          map.current.resize();
        }

        const bounds = new maplibregl.LngLatBounds();
        
        // Include ALL coordinates from ALL boundary polygons
        geojson.features.forEach(feature => {
          if (feature.geometry) {
            const allCoords = extractAllCoordinates(feature.geometry);
            allCoords.forEach(coord => {
              if (coord && coord.length >= 2) {
                bounds.extend([coord[0], coord[1]]);
              }
            });
          }
        });

        // Include market circle in bounds to ensure it's fully visible
        if (circleGeoJSON && circleGeoJSON.geometry) {
          const circleCoords = extractAllCoordinates(circleGeoJSON.geometry);
          circleCoords.forEach(coord => {
            if (coord && coord.length >= 2) {
              bounds.extend([coord[0], coord[1]]);
            }
          });
        }

        if (!bounds.isEmpty()) {
          // Calculate padding based on container dimensions for better fit
          const container = mapContainer.current;
          if (container) {
            const containerWidth = container.offsetWidth || container.clientWidth;
            const containerHeight = container.offsetHeight || container.clientHeight;
            
            // Use percentage-based padding (5% of container size) with minimum values
            // Increased padding to ensure all polygons extending beyond the circle are visible
            const paddingPercent = 0.05; // 5% for better visibility of edge polygons
            const minPadding = 30;
            const calculatedPadding = {
              top: Math.max(minPadding, Math.round(containerHeight * paddingPercent)),
              bottom: Math.max(minPadding, Math.round(containerHeight * paddingPercent)),
              left: Math.max(minPadding, Math.round(containerWidth * paddingPercent)),
              right: Math.max(minPadding, Math.round(containerWidth * paddingPercent))
            };

            map.current.fitBounds(bounds, {
              padding: calculatedPadding,
              maxZoom: 15,
              duration: 500
            });
          } else {
            // Fallback to fixed padding if container not available
            map.current.fitBounds(bounds, {
              padding: { top: 30, bottom: 30, left: 30, right: 30 },
              maxZoom: 15,
              duration: 500
            });
          }
        }
      };

      // Wait for source to load before fitting bounds
      // This ensures all features are processed, especially important for larger datasets
      const source = map.current.getSource('boundaries');
      let boundsFitted = false;
      
      // Function to fit bounds when ready (only once)
      const fitBoundsWhenReady = () => {
        if (boundsFitted || !source) return false;
        
        // Check if source is loaded and map container has dimensions
        if (source.loaded && source.loaded()) {
          const container = mapContainer.current;
          const hasDimensions = container && 
            (container.offsetWidth > 0 || container.clientWidth > 0) &&
            (container.offsetHeight > 0 || container.clientHeight > 0);
          
          if (hasDimensions) {
            // Use requestAnimationFrame to ensure map has rendered the source
            requestAnimationFrame(() => {
              if (!boundsFitted) {
                fitBoundsToFeatures();
                boundsFitted = true;
              }
            });
            return true;
          }
        }
        return false;
      };

      // Declare variables for cleanup
      let resizeObserver = null;
      let onDataLoad = null;
      let onIdle = null;

      // Cleanup function for event listeners
      const cleanup = () => {
        if (onDataLoad) map.current.off('data', onDataLoad);
        if (onIdle) map.current.off('idle', onIdle);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };

      // Wait for source data to load
      onDataLoad = (e) => {
        if (e.sourceId === 'boundaries' && e.isSourceLoaded && !boundsFitted) {
          if (fitBoundsWhenReady()) {
            cleanup();
          }
        }
      };
      
      // Wait for map to be idle (all rendering complete) and resized
      onIdle = () => {
        if (!boundsFitted) {
          // Ensure map is resized before fitting bounds
          if (map.current && mapContainer.current) {
            map.current.resize();
          }
          if (fitBoundsWhenReady()) {
            cleanup();
          }
        }
      };

      // Use ResizeObserver to watch for container size changes
      if (mapContainer.current && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          if (map.current && !boundsFitted) {
            map.current.resize();
            if (fitBoundsWhenReady()) {
              cleanup();
            }
          }
        });
        resizeObserver.observe(mapContainer.current);
      }

      // Try immediately if source is already loaded
      if (!fitBoundsWhenReady()) {
        map.current.on('data', onDataLoad);
        map.current.once('idle', onIdle);
        
        // Trigger resize check after a short delay to allow container to size
        setTimeout(() => {
          if (map.current && !boundsFitted) {
            map.current.resize();
            if (fitBoundsWhenReady()) {
              cleanup();
            }
          }
        }, 50);
        
        // Fallback: try after a delay if events don't fire
        setTimeout(() => {
          if (!boundsFitted) {
            if (map.current && mapContainer.current) {
              map.current.resize();
            }
            fitBoundsWhenReady();
            cleanup();
          }
        }, 300);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading boundaries:', err);
      setError(err.message);
      setLoading(false);
    }
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
