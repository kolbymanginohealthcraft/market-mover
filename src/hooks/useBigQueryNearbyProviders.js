import { useState, useEffect } from 'react';

export default function useBigQueryNearbyProviders(provider, radiusInMiles) {
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [nearbyDhcCcns, setNearbyDhcCcns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNearbyProviders() {
      if (!provider || !provider.latitude || !provider.longitude || !radiusInMiles) {
        setNearbyProviders([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/org_dhc/nearby?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Filter out the main provider from the results
          const filteredProviders = result.data.filter(
            p => p.dhc !== provider.dhc
          );
          const providersWithDistance = filteredProviders.map(row => ({
            ...row,
            distance: typeof row.distance === 'number' ? row.distance : null
          }));
          setNearbyProviders(providersWithDistance);
          
          // Fetch CCNs for all nearby providers
          if (filteredProviders.length > 0) {
            const dhcIds = filteredProviders.map(p => p.dhc);
            const ccnResponse = await fetch('/api/ccns/by-dhc-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dhc_ids: dhcIds })
            });
            
            if (ccnResponse.ok) {
              const ccnResult = await ccnResponse.json();
              if (ccnResult.success) {
                setNearbyDhcCcns(ccnResult.data);
              }
            }
          }
        } else {
          throw new Error(result.error || 'Failed to fetch nearby providers');
        }
      } catch (err) {
        console.error('Error fetching nearby providers:', err);
        setError(err.message);
        setNearbyProviders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyProviders();
  }, [provider, radiusInMiles]);

  return {
    nearbyProviders,
    nearbyDhcCcns,
    loading,
    error,
    // For compatibility with existing code that expects 'filtered'
    filtered: nearbyProviders,
    ccns: nearbyDhcCcns
  };
} 