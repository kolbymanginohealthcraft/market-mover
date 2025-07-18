import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../utils/api";

/**
 * useCMSEnrollmentData
 *
 * Fetches CMS enrollment data for all counties in a market area for multiple years (all months).
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @returns {object} { data, loading, error, latestYear, latestMonth, months, refetch }
 */
export default function useCMSEnrollmentData(provider, radiusInMiles) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestYear, setLatestYear] = useState(null);
  const [latestMonth, setLatestMonth] = useState(null);
  const [months, setMonths] = useState([]);
  const abortControllerRef = useRef(null);

  const fetchCMSEnrollmentData = async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) {
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

      // 2. Get available years
      const yearsResp = await fetch(apiUrl('/api/cms-enrollment-years'), {
        signal: abortControllerRef.current.signal
      });
      if (!yearsResp.ok) throw new Error(`Failed to fetch years: ${yearsResp.status}`);
      const yearsResult = await yearsResp.json();
      if (!yearsResult.success) throw new Error(yearsResult.error || 'Failed to fetch years');
      const years = yearsResult.data;
      const mostRecentYear = years && years.length > 0 ? years[0] : null;
      setLatestYear(mostRecentYear);
      if (!mostRecentYear) throw new Error('No available years');

      // 3. Fetch CMS enrollment data for multiple recent years (last 3 years)
      const yearsToFetch = years.slice(0, 3); // Get last 3 years
      let allData = [];
      
      for (const year of yearsToFetch) {
        const cmsResp = await fetch(apiUrl('/api/cms-enrollment'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fipsList, year }),
          signal: abortControllerRef.current.signal
        });
        if (!cmsResp.ok) throw new Error(`Failed to fetch CMS enrollment data for ${year}: ${cmsResp.status}`);
        const cmsResult = await cmsResp.json();
        if (!cmsResult.success) throw new Error(cmsResult.error || `Failed to fetch CMS enrollment data for ${year}`);
        allData.push(...cmsResult.data);
      }

      // Filter out 'Year' records to avoid December spikes
      const filteredData = allData.filter(record => record.month_raw !== 'Year');
      setData(filteredData);

      // Find the latest available month
      const monthsAvailable = Array.from(new Set((filteredData || []).map(r => r.month).filter(Boolean)));
      // Sort months as YYYY-MM (e.g., 2024-03)
      const monthSort = (a, b) => {
        if (!a || !b) return 0;
        const [ay, am] = a.split('-').map(Number);
        const [by, bm] = b.split('-').map(Number);
        return ay !== by ? ay - by : am - bm;
      };
      monthsAvailable.sort(monthSort);
      setMonths(monthsAvailable);
      setLatestMonth(monthsAvailable[monthsAvailable.length - 1]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSEnrollmentData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [provider?.latitude, provider?.longitude, radiusInMiles]);

  const refetch = () => {
    fetchCMSEnrollmentData();
  };

  return { data, loading, error, latestYear, latestMonth, months, refetch };
}

/**
 * useCMSEnrollmentYears
 *
 * Fetches available years from the CMS enrollment dataset.
 *
 * @returns {object} { data, loading, error, refetch }
 */
export function useCMSEnrollmentYears() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchCMSEnrollmentYears = async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(apiUrl('/api/cms-enrollment-years'), {
        signal: abortControllerRef.current.signal
      });
      if (!resp.ok) throw new Error(`Failed to fetch years: ${resp.status}`);
      const result = await resp.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch years');
      setData(result.data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSEnrollmentYears();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = () => {
    fetchCMSEnrollmentYears();
  };

  return { data, loading, error, refetch };
} 