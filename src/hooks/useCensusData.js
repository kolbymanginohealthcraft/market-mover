import { useEffect, useState, useRef } from "react";
import { apiUrl } from '../utils/api';

/**
 * useCensusData
 *
 * Fetches American Community Survey (ACS) census data for a market defined by
 * center coordinates and radius. Supports both county and tract-level analysis.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @param {string} year - ACS year (defaults to '2023')
 * @returns {object} { data, loading, error, refetch }
 */
export default function useCensusData(provider, radiusInMiles, year = '2023', geography = 'tract') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchCensusData = async () => {
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

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        apiUrl(`/api/census-acs-api?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}&year=${year}&geography=${geography}`),
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=3600', // Cache for 1 hour
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch census data');
      }

      setData(result.data);
    } catch (err) {
      // Don't set error if request was cancelled
      if (err.name === 'AbortError') {
        return;
      }
      
      console.error("❌ Census data fetch error:", err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCensusData();

    // Cleanup function to cancel request when component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [provider?.latitude, provider?.longitude, radiusInMiles, year, geography]);

  const refetch = () => {
    fetchCensusData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}

/**
 * useAvailableCensusYears
 *
 * Fetches available ACS years from the public BigQuery dataset.
 *
 * @returns {object} { years, loading, error }
 */
export function useAvailableCensusYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchYears = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl('/api/census-data/available-years'), {
          headers: {
            'Cache-Control': 'max-age=86400', // Cache for 24 hours
          }
        });
        
        if (response.status === 404) {
          console.warn('⚠️ Available census years endpoint not found, using default year list');
          setYears(['2023']);
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch available years');
        }

        setYears(result.data);
      } catch (err) {
        console.error("❌ Available years fetch error:", err);
        setError(err.message);
        setYears([]);
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, []);

  return { years, loading, error };
} 