import { useEffect, useState } from "react";

export default function useProviderInfo(dhc) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/org_dhc?dhc=${dhc}`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setProvider(result.data);
        } else {
          setProvider(null);
          setError(result.error || 'Provider not found');
        }
      } catch (err) {
        console.error("🔍 useProviderInfo: error:", err);
        setProvider(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (dhc) fetchProvider();
  }, [dhc]);

  return { provider, loading, error };
}
