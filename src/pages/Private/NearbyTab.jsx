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
import { apiUrl } from '../../utils/api';

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
    console.log("[CCN DEBUG] Fetching CCNs for DHC IDs:", dhcIds);
    if (!dhcIds.length) return;
    try {
      const response = await fetch(apiUrl('/api/related-ccns'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dhc_ids: dhcIds }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log("[CCN DEBUG] API response:", result);
      if (result.success) {
        const ccnSet = new Set(result.data.map((row) => row.dhc));
        setCcnProviderIds(ccnSet);
        console.log("[CCN DEBUG] Set ccnProviderIds:", Array.from(ccnSet));
      } else {
        setCcnProviderIds(new Set());
        console.error("❌ Error fetching CCNs:", result.error);
      }
    } catch (err) {
      setCcnProviderIds(new Set());
      console.error("❌ Error fetching CCNs:", err);
    }
  };

  if (!providers || !provider)
    return <Spinner message="Loading nearby providers..." />;

  const allTypes = Array.from(
    new Set(
      providers
        .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.dhc))
        .map((p) => p.type || "Unknown")
    )
  ).sort();

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => setSelectedTypes([]);

  // Debug: Log the actual DHCs in ccnProviderIds and compare to providers
  console.log("[CCN DEBUG] ccnProviderIds (DHCs with CCN):", Array.from(ccnProviderIds));
  const providerDhcs = providers.map(p => p.dhc);
  console.log("[CCN DEBUG] Providers (DHCs):", providerDhcs);
  const matchingDhcs = providerDhcs.filter(dhc => ccnProviderIds.has(dhc));
  console.log("[CCN DEBUG] Providers with CCN (intersection):", matchingDhcs);

  // Ensure the filter logic matches on p.dhc
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
    .filter((p) => !showOnlyCCNs || ccnProviderIds.has(p.dhc))
    .sort((a, b) => a.distance - b.distance);

  const uniqueResults = [];
  const seen = new Set();
  for (const p of filteredResults) {
    if (!seen.has(p.dhc)) {
      const providerWithDistance = p.dhc === provider.dhc 
        ? { ...p, distance: 0 }
        : p;
      uniqueResults.push(providerWithDistance);
      seen.add(p.dhc);
    }
  }

  console.log(filteredResults.map(p => ({ name: p.name, distance: p.distance, type: typeof p.distance })));

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

  // Before rendering the table, log the first item in filteredResults
  console.log("Table data sample:", filteredResults[0]);

  // Before filtering for showOnlyCCNs, log providers and ccnProviderIds
  console.log("[CCN DEBUG] Providers:", providers.map(p => p.dhc));
  console.log("[CCN DEBUG] ccnProviderIds:", Array.from(ccnProviderIds));

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
                {uniqueResults.map((p) => (
                  <tr
                    key={p.dhc}
                    className={`${styles.clickableRow} ${
                      p.dhc === provider.dhc ? styles.highlightedRow : ""
                    }`}
                    onClick={() => navigate(`/app/provider/${p.dhc}/overview`)}
                    onMouseEnter={() => setHoveredProviderId(p.dhc)}
                    onMouseLeave={() => setHoveredProviderId(null)}
                  >
                    <td>{p.name}</td>
                    <td>{p.network || "—"}</td>
                    <td>{`${p.street}, ${p.city}, ${p.state} ${p.zip}`}</td>
                    <td>{p.type || "Unknown"}</td>
                    <td>{typeof p.distance === 'number' && !isNaN(p.distance) ? p.distance.toFixed(2) : '—'}</td>
                    {isInSavedMarket && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {p.dhc === provider.dhc ? (
                          "-"
                        ) : taggingProviderId === p.dhc ? (
                          <div className={styles.inlineTaggingMenu}>
                            <label>
                              <input
                                type="radio"
                                name={`tag-${p.dhc}`}
                                onClick={() => handleTag(p.dhc, "partner")}
                              />
                              Partner
                            </label>
                            <label>
                              <input
                                type="radio"
                                name={`tag-${p.dhc}`}
                                onClick={() => handleTag(p.dhc, "competitor")}
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
                              tags[p.dhc] === "partner"
                                ? styles.partnerBadge
                                : tags[p.dhc] === "competitor"
                                ? styles.competitorBadge
                                : styles.tagDefault
                            } ${
                              savingTagId === p.dhc ? styles.animatePulse : ""
                            }`}
                            onClick={() => setTaggingProviderId(p.dhc)}
                          >
                            {tags[p.dhc] || "Tag"}
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
                p.dhc !== provider.dhc && (
                  <Marker
                    key={p.dhc}
                    position={[p.latitude, p.longitude]}
                    icon={p.dhc === hoveredProviderId ? hoverIcon : defaultIcon}
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
