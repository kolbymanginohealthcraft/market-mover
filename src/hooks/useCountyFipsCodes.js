import { useState, useEffect, useRef } from "react";
import { apiUrl } from "../utils/api";

const countyFipsCache = new Map();

function getCacheKey(latitude, longitude, radius) {
  return `${latitude.toFixed(6)}_${longitude.toFixed(6)}_${radius}`;
}

/**
 * Shared hook to fetch county FIPS codes for a market area.
 * Caches results to avoid duplicate API calls.
 * 
 * @param {object} provider - Provider object with latitude, longitude
 * @param {number} radiusInMiles - Market radius in miles
 * @returns {object} { fipsList, loading, error }
 */
export default function useCountyFipsCodes(provider, radiusInMiles) {
  const [fipsList, setFipsList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) {
      setFipsList(null);
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(provider.latitude, provider.longitude, radiusInMiles);
    const cached = countyFipsCache.get(cacheKey);
    
    if (cached) {
      setFipsList(cached);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const fetchCountyFips = async () => {
      try {
        const boundariesResp = await fetch(
          apiUrl(`/api/market-geography/boundaries?latitude=${provider.latitude}&longitude=${provider.longitude}&radius=${radiusInMiles}&type=counties`),
          { signal: abortControllerRef.current.signal }
        );
        
        if (!boundariesResp.ok) {
          throw new Error(`Failed to fetch county boundaries: ${boundariesResp.status}`);
        }
        
        const result = await boundariesResp.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch county boundaries');
        }
        
        const boundariesGeoJson = result.data;
        
        if (!boundariesGeoJson.features || boundariesGeoJson.features.length === 0) {
          throw new Error('No counties found in market area');
        }
        
        const fipsSet = new Set();
        boundariesGeoJson.features.forEach(feature => {
          const countyFips = feature.properties?.county_fips_code;
          if (countyFips) {
            const countyFipsStr = String(countyFips);
            if (countyFipsStr.length === 5) {
              fipsSet.add(countyFipsStr);
            }
          }
        });
        
        const fipsArray = Array.from(fipsSet);
        
        if (fipsArray.length === 0) {
          throw new Error('No valid county FIPS codes found');
        }
        
        countyFipsCache.set(cacheKey, fipsArray);
        setFipsList(fipsArray);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setFipsList(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCountyFips();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [provider?.latitude, provider?.longitude, radiusInMiles]);

  return { fipsList, loading, error };
}

