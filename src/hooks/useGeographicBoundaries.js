import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../utils/api';

/**
 * Hook to fetch geographic boundaries (census tracts, counties, zip codes)
 * @param {Object} centerPoint - {latitude, longitude}
 * @param {number} radiusInMiles - Radius in miles
 * @param {string} type - 'tracts', 'counties', or 'zipcodes'
 * @returns {Object} {data, loading, error, refetch}
 */
export default function useGeographicBoundaries(centerPoint, radiusInMiles, type) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoundaries = useCallback(async () => {
    if (!centerPoint?.latitude || !centerPoint?.longitude || !radiusInMiles || !type) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching ${type} boundaries for radius:`, radiusInMiles);
      const response = await fetch(
        apiUrl(`/api/geographic-boundaries?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&radius=${radiusInMiles}&type=${type}`)
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        console.log(`✅ ${type} boundaries fetched:`, result.data?.features?.length || 0, 'features');
      } else {
        throw new Error(result.error || `Failed to fetch ${type} boundaries`);
      }
    } catch (err) {
      console.error(`Error fetching ${type} boundaries:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [centerPoint?.latitude, centerPoint?.longitude, radiusInMiles, type]);

  useEffect(() => {
    fetchBoundaries();
  }, [fetchBoundaries]);

  return {
    data,
    loading,
    error,
    refetch: fetchBoundaries
  };
}
