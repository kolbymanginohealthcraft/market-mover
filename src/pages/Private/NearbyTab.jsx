import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Circle,
  Rectangle,
  Polyline,
  Polygon,
} from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../app/supabaseClient";
import Spinner from "../../components/Buttons/Spinner";
import Button from "../../components/Buttons/Button";
import styles from "./NearbyTab.module.css";
import { useDropdownClose } from "../../hooks/useDropdownClose";

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

const hoverIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
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
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showOnlyCCNs, setShowOnlyCCNs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ccnProviderIds, setCcnProviderIds] = useState(new Set());
  const [tags, setTags] = useState({});
  const [taggingProviderId, setTaggingProviderId] = useState(null);
  const [savingTagId, setSavingTagId] = useState(null);
  const [hoveredProviderId, setHoveredProviderId] = useState(null);

  const dropdownRef = useRef();
  const navigate = useNavigate();
  const marketId = new URLSearchParams(window.location.search).get("marketId");

  useDropdownClose(dropdownRef, () => {
    dropdownRef.current?.classList.remove(styles.dropdownOpen);
  });

  useEffect(() => {
    if (isInSavedMarket) fetchTags();
    fetchCCNs();
  }, [providers, showOnlyCCNs]);

  const fetchTags = async () => {
    if (!marketId) return;
    const { data } = await supabase
      .from("market_provider_tags")
      .select("tagged_provider_id, tag_type")
      .eq("market_id", marketId);

    const tagMap = {};
    data?.forEach((tag) => {
      tagMap[tag.tagged_provider_id] = tag.tag_type;
    });
    setTags(tagMap);
  };

  const fetchCCNs = async () => {
    const dhcIds = providers.map((p) => p.dhc).filter(Boolean);
    if (!dhcIds.length) return;
    const { data, error } = await supabase.rpc("get_ccns_for_market", {
      dhc_ids: dhcIds,
    });
    if (error) return console.error("❌ Error fetching CCNs:", error.message);
    setCcnProviderIds(new Set(data.map((row) => row.provider_id)));
  };

  if (!providers || !provider)
    return <Spinner message="Loading nearby providers..." />;

  const allTypes = Array.from(
    new Set(
      providers
        .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.id))
        .map((p) => p.type || "Unknown")
    )
  ).sort();

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => setSelectedTypes([]);

  const filteredResults = providers
    .filter(
      (p) =>
        selectedTypes.length === 0 ||
        selectedTypes.includes(p.type || "Unknown")
    )
    .filter(
      (p) =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.id))
    .sort((a, b) => a.distance - b.distance);

  const providerCount = filteredResults.length.toLocaleString();
  const lat = provider.latitude;
  const lon = provider.longitude;

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

      if (!error) {
        setTags((prev) => ({ ...prev, [providerId]: tagType }));
        setTaggingProviderId(null);
        setTimeout(() => setSavingTagId(null), 500);
      }
    } catch (err) {
      console.error("Unexpected error tagging provider:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controlsRow}>
        <div className={`${styles.controlsGroup} ${styles.buttonsGroup}`}>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <Button
              isFilter
              isActive={selectedTypes.length > 0}
              className="button-sm"
              onClick={() =>
                dropdownRef.current.classList.toggle(styles.dropdownOpen)
              }
            >
              <span className={styles.buttonLabel}>
                Filter Provider Types
                {selectedTypes.length > 0 && (
                  <span
                    className={styles.clearButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilters();
                    }}
                  >
                    ✕
                  </span>
                )}
              </span>
            </Button>

            <div className={styles.dropdownMenu}>
              {allTypes.map((type) => (
                <label key={type} className={styles.dropdownItem}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <Button
            isFilter
            isActive={showOnlyCCNs}
            className="button-sm"
            onClick={() => setShowOnlyCCNs((prev) => !prev)}
          >
            Only show providers with CCNs
          </Button>
        </div>

        <div className={`${styles.controlsGroup} ${styles.searchGroup}`}>
          <input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={`${styles.controlsGroup} ${styles.resultCount}`}>
          <div className={styles.providerCount}>
            Showing {providerCount} provider
            {filteredResults.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className={styles.splitView}>
        <div className={styles.tablePanel}>
          <div className={styles.tableScroll}>
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
                    onMouseEnter={() => setHoveredProviderId(p.id)}
                    onMouseLeave={() => setHoveredProviderId(null)}
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
                        ) : taggingProviderId === p.id ? (
                          <div className={styles.inlineTaggingMenu}>
                            <label>
                              <input
                                type="radio"
                                name={`tag-${p.id}`}
                                onClick={() => handleTag(p.id, "partner")}
                              />
                              Partner
                            </label>
                            <label>
                              <input
                                type="radio"
                                name={`tag-${p.id}`}
                                onClick={() => handleTag(p.id, "competitor")}
                              />
                              Competitor
                            </label>
                            <button onClick={() => setTaggingProviderId(null)}>
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
                            onClick={() => setTaggingProviderId(p.id)}
                          >
                            {tags[p.id] || "Tag"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.mapPanel}>
          <MapContainer
            center={[lat, lon]}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lon]} icon={selectedIcon}>
              <Popup>
                <strong>{provider.name}</strong>
                <br />
                Selected Provider
              </Popup>
            </Marker>
            {filteredResults.map(
              (p) =>
                p.id !== provider.id && (
                  <Marker
                    key={p.id}
                    position={[p.latitude, p.longitude]}
                    icon={p.id === hoveredProviderId ? hoverIcon : defaultIcon}
                  >
                    <Popup>{p.name}</Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
