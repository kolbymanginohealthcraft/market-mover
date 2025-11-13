import { useEffect, useRef, useState } from 'react';
import styles from './PayerFootprintMap.module.css';

export default function PayerFootprintMap({ enrollmentData, parentOrg }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enrollmentData || !enrollmentData.length || !mapContainer.current) return;

    const initializeMap = async () => {
      try {
        if (typeof window.maplibregl === 'undefined') {
          const maplibreglModule = await import('maplibre-gl');
          await import('maplibre-gl/dist/maplibre-gl.css');
          window.maplibregl = maplibreglModule.default;
        }

        const maplibregl = window.maplibregl;

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
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 22
              }]
            },
            center: [-98.5795, 39.8283],
            zoom: 4,
            maxZoom: 18,
            minZoom: 3
          });

          map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

          map.current.on('load', async () => {
            await loadCountyBoundaries();
          });
        } else {
          await loadCountyBoundaries();
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setLoading(false);
      }
    };

    const loadCountyBoundaries = async () => {
      try {
        setLoading(true);
        setError(null);

        const fipsSet = new Set();
        const enrollmentByFips = new Map();

        enrollmentData.forEach(row => {
          if (row.fips) {
            fipsSet.add(row.fips);
            const current = enrollmentByFips.get(row.fips) || 0;
            enrollmentByFips.set(row.fips, current + (row.enrollment || 0));
          }
        });

        const fipsList = Array.from(fipsSet);
        if (fipsList.length === 0) {
          setLoading(false);
          return;
        }

        const enrollmentValues = Array.from(enrollmentByFips.values());
        const maxEnrollment = Math.max(...enrollmentValues, 1);
        const minEnrollment = Math.min(...enrollmentValues);

        const getColor = (enrollment) => {
          if (!enrollment || enrollment === 0) return '#f3f4f6';
          const normalized = (enrollment - minEnrollment) / (maxEnrollment - minEnrollment || 1);
          const intensity = Math.max(0.3, normalized);
          return `rgba(15, 118, 110, ${intensity})`;
        };

        const stateGroups = {};
        fipsList.forEach(fips => {
          const stateFips = fips.slice(0, 2);
          if (!stateGroups[stateFips]) {
            stateGroups[stateFips] = [];
          }
          stateGroups[stateFips].push(fips.slice(2));
        });

        const countyPromises = Object.entries(stateGroups).map(async ([stateFips, countyFipsList]) => {
          const countyParams = countyFipsList.map(fips => `countyFips=${fips}`).join('&');
          const response = await fetch(`/api/census-data/county-names?stateFips=${stateFips}&${countyParams}`);
          if (!response.ok) return [];
          const result = await response.json();
          return result.data || [];
        });

        const countyDataArrays = await Promise.all(countyPromises);
        const allCounties = countyDataArrays.flat();

        const stateGroupsForBoundaries = {};
        allCounties.forEach(county => {
          const stateFips = county.state_fips_code;
          if (!stateGroupsForBoundaries[stateFips]) {
            stateGroupsForBoundaries[stateFips] = [];
          }
          stateGroupsForBoundaries[stateFips].push({
            countyFips: county.county_fips_code,
            fullFips: `${stateFips}${county.county_fips_code}`,
            enrollment: enrollmentByFips.get(`${stateFips}${county.county_fips_code}`) || 0
          });
        });

        const boundaryPromises = Object.entries(stateGroupsForBoundaries).map(async ([stateFips, counties]) => {
          try {
            const countyFipsList = counties.map(c => c.countyFips);
            const countyParams = countyFipsList.map(fips => `countyFips=${fips}`).join('&');
            
            const response = await fetch(`/api/market-geography/boundaries?type=counties&latitude=39&longitude=-98&radius=2000`);
            if (!response.ok) return [];
            const result = await response.json();
            
            const features = (result.features || []).filter(f => {
              const props = f.properties;
              return props?.state_fips_code === stateFips && 
                     countyFipsList.includes(props?.county_fips_code);
            });
            
            return features.map(feature => {
              const county = counties.find(c => c.countyFips === feature.properties.county_fips_code);
              if (county) {
                feature.properties.enrollment = county.enrollment;
                feature.properties.color = getColor(county.enrollment);
              }
              return feature;
            });
          } catch (err) {
            console.error(`Error fetching boundaries for state ${stateFips}:`, err);
            return [];
          }
        });

        const featureArrays = await Promise.all(boundaryPromises);
        const features = featureArrays.flat().filter(Boolean);

        if (features.length === 0) {
          setLoading(false);
          return;
        }

        const geojson = {
          type: 'FeatureCollection',
          features
        };

        if (map.current.getSource('counties')) {
          map.current.getSource('counties').setData(geojson);
        } else {
          map.current.addSource('counties', {
            type: 'geojson',
            data: geojson
          });

          map.current.addLayer({
            id: 'counties-fill',
            type: 'fill',
            source: 'counties',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.6
            }
          });

          map.current.addLayer({
            id: 'counties-outline',
            type: 'line',
            source: 'counties',
            paint: {
              'line-color': '#0f766e',
              'line-width': 1,
              'line-opacity': 0.8
            }
          });

          map.current.on('mouseenter', 'counties-fill', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseleave', 'counties-fill', () => {
            map.current.getCanvas().style.cursor = '';
          });

          const popup = new maplibregl.Popup({ closeOnClick: false, closeButton: true });
          
          map.current.on('click', 'counties-fill', (e) => {
            const props = e.features[0].properties;
            const enrollment = props.enrollment || 0;
            popup.setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding: 8px;">
                  <strong>${props.county_name || 'Unknown County'}</strong><br/>
                  Enrollment: ${enrollment.toLocaleString()}
                </div>
              `)
              .addTo(map.current);
          });

          if (features.length > 0) {
            const bounds = features.reduce((bounds, feature) => {
              if (feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0];
                coords.forEach(coord => {
                  bounds.extend([coord[0], coord[1]]);
                });
              }
              return bounds;
            }, new maplibregl.LngLatBounds());

            map.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 8
            });
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading county boundaries:', err);
        setError('Failed to load county data');
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (err) {
          console.error('Error removing map:', err);
        }
        map.current = null;
      }
    };
  }, [enrollmentData, parentOrg]);

  if (error) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading map...</p>
        </div>
      )}
      <div ref={mapContainer} className={styles.map} />
    </div>
  );
}

