import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import styles from "./ProviderDetail.module.css";

import OverviewTab from "./OverviewTab";
import NearbyTab from "./NearbyTab";
import ScorecardTab from "./ScorecardPage";
import ChartsTab from "./ChartDashboard";
import SubNavbar from "../../components/Navigation/SubNavbar";
import Spinner from "../../components/Buttons/Spinner";

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radiusInMiles, setRadiusInMiles] = useState(10);
  const [showPopup, setShowPopup] = useState(false);
  const [marketName, setMarketName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("org_dhc")
        .select(
          "id, name, network, type, street, city, state, zip, phone, latitude, longitude"
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error fetching provider:", error);
        navigate("/search");
      } else {
        setProvider(data);
      }
      setLoading(false);
    };

    fetchProvider();
  }, [id, navigate]);

  const handleSaveMarket = async () => {
    setSaveMessage("Saving...");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("❌ Error getting user:", userError);
        setSaveMessage("Error: could not get user.");
        return;
      }

      const userId = userData?.user?.id;
      if (!userId) {
        console.error("❌ No user ID found");
        setSaveMessage("Error: no user ID.");
        return;
      }

      console.log("✅ User ID:", userId);
      console.log("📦 Saving market with:", {
        user_id: userId,
        provider_id: provider.id,
        radius_miles: radiusInMiles,
        name: marketName,
      });

      const { error: insertError } = await supabase.from("saved_market").insert({
        user_id: userId,
        provider_id: provider.id,
        radius_miles: radiusInMiles,
        name: marketName,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("❌ Error inserting market:", insertError);
        setSaveMessage(`Error: ${insertError.message}`);
      } else {
        console.log("✅ Market saved!");
        setSaveMessage("Market saved successfully!");
        setShowPopup(false);
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setSaveMessage("Unexpected error occurred.");
    }
  };

  if (loading || !provider) return <Spinner message="Loading provider details..." />;

  return (
    <div className={styles.container}>
      <div className={styles.headerInfo}>
        <div className={styles.headerLeft}>
          <h2>{provider.name}</h2>
          <p>
            {provider.street}, {provider.city}, {provider.state} {provider.zip}
            <span className={styles.typeBadge}>{provider.type}</span>
          </p>
        </div>

        <div className={styles.controlsWrapper}>
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
          </div>

          <button className={styles.saveButton} onClick={() => setShowPopup(true)}>
            Save Market
          </button>
        </div>
      </div>

      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h3>Name this market</h3>
            <input
              type="text"
              placeholder="e.g. Dallas 5mi"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
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
          element={<NearbyTab provider={provider} radiusInMiles={radiusInMiles} />}
        />
        <Route path="scorecard" element={<ScorecardTab provider={provider} />} />
        <Route path="charts" element={<ChartsTab provider={provider} />} />
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="*" element={<p>404: Page Not Found</p>} />
      </Routes>
    </div>
  );
}
