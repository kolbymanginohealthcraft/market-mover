import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../utils/api";

/**
 * useCMSEnrollmentTrendData
 *
 * Fetches CMS enrollment data across multiple years for trend analysis.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @param {Array} years - Array of years to fetch data for
 * @returns {object} { data, loading, error, refetch }
 */
export default function useCMSEnrollmentTrendData(provider, radiusInMiles, years = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchCMSEnrollmentTrendData = async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles || !Array.isArray(years) || years.length === 0) {
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

      // 2. Fetch CMS enrollment data for all years in parallel
      const yearPromises = years.map(async (year) => {
        const cmsResp = await fetch(apiUrl('/api/cms-enrollment'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fipsList, year }),
          signal: abortControllerRef.current.signal
        });
        if (!cmsResp.ok) throw new Error(`Failed to fetch CMS enrollment data for ${year}: ${cmsResp.status}`);
        const cmsResult = await cmsResp.json();
        if (!cmsResult.success) throw new Error(cmsResult.error || `Failed to fetch CMS enrollment data for ${year}`);
        return cmsResult.data;
      });
      
      const yearResults = await Promise.all(yearPromises);
      const allData = yearResults.flat();

      setData(allData);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSEnrollmentTrendData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [provider?.latitude, provider?.longitude, radiusInMiles, years.join(',')]);

  const refetch = () => {
    fetchCMSEnrollmentTrendData();
  };

  return { data, loading, error, refetch };
} 