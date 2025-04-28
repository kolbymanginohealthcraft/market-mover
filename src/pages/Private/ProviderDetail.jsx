import { useEffect, useState, useRef } from "react";
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./ProviderDetail.module.css";
import { Pencil, Check, X } from "lucide-react";

import OverviewTab from "./OverviewTab";
import NearbyTab from "./NearbyTab";
import ScorecardTab from "./ScorecardPage";
import ChartsTab from "./ChartDashboard";
import SubNavbar from "../../components/Navigation/SubNavbar";
import CCNList from "./CCNList";
import Quality from "./Quality";
import Spinner from "../../components/Buttons/Spinner";

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radiusInMiles, setRadiusInMiles] = useState(10);
  const [cachedProviders, setCachedProviders] = useState([]);
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [nearbyDhcCcns, setNearbyDhcCcns] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [marketName, setMarketName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [currentMarketName, setCurrentMarketName] = useState("");
  const [isEditingMarket, setIsEditingMarket] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedRadius, setEditedRadius] = useState(10);
  const inputRef = useRef(null);

  const marketId = searchParams.get("marketId");
  const radiusFromUrl = searchParams.get("radius");
  const isInSavedMarket = Boolean(marketId);

  useEffect(() => {
    if (radiusFromUrl) {
      setRadiusInMiles(Number(radiusFromUrl));
    }
  }, [radiusFromUrl]);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("org_dhc")
        .select(
          "id, dhc, name, network, type, street, city, state, zip, phone, latitude, longitude"
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error fetching provider:", error);
        navigate("/search");
      } else {
        setProvider(data);
        fetchNearbyProviders(data.latitude, data.longitude);
      }
      setLoading(false);
    };

    fetchProvider();
  }, [id, navigate]);

  const fetchNearbyProviders = async (centerLat, centerLon) => {
    console.log("🌎 Fetching nearby providers...");

    const boundingBoxMargin = 2;
    const latMin = centerLat - boundingBoxMargin;
    const latMax = centerLat + boundingBoxMargin;
    const lonMin = centerLon - boundingBoxMargin;
    const lonMax = centerLon + boundingBoxMargin;

    const { data, error } = await supabase
      .from("org_dhc")
      .select(
        "id, dhc, name, network, street, city, state, zip, latitude, longitude, type"
      )
      .filter("latitude", "gte", latMin)
      .filter("latitude", "lte", latMax)
      .filter("longitude", "gte", lonMin)
      .filter("longitude", "lte", lonMax);

    if (error) {
      console.error("❌ Error fetching nearby providers:", error);
      return;
    }

    console.log(`✅ Found ${data.length} nearby providers.`);

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

    const enriched = data.map((p) => ({
      ...p,
      distance: haversineDistanceMiles([centerLat, centerLon], [p.latitude, p.longitude]),
    }));

    setCachedProviders(enriched);
  };

  useEffect(() => {
    if (!cachedProviders.length) return;
    const filtered = cachedProviders
      .filter((p) => p.distance <= radiusInMiles)
      .sort((a, b) => a.distance - b.distance);
    setNearbyProviders(filtered);

    const dhcIds = filtered.map((p) => p.dhc).filter((id) => id != null);
    console.log("🧩 Sending DHC IDs to RPC:", dhcIds);

    if (dhcIds.length > 0) {
      fetchNearbyDhcCcns(dhcIds);
    } else {
      setNearbyDhcCcns([]);
    }
  }, [cachedProviders, radiusInMiles]);

  const fetchNearbyDhcCcns = async (dhcIds) => {
    const { data, error } = await supabase.rpc("get_ccns_for_market", {
      dhc_ids: dhcIds,
    });

    if (error) {
      console.error("❌ Error fetching DHC-CCN mappings:", error);
    } else {
      console.log(`✅ Nearby DHC-CCN mappings fetched:`, data);
      setNearbyDhcCcns(data || []);
    }
  };

  useEffect(() => {
    const fetchMarketName = async () => {
      if (!marketId) return;
      const { data, error } = await supabase
        .from("saved_market")
        .select("name, radius_miles")
        .eq("id", marketId)
        .single();

      if (data?.name) setCurrentMarketName(data.name);
      if (data?.radius_miles) setRadiusInMiles(data.radius_miles);
    };

    fetchMarketName();
  }, [marketId]);

  const handleSaveMarket = async () => {
    setSaveMessage("Saving...");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError);
        setSaveMessage("Error: could not get user.");
        return;
      }

      const userId = userData?.user?.id;
      if (!userId) {
        console.error("No user ID found");
        setSaveMessage("Error: no user ID.");
        return;
      }

      const { data: savedMarket, error: insertError } = await supabase
        .from("saved_market")
        .insert({
          user_id: userId,
          provider_id: provider.id,
          radius_miles: radiusInMiles,
          name: marketName,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting market:", insertError);
        setSaveMessage(`Error: ${insertError.message}`);
      } else {
        console.log("Market saved:", savedMarket);
        setSaveMessage("Market saved successfully!");
        setShowPopup(false);

        const currentPath = window.location.pathname;
        const lastSegment = currentPath.split("/").pop();
        const validTabs = ["overview", "nearby", "scorecard", "charts"];
        const subTab = validTabs.includes(lastSegment) ? lastSegment : "overview";

        navigate(`/app/provider/${provider.id}/${subTab}?radius=${radiusInMiles}&marketId=${savedMarket.id}`);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setSaveMessage("Unexpected error occurred.");
    }
  };

  const handleSaveMarketEdits = async () => {
    if (!marketId) return;
    const { error } = await supabase
      .from("saved_market")
      .update({ name: editedName, radius_miles: editedRadius })
      .eq("id", marketId);

    if (!error) {
      setCurrentMarketName(editedName);
      setRadiusInMiles(editedRadius);
      setIsEditingMarket(false);

      const currentPath = window.location.pathname;
      const lastSegment = currentPath.split("/").pop();
      const validTabs = ["overview", "nearby", "scorecard", "charts"];
      const subTab = validTabs.includes(lastSegment) ? lastSegment : "overview";

      navigate(`/app/provider/${provider.id}/${subTab}?radius=${editedRadius}&marketId=${marketId}`);
    }
  };

  const handleCancelEdit = () => setIsEditingMarket(false);

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") handleSaveMarketEdits();
    if (e.key === "Escape") handleCancelEdit();
  };

  const handlePopupKeyDown = (e) => {
    if (e.key === "Enter") handleSaveMarket();
    if (e.key === "Escape") setShowPopup(false);
  };

  useEffect(() => {
    if (showPopup && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPopup]);

  if (loading || !provider) return <Spinner message="Loading provider details..." />;

  return (
    <div className={styles.container}>
      <div className={`${styles.headerInfo} ${isInSavedMarket ? styles.savedBackground : styles.defaultBackground}`}>
        <div className={styles.headerLeft}>
          <h2>{provider.name}</h2>
          <p>
            {provider.street}, {provider.city}, {provider.state} {provider.zip}
            <span className={styles.typeBadge}>{provider.type}</span>
          </p>
        </div>

        <div className={styles.controlsWrapper}>
          {isInSavedMarket ? (
            <div className={styles.marketInfo}>
              {isEditingMarket ? (
                <div className={styles.editingBlock}>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className={styles.editInput}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editedRadius}
                    onChange={(e) => setEditedRadius(Number(e.target.value))}
                    className={styles.editInput}
                    onKeyDown={handleEditKeyDown}
                  />
                  <div className={styles.editIcons}>
                    <button className={styles.iconButton} onClick={handleSaveMarketEdits}>
                      <Check size={16} />
                    </button>
                    <button className={styles.iconButton} onClick={handleCancelEdit}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.marketTopRow}>
                    <span className={styles.savedBadge}>Saved</span>
                    <span className={styles.marketName}>
                      {currentMarketName || "(Unnamed)"}
                    </span>
                  </div>
                  <div className={styles.radiusRow}>
                    <span>Radius: {radiusInMiles} mi</span>
                    <button
                      className={styles.iconButton}
                      onClick={() => {
                        setIsEditingMarket(true);
                        setEditedName(currentMarketName);
                        setEditedRadius(radiusInMiles);
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.radiusGroup}>
              <label>Radius: {radiusInMiles} mi</label>
              <input
                className={styles.radiusSlider}
                type="range"
                min="1"
                max="100"
                value={radiusInMiles}
                onChange={(e) => setRadiusInMiles(Number(e.target.value))}
              />
              <button
                className={styles.saveButton}
                onClick={() => setShowPopup(true)}
              >
                Save Market
              </button>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h3>Name this market</h3>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Dallas 5mi"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              onKeyDown={handlePopupKeyDown}
              className={styles.popupInput}
            />
            <div className={styles.popupButtons}>
              <button onClick={handleSaveMarket} className={styles.popupSave}>
                Confirm
              </button>
              <button onClick={() => setShowPopup(false)} className={styles.popupCancel}>
                Cancel
              </button>
            </div>
            {saveMessage && <p className={styles.popupMessage}>{saveMessage}</p>}
          </div>
        </div>
      )}

      <SubNavbar providerId={id} />

      <Routes>
        <Route path="overview" element={<OverviewTab provider={provider} />} />
        <Route
          path="nearby"
          element={
            <NearbyTab
              provider={provider}
              radiusInMiles={radiusInMiles}
              providers={nearbyProviders}
              isInSavedMarket={isInSavedMarket}
            />
          }
        />
        <Route path="scorecard" element={<ScorecardTab provider={provider} />} />
        <Route path="charts" element={<ChartsTab provider={provider} />} />
        <Route path="quality" element={<Quality provider={provider} marketDhcCcns={nearbyDhcCcns} />} />
        <Route path="ccn-list" element={<CCNList provider={provider} providers={nearbyProviders} />} />
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="*" element={<p>404: Page Not Found</p>} />
      </Routes>
    </div>
  );
}
