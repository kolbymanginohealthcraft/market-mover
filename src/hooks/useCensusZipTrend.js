import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/api';

export default function useCensusZipTrend(
  provider,
  radiusInMiles,
  startYear,
  endYear,
  enabled = true
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchTrend = useCallback(async () => {
    if (
      !enabled ||
      !provider?.latitude ||
      !provider?.longitude ||
      !radiusInMiles ||
      !startYear ||
      !endYear
    ) {
      setLoading(false);
      setError(null);
      if (!enabled) {
        setData(null);
      }
      return null;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = apiUrl(
        `/api/census-acs-zip-trend?lat=${provider.latitude}` +
        `&lon=${provider.longitude}` +
        `&radius=${radiusInMiles}` +
        `&startYear=${startYear}` +
        `&endYear=${endYear}`
      );

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=3600'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ZIP trend');
      }

      setData(result.data);
      return result.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.error('❌ ZIP trend fetch error:', err);
      setError(err.message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider?.latitude, provider?.longitude, radiusInMiles, startYear, endYear, enabled]);

  useEffect(() => {
    fetchTrend();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchTrend]);

  return {
    data,
    loading,
    error,
    refetch: fetchTrend
  };
}

