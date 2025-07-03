import { useState, useEffect } from 'react';

export function useProviderDensity(lat, lon, radius = 25) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lon) {
      setData(null);
      setError(null);
      return;
    }

    const fetchProviderDensity = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/provider-density?lat=${lat}&lon=${lon}&radius=${radius}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch provider density data');
        }
      } catch (err) {
        console.error('Error fetching provider density:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderDensity();
  }, [lat, lon, radius]);

  return { data, loading, error };
}

export function useProviderDensityDetails(lat, lon, radius = 25, specialty = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lon) {
      setData(null);
      setError(null);
      return;
    }

    const fetchProviderDensityDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/api/provider-density-details?lat=${lat}&lon=${lon}&radius=${radius}`;
        if (specialty) {
          url += `&specialty=${encodeURIComponent(specialty)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch provider density details');
        }
      } catch (err) {
        console.error('Error fetching provider density details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderDensityDetails();
  }, [lat, lon, radius, specialty]);

  return { data, loading, error };
} 