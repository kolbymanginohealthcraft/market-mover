import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../../utils/api';
import { sanitizeProviderName } from '../../../../utils/providerName';
import SimpleLocationMap from '../../../../components/Maps/SimpleLocationMap';
import MultiMarkerMap from '../../../../components/Maps/MultiMarkerMap';
import styles from './SimpleOverviewTab.module.css';

const EARTH_RADIUS_METERS = 6371000;

function createCircleFeature(center, radiusMiles, id) {
  const radiusMeters = radiusMiles * 1609.34;
  const centerLatRad = (center.lat * Math.PI) / 180;
  const centerLngRad = (center.lng * Math.PI) / 180;
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
  const points = [];
  const steps = 128;

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i * 2 * Math.PI) / steps;
    const sinLat = Math.sin(centerLatRad);
    const cosLat = Math.cos(centerLatRad);
    const sinAngular = Math.sin(angularDistance);
    const cosAngular = Math.cos(angularDistance);

    const latRad = Math.asin(
      sinLat * cosAngular + cosLat * sinAngular * Math.cos(bearing),
    );

    const lngRad =
      centerLngRad +
      Math.atan2(
        Math.sin(bearing) * sinAngular * cosLat,
        cosAngular - sinLat * Math.sin(latRad),
      );

    const lngDeg = ((lngRad * 180) / Math.PI + 540) % 360 - 180;
    const latDeg = (latRad * 180) / Math.PI;
    points.push([lngDeg, latDeg]);
  }

  return {
    type: 'Feature',
    properties: { radiusMiles: radiusMiles, id: id || radiusMiles },
    geometry: {
      type: 'Polygon',
      coordinates: [points],
    },
  };
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function calculateBearing(from, to) {
  if (!from || !to) return 0;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

export default function SimpleOverviewTab({ provider }) {
  const navigate = useNavigate();
  const [npis, setNpis] = useState([]);
  const [ccns, setCcns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countyDetails, setCountyDetails] = useState(undefined);
  const [zipDetails, setZipDetails] = useState(undefined);
  const [cbsaDetails, setCbsaDetails] = useState(null);
  const [cbsaAvailable, setCbsaAvailable] = useState(null);
  const [stateDetails, setStateDetails] = useState(undefined);
  const [placeDetails, setPlaceDetails] = useState(undefined);
  const [tractDetails, setTractDetails] = useState(undefined);
  const [mapFocus, setMapFocus] = useState('state');
  const [networkSiblings, setNetworkSiblings] = useState([]);
  const [networkSummary, setNetworkSummary] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState(null);
  const sanitizedProviderName = useMemo(
    () => sanitizeProviderName(provider?.name),
    [provider?.name]
  );
  const sanitizedNetwork = useMemo(
    () => sanitizeProviderName(provider?.network),
    [provider?.network]
  );

  useEffect(() => {
    let isSubscribed = true;

    async function fetchProviderIds() {
      if (!provider?.dhc) {
        if (isSubscribed) {
          setNpis([]);
          setCcns([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const payload = JSON.stringify({ dhc_ids: [provider.dhc] });

        const [npisResponse, ccnsResponse] = await Promise.all([
          fetch(apiUrl('/api/related-npis'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }),
          fetch(apiUrl('/api/related-ccns'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }),
        ]);

        let npisData = [];
        if (npisResponse.ok) {
          const npisResult = await npisResponse.json();
          if (npisResult.success && Array.isArray(npisResult.data)) {
            const unique = new Map();
            npisResult.data.forEach((item) => {
              if (!item?.npi) return;
              const npi = String(item.npi);
              const existing = unique.get(npi);
              const candidate = {
                npi,
                name: item.name ? String(item.name) : null,
                organizationName: item.organization_name ? String(item.organization_name) : null,
                is_primary: Boolean(item.is_primary),
                city: item.city ? String(item.city) : null,
                state: item.state ? String(item.state) : null,
              };

              if (!existing) {
                unique.set(npi, candidate);
                return;
              }

              if (!existing.is_primary && candidate.is_primary) {
                unique.set(npi, {
                  ...candidate,
                  name: candidate.name || existing.name,
                  organizationName: candidate.organizationName || existing.organizationName,
                });
                return;
              }

              if (!existing.name && candidate.name) {
                unique.set(npi, {
                  ...existing,
                  name: candidate.name,
                  is_primary: existing.is_primary || candidate.is_primary,
                  organizationName: existing.organizationName || candidate.organizationName,
                });
                return;
              }

              if (!existing.organizationName && candidate.organizationName) {
                unique.set(npi, {
                  ...existing,
                  organizationName: candidate.organizationName,
                  is_primary: existing.is_primary || candidate.is_primary,
                });
              }
            });
            npisData = Array.from(unique.values());
          }
        }

        let ccnsData = [];
        if (ccnsResponse.ok) {
          const ccnsResult = await ccnsResponse.json();
          if (ccnsResult.success && Array.isArray(ccnsResult.data)) {
            const map = new Map();
            ccnsResult.data.forEach((item) => {
              if (!item?.ccn) return;
              const ccn = String(item.ccn);
              const entry = map.get(ccn) || {
                dhc: item.dhc ? String(item.dhc) : null,
                ccn,
                npis: [],
                facilityName: null,
              };

              if (item.npi) {
                const npiString = String(item.npi);
                if (!entry.npis.includes(npiString)) {
                  entry.npis.push(npiString);
                }
              }

              map.set(ccn, entry);
            });

            const dedupedCcns = Array.from(map.values());
            const uniqueCcns = dedupedCcns.map((entry) => entry.ccn);

            if (uniqueCcns.length > 0) {
              try {
                const posResponse = await fetch(apiUrl('/api/provider-of-services'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filters: { PRVDR_NUM: uniqueCcns },
                    limit: uniqueCcns.length,
                  }),
                });

                if (posResponse.ok) {
                  const posResult = await posResponse.json();
                  if (posResult.success && Array.isArray(posResult.data)) {
                    const nameMap = new Map();
                    posResult.data.forEach((record) => {
                      if (!record?.PRVDR_NUM) return;
                      nameMap.set(String(record.PRVDR_NUM), record.FAC_NAME ? String(record.FAC_NAME) : null);
                    });

                    dedupedCcns.forEach((entry) => {
                      if (!entry.facilityName && nameMap.has(entry.ccn)) {
                        entry.facilityName = nameMap.get(entry.ccn);
                      }
                    });
                  }
                }
              } catch (nameError) {
                console.error('Error fetching CCN facility names:', nameError);
              }
            }

            ccnsData = dedupedCcns;
          }
        }

        if (isSubscribed) {
          setNpis(npisData);
          setCcns(ccnsData);
        }
      } catch (err) {
        console.error('Error fetching provider IDs:', err);
        if (isSubscribed) {
          setNpis([]);
          setCcns([]);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchProviderIds();

    return () => {
      isSubscribed = false;
    };
  }, [provider?.dhc]);

  if (!provider) {
    return <p className={styles.loadingFallback}>Loading provider data...</p>;
  }


  const formatLocation = (city, state) => {
    if (city && state) return `${city}, ${state}`;
    if (state) return state;
    if (city) return city;
    return null;
  };

  const latitude = provider?.latitude != null ? Number(provider.latitude) : null;
  const longitude = provider?.longitude != null ? Number(provider.longitude) : null;

  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapCenter = useMemo(() => {
    if (!hasCoordinates) return null;
    return { lat: latitude, lng: longitude };
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCounty() {
      if (!hasCoordinates) {
        if (isMounted) {
          setCountyDetails(null);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          type: 'counties',
          mode: 'point',
        });

        const response = await fetch(apiUrl(`/api/geographic-boundaries?${params.toString()}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch county: ${response.status}`);
        }

        const result = await response.json();
        if (!isMounted) return;
        const features = Array.isArray(result?.data?.features) ? result.data.features : [];
        const firstFeature =
          features.find((feature) => feature?.properties?.display_name || feature?.properties?.name) ||
          features[0] ||
          null;
        setCountyDetails(firstFeature);
      } catch (error) {
        console.error('Error fetching county name:', error);
        if (isMounted) {
          setCountyDetails(null);
        }
      }
    }

    fetchCounty();

    return () => {
      isMounted = false;
    };
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    let isActive = true;

    async function fetchStateBoundary() {
      if (!hasCoordinates) {
        if (isActive) {
          setStateDetails(null);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          type: 'states',
          mode: 'point',
        });
        const response = await fetch(apiUrl(`/api/geographic-boundaries?${params.toString()}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch state boundary: ${response.status}`);
        }

        const result = await response.json();
        if (!isActive) return;
        const features = Array.isArray(result?.data?.features) ? result.data.features : [];
        setStateDetails(features.find((feature) => feature?.geometry) || null);
      } catch (error) {
        console.error('Error fetching state boundary:', error);
        if (isActive) {
          setStateDetails(null);
        }
      }
    }

    fetchStateBoundary();

    return () => {
      isActive = false;
    };
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    let isActive = true;

    async function fetchPlaceBoundary() {
      if (!hasCoordinates) {
        if (isActive) {
          setPlaceDetails(null);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          type: 'places',
          mode: 'point',
        });
        const response = await fetch(apiUrl(`/api/geographic-boundaries?${params.toString()}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch place boundary: ${response.status}`);
        }

        const result = await response.json();
        if (!isActive) return;
        const features = Array.isArray(result?.data?.features) ? result.data.features : [];
        setPlaceDetails(features.find((feature) => feature?.geometry) || null);
      } catch (error) {
        console.error('Error fetching place boundary:', error);
        if (isActive) {
          setPlaceDetails(null);
        }
      }
    }

    fetchPlaceBoundary();

    return () => {
      isActive = false;
    };
  }, [hasCoordinates, latitude, longitude]);

  const addressLines = [
    provider.street ? String(provider.street) : null,
    [provider.city, provider.state, provider.zip].filter(Boolean).join(', ') || null,
  ].filter(Boolean);

  const headerSubtitleSegments = [
    provider.type ? String(provider.type) : null,
    sanitizedNetwork || (provider.network ? String(provider.network) : null),
  ].filter(Boolean);

  const formattedAddress = addressLines.join(' · ');
  const formattedPhone = provider.phone ? String(provider.phone) : null;

  const countyPolygons = useMemo(() => {
    if (!countyDetails || !countyDetails.geometry) return [];
    return [countyDetails];
  }, [countyDetails]);

  const statePolygons = useMemo(() => {
    if (!stateDetails || !stateDetails.geometry) return [];
    return [stateDetails];
  }, [stateDetails]);

  const placePolygons = useMemo(() => {
    if (!placeDetails || !placeDetails.geometry) return [];
    return [placeDetails];
  }, [placeDetails]);

  const tractPolygons = useMemo(() => {
    if (!tractDetails || !tractDetails.geometry) return [];
    return [tractDetails];
  }, [tractDetails]);

  const providerZipRaw = provider?.zip ? String(provider.zip) : null;
  const normalizedProviderZip = useMemo(() => {
    if (!providerZipRaw) return null;
    const match = providerZipRaw.match(/\d{5}/);
    return match ? match[0] : null;
  }, [providerZipRaw]);

  useEffect(() => {
    let isActive = true;

    async function fetchZipBoundary() {
      if (!hasCoordinates && !normalizedProviderZip) {
        if (isActive) {
          setZipDetails(null);
        }
        return;
      }

      try {
        let selectedFeature = null;

        if (hasCoordinates) {
          try {
            const pointParams = new URLSearchParams({
              lat: latitude.toString(),
              lon: longitude.toString(),
              type: 'zipcodes',
              mode: 'point',
            });

            const pointResponse = await fetch(apiUrl(`/api/geographic-boundaries?${pointParams.toString()}`));
            if (pointResponse.ok) {
              const pointResult = await pointResponse.json();
              const pointFeatures = Array.isArray(pointResult?.data?.features) ? pointResult.data.features : [];
              selectedFeature = pointFeatures.find((feature) => feature?.geometry) || null;
            } else {
              console.warn(`ZIP point lookup failed with status ${pointResponse.status}`);
            }
          } catch (pointError) {
            console.warn('ZIP point lookup error:', pointError);
          }
        }

        if (!selectedFeature && normalizedProviderZip) {
          const codeParams = new URLSearchParams({
            type: 'zipcodes',
            mode: 'code',
            zip: normalizedProviderZip,
          });

          const codeResponse = await fetch(apiUrl(`/api/geographic-boundaries?${codeParams.toString()}`));
          if (!codeResponse.ok) {
            throw new Error(`Failed to fetch zip boundary: ${codeResponse.status}`);
          }

          const codeResult = await codeResponse.json();
          const codeFeatures = Array.isArray(codeResult?.data?.features) ? codeResult.data.features : [];
          selectedFeature = codeFeatures.find((feature) => feature?.geometry) || null;
        }

        if (!isActive) return;
        setZipDetails(selectedFeature || null);
      } catch (error) {
        console.error('Error fetching zip boundary:', error);
        if (isActive) {
          setZipDetails(null);
        }
      }
    }

    fetchZipBoundary();

    return () => {
      isActive = false;
    };
  }, [hasCoordinates, latitude, longitude, normalizedProviderZip]);

  const zipPolygons = useMemo(() => {
    if (!zipDetails || !zipDetails.geometry) return [];
    return [zipDetails];
  }, [zipDetails]);

  useEffect(() => {
    let isActive = true;

    async function fetchTractBoundary() {
      if (!hasCoordinates) {
        if (isActive) {
          setTractDetails(null);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          type: 'tracts',
          mode: 'point',
        });
        const response = await fetch(apiUrl(`/api/geographic-boundaries?${params.toString()}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch tract boundary: ${response.status}`);
        }

        const result = await response.json();
        if (!isActive) return;

        const features = Array.isArray(result?.data?.features) ? result.data.features : [];
        setTractDetails(features.find((feature) => feature?.geometry) || null);
      } catch (error) {
        console.error('Error fetching tract boundary:', error);
        if (isActive) {
          setTractDetails(null);
        }
      }
    }

    fetchTractBoundary();

    return () => {
      isActive = false;
    };
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    let isActive = true;

    async function fetchNetworkSiblings() {
      if (!provider?.dhc && !provider?.npi) {
        if (isActive) {
          setNetworkSiblings([]);
          setNetworkSummary(null);
          setNetworkLoading(false);
        }
        return;
      }

      setNetworkLoading(true);

      try {
        const response = await fetch(apiUrl('/api/network-siblings'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dhc: provider.dhc,
            npi: provider.npi,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch network siblings: ${response.status}`);
        }

        const result = await response.json();
        if (!isActive) return;

        if (result.success) {
          setNetworkSiblings(result.data || []);
          setNetworkSummary(result.summary || null);
        } else {
          setNetworkSiblings([]);
          setNetworkSummary(null);
        }
      } catch (error) {
        console.error('Error fetching network siblings:', error);
        if (isActive) {
          setNetworkSiblings([]);
          setNetworkSummary(null);
        }
      } finally {
        if (isActive) {
          setNetworkLoading(false);
        }
      }
    }

    fetchNetworkSiblings();

    return () => {
      isActive = false;
    };
  }, [provider?.dhc, provider?.npi]);

  useEffect(() => {
    let isActive = true;

    async function fetchCbsaBoundary() {
      if (!hasCoordinates) {
        if (isActive) {
          setCbsaDetails(null);
          setCbsaAvailable(false);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lon: longitude.toString(),
          type: 'cbsa',
          mode: 'point',
        });

        const response = await fetch(apiUrl(`/api/geographic-boundaries?${params.toString()}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch CBSA boundary: ${response.status}`);
        }

        const result = await response.json();
        if (!isActive) return;

        const features = Array.isArray(result?.data?.features)
          ? result.data.features.filter((feature) => feature?.geometry)
          : [];
        const firstFeature = features[0] || null;
        setCbsaDetails(firstFeature);
        setCbsaAvailable(Boolean(firstFeature));
      } catch (error) {
        console.error('Error fetching CBSA boundary:', error);
        if (isActive) {
          setCbsaDetails(null);
          setCbsaAvailable(false);
        }
      }
    }

    fetchCbsaBoundary();

    return () => {
      isActive = false;
    };
  }, [hasCoordinates, latitude, longitude]);

  const cbsaPolygons = useMemo(() => {
    if (!cbsaDetails || !cbsaDetails.geometry) return [];
    return [cbsaDetails];
  }, [cbsaDetails]);

  const cbsaContainsLocation = cbsaDetails?.properties?.contains_point === true;

  const cbsaDistanceMiles = useMemo(() => {
    if (cbsaContainsLocation) return null;
    const meters = cbsaDetails?.properties?.distance_meters;
    if (typeof meters !== 'number' || !Number.isFinite(meters)) return null;
    return meters * 0.000621371;
  }, [cbsaDetails?.properties?.distance_meters, cbsaContainsLocation]);

  const cbsaCentroid = useMemo(() => {
    if (!cbsaDetails?.properties) return null;
    const lat = Number(cbsaDetails.properties.centroid_lat);
    const lng = Number(cbsaDetails.properties.centroid_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [cbsaDetails?.properties]);

  const cbsaConnectorLine = useMemo(() => {
    if (!mapCenter || !cbsaCentroid || cbsaContainsLocation) return [];
    return [
      {
        type: 'Feature',
        properties: { id: 'cbsa-connector' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [mapCenter.lng, mapCenter.lat],
            [cbsaCentroid.lng, cbsaCentroid.lat],
          ],
        },
      },
    ];
  }, [mapCenter, cbsaCentroid, cbsaContainsLocation]);

  const cbsaSecondaryMarker = useMemo(() => {
    if (!cbsaCentroid || !mapCenter || cbsaContainsLocation) return null;
    const labelParts = [
      cbsaDetails?.properties?.display_name || cbsaDetails?.properties?.name || 'Nearest CBSA',
    ];
    if (cbsaDistanceMiles != null) {
      labelParts.push(`${cbsaDistanceMiles.toFixed(1)} mi`);
    }
    return {
      position: cbsaCentroid,
      label: labelParts.join(' · '),
      type: 'point',
    };
  }, [
    cbsaCentroid,
    mapCenter,
    cbsaContainsLocation,
    cbsaDetails?.properties?.display_name,
    cbsaDetails?.properties?.name,
    cbsaDistanceMiles,
  ]);

  const radiusOverlays = useMemo(() => {
    if (!mapCenter) return [];
    const radii = [10, 20, 30];
    return radii.map((radiusMiles, index) => createCircleFeature(mapCenter, radiusMiles, `radius-${index}`));
  }, [mapCenter]);

  const focusStatus = useMemo(() => {
    const statusFor = (detail, polygons) => {
      if (detail === undefined) return 'loading';
      if (polygons.length > 0) return 'ready';
      return 'empty';
    };

    return {
      state: statusFor(stateDetails, statePolygons),
      county: statusFor(countyDetails, countyPolygons),
      place: statusFor(placeDetails, placePolygons),
      zip: zipDetails === undefined ? 'loading' : zipPolygons.length > 0 ? 'ready' : 'empty',
      tracts: statusFor(tractDetails, tractPolygons),
      cbsa:
        cbsaAvailable === null
          ? 'loading'
          : cbsaAvailable && cbsaPolygons.length > 0
          ? 'ready'
          : 'empty',
      radius: mapCenter ? 'ready' : 'empty',
    };
  }, [
    stateDetails,
    statePolygons,
    countyDetails,
    countyPolygons,
    placeDetails,
    placePolygons,
    zipDetails,
    zipPolygons,
    tractDetails,
    tractPolygons,
    cbsaAvailable,
    cbsaPolygons,
    mapCenter,
  ]);

  const focusAvailability = useMemo(() => {
    return {
      county: focusStatus.county === 'ready',
      place: focusStatus.place === 'ready',
      state: focusStatus.state === 'ready',
      zip: focusStatus.zip === 'ready',
      tracts: focusStatus.tracts === 'ready',
      cbsa: focusStatus.cbsa === 'ready',
      radius: focusStatus.radius === 'ready',
    };
  }, [focusStatus]);

  const preferredFocus = useMemo(() => {
    const currentStatus = focusStatus[mapFocus] || 'empty';
    if (currentStatus === 'loading' || currentStatus === 'ready') {
      return null;
    }

    const fallbackOrder = ['state', 'cbsa', 'county', 'place', 'zip', 'tracts', 'radius'];
    const nextFocus = fallbackOrder.find((key) => focusStatus[key] === 'ready');
    return nextFocus && nextFocus !== mapFocus ? nextFocus : null;
  }, [mapFocus, focusStatus]);

  useEffect(() => {
    if (preferredFocus) {
      setMapFocus(preferredFocus);
    }
  }, [preferredFocus]);

  const areAllContextsResolved = useMemo(() => {
    return Object.values(focusStatus).every((status) => status !== 'loading');
  }, [focusStatus]);

  const mapConfig = useMemo(() => {
    const countyProps = countyDetails?.properties || {};
    const countyLabel = countyProps.lsad_name || countyProps.display_name || countyProps.name || 'County';
    const cbsaProps = cbsaDetails?.properties || {};
    const cbsaLabel = cbsaProps.lsad_name || cbsaProps.display_name || cbsaProps.name || 'CBSA';
    const stateProps = stateDetails?.properties || {};
    const stateLabel =
      stateProps.display_name || stateProps.state_name || stateProps.state_abbreviation || 'State';
    const placeProps = placeDetails?.properties || {};
    const placeLabel = placeProps.place_name
      ? `${placeProps.place_name}${placeProps.state_name ? `, ${placeProps.state_name}` : ''}`
      : placeProps.display_name || placeProps.name || 'Place';
    const tractProps = tractDetails?.properties || {};
    const tractLabel =
      tractProps.lsad_name ||
      (tractProps.tract_ce ? `Census Tract ${tractProps.tract_ce}` : 'Census Tract');

    const zipLabel = normalizedProviderZip ? `ZIP ${normalizedProviderZip}` : 'ZIP Code';

    const placeholders = {
      county: countyLabel,
      zip: zipLabel,
      cbsa: cbsaLabel,
      state: stateLabel,
      place: placeLabel,
      tracts: tractLabel,
    };

    switch (mapFocus) {
      case 'zip': {
        const status = focusStatus.zip;
        return {
          label: placeholders.zip,
          status,
          polygons: [],
          polygonStyle: undefined,
          outlinePolygons: status === 'ready' ? zipPolygons : [],
          outlineStyle: {
            fillColor: '#4CC9F0',
            fillOpacity: 0.16,
            outlineColor: '#2B7A9D',
          },
          emptyMessage: 'ZIP boundary unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
      case 'radius': {
        const status = focusStatus.radius;
        return {
          label: '10 · 20 · 30 Mile Radius',
          status,
          polygons: [],
          polygonStyle: undefined,
          outlinePolygons: status === 'ready' ? radiusOverlays : [],
          outlineStyle: {
            fillColor: '#FFFFFF',
            fillOpacity: 0,
            outlineColor: '#0F62FE',
            outlineWidth: 2,
          },
          emptyMessage: 'Radius overlays unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
      case 'state': {
        const status = focusStatus.state;
        return {
          label: placeholders.state,
          status,
          polygons: status === 'ready' ? statePolygons : [],
          polygonStyle: {
            fillColor: '#6FCF97',
            fillOpacity: 0.18,
            outlineColor: '#219653',
            outlineWidth: 2,
          },
          outlinePolygons: [],
          outlineStyle: undefined,
          emptyMessage: 'State boundary unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
      case 'cbsa': {
        const status = focusStatus.cbsa;
        const distanceText = cbsaDistanceMiles != null ? `${cbsaDistanceMiles.toFixed(1)} mi away` : null;
        const cbsaLabel = cbsaContainsLocation
          ? placeholders.cbsa
          : `Nearest CBSA · ${placeholders.cbsa}${distanceText ? ` (${distanceText})` : ''}`;

        return {
          label: cbsaLabel,
          status,
          polygons: status === 'ready' ? cbsaPolygons : [],
          polygonStyle: {
            fillColor: '#B37CFF',
            fillOpacity: 0.18,
            outlineColor: '#6F4BD8',
          },
          outlinePolygons: [],
          outlineStyle: undefined,
          emptyMessage: 'CBSA boundary unavailable',
          lineFeatures: status === 'ready' ? cbsaConnectorLine : [],
          lineStyle: {
            color: '#FF6B6B',
            width: 3,
          },
          secondaryMarker: status === 'ready' ? cbsaSecondaryMarker : null,
        };
      }
      case 'county': {
        const status = focusStatus.county;
        return {
          label: placeholders.county,
          status,
          polygons: status === 'ready' ? countyPolygons : [],
          polygonStyle: undefined,
          outlinePolygons: [],
          outlineStyle: undefined,
          emptyMessage: 'County boundary unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
      case 'place': {
        const status = focusStatus.place;
        return {
          label: placeholders.place,
          status,
          polygons: status === 'ready' ? placePolygons : [],
          polygonStyle: {
            fillColor: '#56CCF2',
            fillOpacity: 0.18,
            outlineColor: '#2D9CDB',
            outlineWidth: 2,
          },
          outlinePolygons: [],
          outlineStyle: undefined,
          emptyMessage: 'Place boundary unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
      case 'tracts': {
        const status = focusStatus.tracts;
        return {
          label: placeholders.tracts,
          status,
          polygons: [],
          polygonStyle: undefined,
          outlinePolygons: status === 'ready' ? tractPolygons : [],
          outlineStyle: {
            fillColor: '#FFE66D',
            fillOpacity: 0.1,
            outlineColor: '#D89E00',
            outlineWidth: 1.5,
          },
          emptyMessage: 'Tract boundary unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
      default: {
        const status = focusStatus.state;
        return {
          label: placeholders.state,
          status,
          polygons: status === 'ready' ? statePolygons : [],
          polygonStyle: {
            fillColor: '#6FCF97',
            fillOpacity: 0.18,
            outlineColor: '#219653',
            outlineWidth: 2,
          },
          outlinePolygons: [],
          outlineStyle: undefined,
          emptyMessage: 'State boundary unavailable',
          lineFeatures: [],
          lineStyle: undefined,
          secondaryMarker: null,
        };
      }
    }
  }, [
    mapFocus,
    focusStatus,
    countyPolygons,
    zipPolygons,
    cbsaPolygons,
    cbsaAvailable,
    statePolygons,
    placePolygons,
    tractPolygons,
    countyDetails?.properties?.display_name,
    countyDetails?.properties?.name,
    countyDetails?.properties?.lsad_name,
    normalizedProviderZip,
    cbsaDetails?.properties?.name,
    cbsaDetails?.properties?.lsad_name,
    stateDetails?.properties?.display_name,
    stateDetails?.properties?.state_name,
    stateDetails?.properties?.state_abbreviation,
    placeDetails?.properties?.display_name,
    placeDetails?.properties?.name,
    tractDetails?.properties?.lsad_name,
    tractDetails?.properties?.tract_ce,
    radiusOverlays,
    cbsaDistanceMiles,
    cbsaContainsLocation,
    cbsaConnectorLine,
    cbsaSecondaryMarker,
  ]);

  const mapStatus = areAllContextsResolved ? mapConfig.status || 'ready' : 'loading';
  const isMapReady = mapStatus === 'ready';
  const isMapLoading = mapStatus === 'loading';
  const isMapEmpty = mapStatus === 'empty';
  const mapEmptyMessage = mapConfig.emptyMessage || 'Boundary unavailable';

  const filteredNetworkSiblings = useMemo(() => {
    if (!selectedProviderType) return networkSiblings;
    return networkSiblings.filter((sibling) => sibling.type === selectedProviderType);
  }, [networkSiblings, selectedProviderType]);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>{sanitizedProviderName || provider.name || 'Provider Overview'}</h1>
          {(formattedAddress || formattedPhone) && (
            <div className={styles.metaRow}>
              {formattedAddress && <span className={styles.metaValue}>{formattedAddress}</span>}
              {formattedPhone && <span className={styles.metaValue}>{formattedPhone}</span>}
            </div>
          )}
          {headerSubtitleSegments.length > 0 && (
            <p className={styles.subtitle}>
              {headerSubtitleSegments.map((segment, index) => (
                <span key={`${segment}-${index}`}>
                  {segment}
                  {index < headerSubtitleSegments.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      <div className={styles.content}>
        {hasCoordinates && (
          <section className={styles.mapSection}>
            <div className={styles.mapHeader}>
              <h2>Location Preview</h2>
            </div>
            <div className={styles.mapGrid}>
              <div className={styles.mapFrame}>
                <header className={styles.mapVariantTitle}>
                  Close View
                </header>
                <div className={styles.mapCanvas}>
                  <SimpleLocationMap
                    center={mapCenter}
                    markerLabel={sanitizedProviderName || provider.name || 'Provider'}
                    zoom={15}
                  />
                </div>
              </div>
              <div className={styles.mapFrame}>
                <header className={styles.mapVariantHeader}>
                  <span className={styles.mapVariantTitle}>Regional Context</span>
                  <div className={styles.mapToggle}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${mapFocus === 'state' ? styles.toggleActive : ''}`}
                      onClick={() => setMapFocus('state')}
                      disabled={focusStatus.state === 'empty'}
                    >
                      State
                    </button>
                    {cbsaAvailable !== false && (
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${mapFocus === 'cbsa' ? styles.toggleActive : ''}`}
                        onClick={() => setMapFocus('cbsa')}
                        disabled={focusStatus.cbsa !== 'ready'}
                      >
                        CBSA
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${mapFocus === 'county' ? styles.toggleActive : ''}`}
                      onClick={() => setMapFocus('county')}
                      disabled={focusStatus.county === 'empty'}
                    >
                      County
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${mapFocus === 'place' ? styles.toggleActive : ''}`}
                      onClick={() => setMapFocus('place')}
                      disabled={focusStatus.place === 'empty'}
                    >
                      Place
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${mapFocus === 'zip' ? styles.toggleActive : ''}`}
                      onClick={() => setMapFocus('zip')}
                    >
                      ZIP
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${mapFocus === 'tracts' ? styles.toggleActive : ''}`}
                      onClick={() => setMapFocus('tracts')}
                      disabled={focusStatus.tracts === 'empty'}
                    >
                      Tracts
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${mapFocus === 'radius' ? styles.toggleActive : ''}`}
                      onClick={() => setMapFocus('radius')}
                      disabled={focusStatus.radius !== 'ready'}
                    >
                      Radius
                    </button>
                  </div>
                </header>
                <div className={styles.mapCanvas}>
                  {isMapReady && (
                    <>
                      <header className={styles.overlayName}>
                        {mapConfig.label}
                      </header>
                      <SimpleLocationMap
                        center={mapCenter}
                        markerLabel={sanitizedProviderName || provider.name || 'Provider'}
                        zoom={8}
                        polygons={mapConfig.polygons}
                        outlinePolygons={mapConfig.outlinePolygons}
                        polygonStyle={mapConfig.polygonStyle}
                        outlineStyle={mapConfig.outlineStyle}
                        lineFeatures={mapConfig.lineFeatures}
                        lineStyle={mapConfig.lineStyle}
                        secondaryMarker={mapConfig.secondaryMarker}
                      />
                    </>
                  )}
                  {isMapLoading && (
                    <div className={`${styles.mapStatus} ${styles.mapLoading}`}>
                      Loading {mapConfig.label}…
                    </div>
                  )}
                  {isMapEmpty && (
                    <div className={`${styles.mapStatus} ${styles.mapEmpty}`}>
                      {mapEmptyMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className={styles.identifiersSection}>
          <header className={styles.identifiersHeader}>
            <h2>Key Identifiers</h2>
            <p>Cross-reference NPIs and CCNs tied to this location.</p>
          </header>

          <div className={styles.identifierGrid}>
            <article className={styles.identifierCard}>
              <h3>NPIs</h3>
              {loading ? (
                <div className={styles.identifierStatus}>Loading related NPIs…</div>
              ) : npis.length > 0 ? (
                <div className={styles.identifierList}>
                  {npis.map((item) => {
                    const location = formatLocation(item.city, item.state);
                    const displayName = item.name || item.organizationName || `NPI ${item.npi}`;
                    return (
                      <div key={item.npi} className={styles.identifierItem}>
                        <div className={styles.identifierHeading}>
                          <span className={styles.identifierName}>{displayName}</span>
                          {item.is_primary && <span className={styles.primaryBadge}>Primary</span>}
                        </div>
                        <div className={styles.identifierCode}>{item.npi}</div>
                        {location && <div className={styles.identifierMeta}>{location}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.identifierStatus}>No NPIs linked yet</div>
              )}
            </article>

            <article className={styles.identifierCard}>
              <h3>CCNs</h3>
              {loading ? (
                <div className={styles.identifierStatus}>Loading related CCNs…</div>
              ) : ccns.length > 0 ? (
                <div className={styles.identifierList}>
                  {ccns.map((item) => {
                    const linkedNpis = item.npis && item.npis.length > 0
                      ? item.npis.slice(0, 3).join(', ') + (item.npis.length > 3 ? '…' : '')
                      : null;
                    const totalBeds =
                      typeof item.totalBeds === 'number' && Number.isFinite(item.totalBeds)
                        ? item.totalBeds
                        : null;
                    const certifiedBeds =
                      typeof item.certifiedBeds === 'number' && Number.isFinite(item.certifiedBeds)
                        ? item.certifiedBeds
                        : null;

                    return (
                      <div key={item.ccn} className={styles.identifierItem}>
                        {item.facilityName && (
                          <div className={styles.identifierHeading}>
                            <span className={styles.identifierName}>{item.facilityName}</span>
                          </div>
                        )}
                        <div className={styles.identifierCode}>{item.ccn}</div>
                        {linkedNpis && (
                          <div className={styles.identifierMeta}>Linked NPIs: {linkedNpis}</div>
                        )}
                        {totalBeds !== null && (
                          <div className={styles.identifierMeta}>
                            Total Beds: {totalBeds.toLocaleString()}
                            {certifiedBeds !== null && certifiedBeds !== totalBeds
                              ? ` (${certifiedBeds.toLocaleString()} certified)`
                              : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.identifierStatus}>No CCNs linked yet</div>
              )}
            </article>
          </div>
        </section>

        {networkSummary && networkSummary.totalSiblings > 0 && (
          <section className={styles.mapSection}>
            <div className={styles.mapHeader}>
              <h2>Network Hierarchy</h2>
              <p>
                {networkSummary.totalSiblings} provider{networkSummary.totalSiblings !== 1 ? 's' : ''} sharing network, parent, or physician group relationships
              </p>
            </div>
            <div className={styles.mapGrid}>
              <div className={styles.mapFrame}>
                <header className={styles.mapVariantTitle}>
                  Network Siblings Map
                </header>
                <div className={styles.mapCanvas}>
                  {networkLoading ? (
                    <div className={`${styles.mapStatus} ${styles.mapLoading}`}>
                      Loading network siblings…
                    </div>
                  ) : filteredNetworkSiblings.length > 0 || networkSiblings.length > 0 ? (
                    <MultiMarkerMap
                      center={mapCenter || { lat: (filteredNetworkSiblings[0] || networkSiblings[0])?.latitude || 0, lng: (filteredNetworkSiblings[0] || networkSiblings[0])?.longitude || 0 }}
                      markers={[
                        ...(mapCenter ? [{
                          latitude: mapCenter.lat,
                          longitude: mapCenter.lng,
                          name: sanitizedProviderName || provider.name || 'Current Provider',
                        }] : []),
                        ...filteredNetworkSiblings.map((sibling) => ({
                          latitude: sibling.latitude,
                          longitude: sibling.longitude,
                          name: sibling.name || 'Provider',
                        })),
                      ]}
                      zoom={6}
                    />
                  ) : (
                    <div className={`${styles.mapStatus} ${styles.mapEmpty}`}>
                      No network siblings found
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.mapFrame}>
                <header className={styles.mapVariantTitle}>
                  Network Summary
                </header>
                <div className={styles.networkSummary}>
                  {networkSummary.networkName && (
                    <div className={styles.summaryItem}>
                      <div className={styles.summaryLabel}>Network</div>
                      <div className={styles.summaryValue}>{networkSummary.networkName}</div>
                    </div>
                  )}
                  {networkSummary.hospitalParentName && (
                    <div className={styles.summaryItem}>
                      <div className={styles.summaryLabel}>Hospital Parent</div>
                      <div className={styles.summaryValue}>{networkSummary.hospitalParentName}</div>
                    </div>
                  )}
                  {networkSummary.physicianGroupParentName && (
                    <div className={styles.summaryItem}>
                      <div className={styles.summaryLabel}>Physician Group Parent</div>
                      <div className={styles.summaryValue}>{networkSummary.physicianGroupParentName}</div>
                    </div>
                  )}
                  {networkSummary.providerTypes && networkSummary.providerTypes.length > 0 && (
                    <div className={styles.summaryItem}>
                      <div className={styles.summaryLabel}>Provider Types</div>
                      <div className={styles.typeList}>
                        {networkSummary.providerTypes.map((item) => {
                          const isSelected = selectedProviderType === item.type;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              className={`${styles.typeItem} ${isSelected ? styles.typeItemSelected : ''}`}
                              onClick={() => setSelectedProviderType(isSelected ? null : item.type)}
                            >
                              <span className={styles.typeName}>{item.type}</span>
                              <span className={styles.typeCount}>{item.count}</span>
                            </button>
                          );
                        })}
                      </div>
                      {selectedProviderType && (
                        <button
                          type="button"
                          className={styles.clearFilterButton}
                          onClick={() => setSelectedProviderType(null)}
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {networkSiblings.length > 0 && (
              <div className={styles.providerListing}>
                <header className={styles.providerListingHeader}>
                  <h3>Network Siblings</h3>
                  <p>
                    {selectedProviderType
                      ? `${filteredNetworkSiblings.length} of ${networkSiblings.length} provider${networkSiblings.length !== 1 ? 's' : ''} (filtered by ${selectedProviderType})`
                      : `${networkSiblings.length} provider${networkSiblings.length !== 1 ? 's' : ''} in network`}
                  </p>
                </header>
                <div className={styles.providerTableContainer}>
                  <table className={styles.providerTable}>
                    <thead>
                      <tr>
                        <th>Provider Name</th>
                        <th>Type</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNetworkSiblings.length > 0 ? (
                        filteredNetworkSiblings.map((sibling) => {
                          const location = formatLocation(sibling.city, sibling.state);
                          const sanitizedName = sanitizeProviderName(sibling.name);
                          return (
                            <tr key={sibling.dhc || sibling.npi}>
                              <td className={styles.providerTableName}>
                                {sanitizedName || 'Unknown Provider'}
                              </td>
                              <td className={styles.providerTableType}>
                                {sibling.type || '—'}
                              </td>
                              <td className={styles.providerTableLocation}>
                                {location || '—'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className={styles.providerTableEmpty}>
                            No providers match the selected filter
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}

