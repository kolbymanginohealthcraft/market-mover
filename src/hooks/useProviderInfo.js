import { useEffect, useState } from "react";
import { supabase } from "../app/supabaseClient";

export default function useProviderInfo(id) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("org_dhc")
        .select("id, dhc, name, network, type, street, city, state, zip, phone, latitude, longitude")
        .eq("id", id)
        .single();

      if (!error && data) {
        setProvider(data);
      } else {
        console.error("❌ Provider not found", error);
      }
      setLoading(false);
    };

    fetchProvider();
  }, [id]);

  return { provider, loading };
}
