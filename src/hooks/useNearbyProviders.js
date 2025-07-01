import { useEffect, useState } from "react";

export default function useNearbyProviders(provider, radiusInMiles) {
  const [cached, setCached] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ccns, setCcns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!provider?.latitude || !provider?.longitude || !radiusInMiles) {
      setCached([]);
      setFiltered([]);
      setCcns([]);
      return;
    }

    const fetchNearbyProviders = async () => {
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
          setCached(filteredProviders);
        } else {
          throw new Error(result.error || 'Failed to fetch nearby providers');
        }
      } catch (err) {
        console.error("Nearby fetch error:", err);
        setError(err.message);
        setCached([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyProviders();
  }, [provider, radiusInMiles]);

  useEffect(() => {
    // Set filtered to cached since the API already filters by radius
    setFiltered(cached);

    const dhcIds = cached.map((p) => p.dhc).filter(Boolean);
    if (dhcIds.length === 0) {
      setCcns([]);
      return;
    }

    const fetchCCNs = async () => {
      try {
        const response = await fetch(`/api/org_ccn/by-dhc-ids?dhc_ids=${dhcIds.join(',')}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setCcns(result.data || []);
        } else {
          console.error("get_ccns_for_market error:", result.error);
          setCcns([]);
        }
      } catch (err) {
        console.error("get_ccns_for_market error:", err);
        setCcns([]);
      }
    };

    fetchCCNs();
  }, [cached]);

  return { cached, filtered, ccns, loading, error };
}
