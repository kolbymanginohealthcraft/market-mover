import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./NearbyTab.module.css";


// Custom icons
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const selectedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

export default function NearbyTab({ provider }) {
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [radiusInMiles, setRadiusInMiles] = useState(10);
  const [selectedType, setSelectedType] = useState("All");
  const [availableTypes, setAvailableTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const cachedProviders = useRef(null);
  const navigate = useNavigate();

  const lat = provider.latitude;
  const lon = provider.longitude;
  console.log("Circle center:", lat, lon);

  const boundingboxmargin = 2;
  const latMin = lat - boundingboxmargin;
  const latMax = lat + boundingboxmargin;
  const lonMin = lon - boundingboxmargin;
  const lonMax = lon + boundingboxmargin;

  const haversineDistanceMiles = ([lat1, lon1], [lat2, lon2]) => {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchNearbyProviders = async () => {
      const { data, error } = await supabase
        .from("org-dhc")
        .select(
          "id, name, network, street, city, state, zip, latitude, longitude, type"
        )
        .order("id", { ascending: true })
        .filter("latitude", "gte", latMin)
        .filter("latitude", "lte", latMax)
        .filter("longitude", "gte", lonMin)
        .filter("longitude", "lte", lonMax);

      if (error) {
        console.error("Error fetching nearby providers:", error);
        setLoading(false);
        return;
      }

      const enrichedData = data.map((p) => ({
        ...p,
        distance: haversineDistanceMiles([lat, lon], [p.latitude, p.longitude]),
      }));

      const deduped = Array.from(
        new Map(enrichedData.map((p) => [p.id, p])).values()
      );

      const types = Array.from(
        new Set(deduped.map((p) => p.type || "Unknown"))
      ).sort();
      setAvailableTypes(types);

      cachedProviders.current = deduped;

      const filtered = deduped
        .filter((p) => p.distance <= radiusInMiles)
        .filter((p) => selectedType === "All" || p.type === selectedType)
        .sort((a, b) => a.distance - b.distance);

      setNearbyProviders(filtered);
      setLoading(false);
    };

    fetchNearbyProviders();
  }, [provider]);

  useEffect(() => {
    if (!cachedProviders.current) return;
    const filtered = cachedProviders.current
      .filter((p) => p.distance <= radiusInMiles)
      .filter((p) => selectedType === "All" || p.type === selectedType)
      .sort((a, b) => a.distance - b.distance);
    setNearbyProviders(filtered);
  }, [radiusInMiles, selectedType]);

  const filteredResults = nearbyProviders.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const providerCount = filteredResults.length.toLocaleString();

  if (loading || !provider)
    return <Spinner message="Loading nearby providers..." />;

  return (
    <div className={styles.container}>
      <div className={styles.controlsCompact}>
        <div className={styles.controlGroup}>
          <label>Radius ({radiusInMiles} mi)</label>
          <input
            type="range"
            min="1"
            max="100"
            value={radiusInMiles}
            onChange={(e) => setRadiusInMiles(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup} style={{ flexGrow: 1 }}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.providerCount}>
          Showing {providerCount} provider
          {filteredResults.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div
        className={styles.mapWrapper}
        style={{ height: "400px", marginBottom: "1rem" }}
      >
        <MapContainer
          center={[lat, lon]}
          zoom={10}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <Circle
            center={[lat, lon]}
            radius={radiusInMiles * 1609.34}
            pathOptions={{ color: "#d64550", weight: 2, fillOpacity: 0.15 }}
            eventHandlers={{
              add: (e) => console.log("Circle added", e.target),
              error: (e) => console.log("Circle error", e),
            }}
          >
            <Popup>Radius: {radiusInMiles} mi</Popup>
          </Circle>

          <Marker position={[lat, lon]} icon={selectedIcon}>
            <Popup>
              <strong>{provider.name}</strong>
              <br />Selected Provider
            </Popup>
          </Marker>

          {filteredResults.map(
            (p) =>
              p.id !== provider.id && (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>{p.name}</Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Name</th>
              <th style={{ width: "20%" }}>Network</th>
              <th style={{ width: "20%" }}>Address</th>
              <th style={{ width: "10%" }}>Type</th>
              <th style={{ width: "7%" }}>Distance</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((p) => (
              <tr
                key={p.id}
                className={`${p.id === provider.id ? styles.highlightedRow : ""} ${styles.clickableRow}`}
                onClick={() => navigate(`/app/provider/${p.id}/overview`)}
              >
                <td>{p.name}</td>
                <td>{p.network || "—"}</td>
                <td>{`${p.street}, ${p.city}, ${p.state} ${p.zip}`}</td>
                <td>{p.type || "Unknown"}</td>
                <td>{p.distance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
