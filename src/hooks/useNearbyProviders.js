import { useEffect, useState } from "react";
import { supabase } from "../app/supabaseClient";

export default function useNearbyProviders(provider, radiusInMiles) {
  const [cached, setCached] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ccns, setCcns] = useState([]);

  useEffect(() => {
    if (!provider?.latitude || !provider?.longitude) return;

    const margin = 2;
    const [lat, lon] = [provider.latitude, provider.longitude];
    const { latitude: latMin, longitude: lonMin } = { latitude: lat - margin, longitude: lon - margin };
    const { latitude: latMax, longitude: lonMax } = { latitude: lat + margin, longitude: lon + margin };

    const fetch = async () => {
      const { data, error } = await supabase
        .from("org_dhc")
        .select("id, dhc, name, network, street, city, state, zip, latitude, longitude, type")
        .filter("latitude", "gte", latMin)
        .filter("latitude", "lte", latMax)
        .filter("longitude", "gte", lonMin)
        .filter("longitude", "lte", lonMax);

      if (error) return console.error("Nearby fetch error", error);

      const R = 3958.8;
      const distance = ([lat1, lon1], [lat2, lon2]) => {
        const toRad = (x) => (x * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const enriched = data.map((p) => ({
        ...p,
        distance: distance([lat, lon], [p.latitude, p.longitude]),
      }));

      setCached(enriched);
    };

    fetch();
  }, [provider]);

  useEffect(() => {
    const filtered = cached.filter((p) => p.distance <= radiusInMiles).sort((a, b) => a.distance - b.distance);
    setFiltered(filtered);

    const dhcIds = filtered.map((p) => p.dhc).filter(Boolean);
    if (dhcIds.length === 0) return;

    const fetchCCNs = async () => {
      const { data, error } = await supabase.rpc("get_ccns_for_market", { dhc_ids: dhcIds });
      if (error) console.error("get_ccns_for_market error", error);
      else setCcns(data || []);
    };

    fetchCCNs();
  }, [cached, radiusInMiles]);

  return { cached, filtered, ccns };
}
