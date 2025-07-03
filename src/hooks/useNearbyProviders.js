import { useEffect, useState } from "react";
import { apiUrl } from '../utils/api';

/**
 * useNearbyProviders
 *
 * Fetches providers within a radius of a given provider's lat/lon,
 * and then fetches related CCNs for those providers.
 *
 * @param {object} provider - The main provider object (must have latitude, longitude, dhc)
 * @param {number} radiusInMiles - The search radius in miles
 * @returns {object} { providers, ccns, loading, error }
 */
export default function useNearbyProviders(provider, radiusInMiles) {
  const [providers, setProviders] = useState([]);
  const [ccns, setCcns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) {
      setProviders([]);
      setCcns([]);
      return;
    }

    const fetchNearbyAndCcns = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Fetching nearby providers for:', provider.dhc, 'at', provider.latitude, provider.longitude, 'radius:', radiusInMiles);
        
        // Fetch nearby providers using the correct endpoint and parameters
        const response = await fetch(apiUrl(`/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`));
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch nearby providers');
        
        console.log('✅ Nearby providers fetched:', result.data?.length || 0, 'providers');
        
        // Filter out the main provider from the results
        const filteredProviders = result.data.filter(p => p.dhc !== provider.dhc);
        setProviders(filteredProviders);

        // Fetch CCNs for nearby providers if any
        const dhcIds = filteredProviders.map(p => p.dhc).filter(Boolean);
        if (dhcIds.length === 0) {
          setCcns([]);
        } else {
          console.log('🔍 Fetching CCNs for', dhcIds.length, 'providers');
          const ccnResponse = await fetch(apiUrl('/api/related-ccns'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: dhcIds })
          });
          if (!ccnResponse.ok) throw new Error(`HTTP error! status: ${ccnResponse.status}`);
          const ccnResult = await ccnResponse.json();
          if (ccnResult.success) {
            setCcns(ccnResult.data || []);
            console.log('✅ CCNs fetched:', ccnResult.data?.length || 0, 'CCNs');
          } else {
            setCcns([]);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching nearby providers:', err);
        setError(err.message);
        setProviders([]);
        setCcns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyAndCcns();
  }, [provider, radiusInMiles]);

  return { providers, ccns, loading, error };
}
