import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../utils/api';

export function useHCODensity(lat, lon, radius = 25) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!lat || !lon) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;

    const fetchHCODensity = async (isRetry = false) => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/hco-density?lat=${lat}&lon=${lon}&radius=${radius}${isRetry ? '&refresh=true' : ''}`;
        const response = await fetch(apiUrl(url));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Only update state if this is the latest request
          if (isMounted && requestIdRef.current === thisRequestId) {
            setData(result.data);
            setRetryCount(0); // Reset retry count on success
          }
        } else {
          throw new Error(result.error || 'Failed to fetch HCO density data');
        }
      } catch (err) {
        console.error('Error fetching HCO density:', err);
        if (isMounted && requestIdRef.current === thisRequestId) {
          setError(err.message);
        }
        // Retry once if this is not already a retry
        if (!isRetry && retryCount < 1) {
          console.log('Retrying HCO density fetch...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchHCODensity(true), 1000);
        }
      } finally {
        if (isMounted && requestIdRef.current === thisRequestId) {
          setLoading(false);
        }
      }
    };

    fetchHCODensity();
    return () => {
      isMounted = false;
    };
  }, [lat, lon, radius]);

  return { data, loading, error };
} 