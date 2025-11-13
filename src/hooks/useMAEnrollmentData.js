import { useEffect, useState, useRef } from "react";
import { apiUrl } from "../utils/api";
import useCountyFipsCodes from "./useCountyFipsCodes";

/**
 * useMAEnrollmentData
 *
 * Fetches MA/PDP Enrollment, penetration, and plan/contract info for all counties in a market area.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @param {string} publishDate - Publish date (YYYY-MM-DD)
 * @param {string} type - Plan type: "MA", "PDP", or "ALL"
 * @returns {object} { data, loading, error, refetch }
 */
export default function useMAEnrollmentData(provider, radiusInMiles, publishDate, type = "ALL") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Get county FIPS codes using shared hook (cached)
  const { fipsList: countyFipsList, loading: fipsLoading, error: fipsError } = useCountyFipsCodes(provider, radiusInMiles);

  const fetchMAEnrollmentData = async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles || !publishDate) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Wait for county FIPS codes to be loaded
    if (fipsLoading || !countyFipsList) {
      setLoading(true);
      return;
    }

    if (fipsError) {
      setError(fipsError);
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
      const fipsList = countyFipsList;

      // Fetch MA/PDP Enrollment data for these FIPS codes and publish date
      const maResp = await fetch(apiUrl('/api/ma-enrollment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fipsList, publishDate, type }),
        signal: abortControllerRef.current.signal
      });
      if (!maResp.ok) throw new Error(`Failed to fetch enrollment data: ${maResp.status}`);
      const maResult = await maResp.json();
      if (!maResult.success) throw new Error(maResult.error || 'Failed to fetch enrollment data');
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
  }, [provider?.latitude, provider?.longitude, radiusInMiles, publishDate, type, countyFipsList, fipsLoading, fipsError]);

  const refetch = () => {
    fetchMAEnrollmentData();
  };

  return { data, loading, error, refetch };
}

/**
 * useMAEnrollmentTrendData
 *
 * Fetches MA/PDP Enrollment trend data over a date range for all counties in a market area.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} type - Plan type: "MA", "PDP", or "ALL"
 * @returns {object} { data, loading, error, refetch }
 */
export function useMAEnrollmentTrendData(provider, radiusInMiles, startDate, endDate, type = "ALL") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Get county FIPS codes using shared hook (cached)
  const { fipsList: countyFipsList, loading: fipsLoading, error: fipsError } = useCountyFipsCodes(provider, radiusInMiles);

  const fetchMAEnrollmentTrendData = async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles || !startDate || !endDate) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Wait for county FIPS codes to be loaded
    if (fipsLoading || !countyFipsList) {
      setLoading(true);
      return;
    }

    if (fipsError) {
      setError(fipsError);
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
      const fipsList = countyFipsList;

      // Fetch MA/PDP Enrollment trend data for these FIPS codes and date range
      const maResp = await fetch(apiUrl('/api/ma-enrollment-trend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fipsList, startDate, endDate, type }),
        signal: abortControllerRef.current.signal
      });
      if (!maResp.ok) throw new Error(`Failed to fetch enrollment trend data: ${maResp.status}`);
      const maResult = await maResp.json();
      if (!maResult.success) throw new Error(maResult.error || 'Failed to fetch enrollment trend data');
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
    fetchMAEnrollmentTrendData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [provider?.latitude, provider?.longitude, radiusInMiles, startDate, endDate, type, countyFipsList, fipsLoading, fipsError]);

  const refetch = () => {
    fetchMAEnrollmentTrendData();
  };

  return { data, loading, error, refetch };
}

/**
 * useNationwideMAEnrollmentData
 *
 * Fetches nationwide MA/PDP Enrollment data for a specific parent organization.
 *
 * @param {string} parentOrg - The parent organization name
 * @param {string} publishDate - Publish date (YYYY-MM-DD)
 * @param {string} type - Plan type: "MA", "PDP", or "ALL"
 * @returns {object} { data, loading, error, refetch }
 */
export function useNationwideMAEnrollmentData(parentOrg, publishDate, type = "ALL") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchNationwideMAEnrollmentData = async () => {
    if (!parentOrg || !publishDate) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const maResp = await fetch(apiUrl('/api/ma-enrollment-by-org'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentOrg, publishDate, type }),
        signal: abortControllerRef.current.signal
      });
      if (!maResp.ok) throw new Error(`Failed to fetch nationwide enrollment data: ${maResp.status}`);
      const maResult = await maResp.json();
      if (!maResult.success) throw new Error(maResult.error || 'Failed to fetch nationwide enrollment data');
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
    fetchNationwideMAEnrollmentData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [parentOrg, publishDate, type]);

  const refetch = () => {
    fetchNationwideMAEnrollmentData();
  };

  return { data, loading, error, refetch };
}

/**
 * useNationwideMAEnrollmentTrendData
 *
 * Fetches nationwide MA/PDP Enrollment trend data for a specific parent organization.
 *
 * @param {string} parentOrg - The parent organization name
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} type - Plan type: "MA", "PDP", or "ALL"
 * @returns {object} { data, loading, error, refetch }
 */
export function useNationwideMAEnrollmentTrendData(parentOrg, startDate, endDate, type = "ALL") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchNationwideMAEnrollmentTrendData = async () => {
    if (!parentOrg || !startDate || !endDate) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const maResp = await fetch(apiUrl('/api/ma-enrollment-trend-by-org'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentOrg, startDate, endDate, type }),
        signal: abortControllerRef.current.signal
      });
      if (!maResp.ok) throw new Error(`Failed to fetch nationwide enrollment trend data: ${maResp.status}`);
      const maResult = await maResp.json();
      if (!maResult.success) throw new Error(maResult.error || 'Failed to fetch nationwide enrollment trend data');
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
    fetchNationwideMAEnrollmentTrendData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [parentOrg, startDate, endDate, type]);

  const refetch = () => {
    fetchNationwideMAEnrollmentTrendData();
  };

  return { data, loading, error, refetch };
} 