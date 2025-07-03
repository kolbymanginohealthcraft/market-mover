import { useEffect, useState } from "react";
import { apiUrl } from '../utils/api';

/**
 * useCensusData
 *
 * Fetches American Community Survey (ACS) census data for a market defined by
 * center coordinates and radius. Supports both county and tract-level analysis.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude)
 * @param {number} radiusInMiles - The market radius in miles
 * @param {string} year - ACS year (defaults to '2022')
 * @returns {object} { data, loading, error, refetch }
 */
export default function useCensusData(provider, radiusInMiles, year = '2022') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCensusData = async () => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/census-acs-api?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}&year=${year}`));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch census data');
      }

      setData(result.data);
    } catch (err) {
      console.error("❌ Census data fetch error:", err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCensusData();
  }, [provider?.latitude, provider?.longitude, radiusInMiles, year]);

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
        const response = await fetch(apiUrl('/api/census-data/available-years'));
        
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