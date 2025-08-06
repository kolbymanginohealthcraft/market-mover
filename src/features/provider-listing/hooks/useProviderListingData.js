import { useState, useEffect, useMemo } from 'react';

export const useProviderListingData = (providers, provider) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Process and deduplicate providers
  const uniqueResults = useMemo(() => {
    if (!providers || !Array.isArray(providers)) return [];

    const seen = new Set();
    return providers.filter(p => {
      if (!p.dhc || seen.has(p.dhc)) return false;
      seen.add(p.dhc);
      return true;
    });
  }, [providers]);

  const providerCount = uniqueResults.length;

  useEffect(() => {
    if (providers) {
      setLoading(false);
    }
  }, [providers]);

  return {
    uniqueResults,
    providerCount,
    loading,
    error
  };
}; 