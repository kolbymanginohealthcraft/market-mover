import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../utils/api";

/**
 * useMAEnrollmentData
 *
 * Fetches MA Enrollment, penetration, and plan/contract info for all counties in a market area.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @param {string} publishDate - Publish date (YYYY-MM-DD)
 * @returns {object} { data, loading, error, refetch }
 */
export default function useMAEnrollmentData(provider, radiusInMiles, publishDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchMAEnrollmentData = async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles || !publishDate) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // 1. Get county FIPS codes for the market area
      const fipsResp = await fetch(
        apiUrl(`/api/census-acs-api?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`),
        { signal: abortControllerRef.current.signal }
      );
      if (!fipsResp.ok) throw new Error(`Failed to fetch FIPS codes: ${fipsResp.status}`);
      const fipsResult = await fipsResp.json();
      if (!fipsResult.success) throw new Error(fipsResult.error || 'Failed to fetch FIPS codes');
      // Extract unique county FIPS codes from geographic_units
      const tracts = fipsResult.data?.geographic_units || [];
      const fipsSet = new Set();
      tracts.forEach(t => {
        if (t.state && t.county) {
          // FIPS is state + county code, zero-padded
          const fips = `${t.state.toString().padStart(2, '0')}${t.county.toString().padStart(3, '0')}`;
          fipsSet.add(fips);
        }
      });
      const fipsList = Array.from(fipsSet);
      if (fipsList.length === 0) throw new Error('No counties found in market area');

      // 2. Fetch MA Enrollment data for these FIPS codes and publish date
      const maResp = await fetch(apiUrl('/api/ma-enrollment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fipsList, publishDate }),
        signal: abortControllerRef.current.signal
      });
      if (!maResp.ok) throw new Error(`Failed to fetch MA Enrollment data: ${maResp.status}`);
      const maResult = await maResp.json();
      if (!maResult.success) throw new Error(maResult.error || 'Failed to fetch MA Enrollment data');
      setData(maResult.data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMAEnrollmentData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [provider?.latitude, provider?.longitude, radiusInMiles, publishDate]);

  const refetch = () => {
    fetchMAEnrollmentData();
  };

  return { data, loading, error, refetch };
} 