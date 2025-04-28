import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import styles from "./NearbyTab.module.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [20, 30],
  iconAnchor: [10, 30],
  popupAnchor: [1, -30],
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

export default function NearbyTab({
  provider,
  radiusInMiles,
  providers,
  isInSavedMarket,
}) {
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState({});
  const [taggingProviderId, setTaggingProviderId] = useState(null);
  const [savingTagId, setSavingTagId] = useState(null);
  const navigate = useNavigate();

  const marketId = new URLSearchParams(window.location.search).get("marketId");

  const fetchTags = async () => {
    if (!marketId) return;
    const { data, error } = await supabase
      .from("market_provider_tags")
      .select("tagged_provider_id, tag_type")
      .eq("market_id", marketId);

    if (data) {
      const tagMap = {};
      data.forEach((tag) => {
        tagMap[tag.tagged_provider_id] = tag.tag_type;
      });
      setTags(tagMap);
    } else if (error) {
      console.error("Error fetching tags:", error);
    }
  };

  // Fetch tags initially
  useState(() => {
    if (isInSavedMarket) {
      fetchTags();
    }
  }, []);

  if (!providers || !provider)
    return <Spinner message="Loading nearby providers..." />;

  const availableTypes = Array.from(
    new Set(providers.map((p) => p.type || "Unknown"))
  ).sort();

  const filteredResults = providers
    .filter((p) => selectedType === "All" || p.type === selectedType)
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.distance - b.distance);

  const providerCount = filteredResults.length.toLocaleString();

  const handleTag = async (providerId, tagType) => {
    if (!isInSavedMarket || !marketId) return;

    try {
      setSavingTagId(providerId);

      const { error } = await supabase.from("market_provider_tags").upsert(
        {
          market_id: marketId,
          tagged_provider_id: providerId,
          tag_type: tagType,
        },
        { onConflict: ["market_id", "tagged_provider_id"] }
      );

      if (error) {
        console.error("Error tagging provider:", error);
        return;
      }

      setTags((prev) => ({ ...prev, [providerId]: tagType }));
      setTaggingProviderId(null);

      setTimeout(() => {
        setSavingTagId(null);
      }, 500);
    } catch (err) {
      console.error("Unexpected tagging error:", err);
    }
  };

  const lat = provider.latitude;
  const lon = provider.longitude;

  return (
    <div className={styles.container}>
      <div className={styles.controlsRow}>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={styles.select}
        >
          <option value="All">All Types</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.providerCount}>
          Showing {providerCount} provider{filteredResults.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className={styles.splitView}>
        <div className={styles.mapPanel}>
          <MapContainer
            center={[lat, lon]}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={[lat, lon]} icon={selectedIcon}>
              <Popup>
                <strong>{provider.name}</strong>
                <br />
                Selected Provider
              </Popup>
            </Marker>
            {filteredResults.map((p) =>
              p.id !== provider.id ? (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>{p.name}</Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Network</th>
                <th>Address</th>
                <th>Type</th>
                <th>Distance</th>
                {isInSavedMarket && <th>Tag</th>}
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((p) => (
                <tr
                  key={p.id}
                  className={`${styles.clickableRow} ${
                    p.id === provider.id ? styles.highlightedRow : ""
                  }`}
                  onClick={() => navigate(`/app/provider/${p.id}/overview`)}
                >
                  <td>{p.name}</td>
                  <td>{p.network || "—"}</td>
                  <td>{`${p.street}, ${p.city}, ${p.state} ${p.zip}`}</td>
                  <td>{p.type || "Unknown"}</td>
                  <td>{p.distance.toFixed(2)}</td>
                  {isInSavedMarket && (
                    <td onClick={(e) => e.stopPropagation()}>
                      {p.id === provider.id ? (
                        "-"
                      ) : (
                        <>
                          {taggingProviderId === p.id ? (
                            <div className={styles.inlineTaggingMenu}>
                              <label>
                                <input
                                  type="radio"
                                  name={`tag-${p.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTag(p.id, "partner");
                                  }}
                                />
                                Partner
                              </label>
                              <label>
                                <input
                                  type="radio"
                                  name={`tag-${p.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTag(p.id, "competitor");
                                  }}
                                />
                                Competitor
                              </label>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaggingProviderId(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`${
                                tags[p.id] === "partner"
                                  ? styles.partnerBadge
                                  : tags[p.id] === "competitor"
                                  ? styles.competitorBadge
                                  : styles.tagDefault
                              } ${
                                savingTagId === p.id ? styles.animatePulse : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaggingProviderId(p.id);
                              }}
                            >
                              {tags[p.id] || "Tag"}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
