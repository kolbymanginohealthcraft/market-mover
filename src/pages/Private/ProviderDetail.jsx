import { useEffect, useRef, useState, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import styles from "./ProviderDetail.module.css";
import { Pencil, Check, X } from "lucide-react";
import { useDebounce } from 'use-debounce';

import useProviderInfo from "../../hooks/useProviderInfo";
import useNearbyProviders from "../../hooks/useNearbyProviders";
import useMarketData from "../../hooks/useMarketData";


import OverviewTab from "./OverviewTab";
import NearbyTab from "./NearbyTab";
import ChartsTab from "./ChartDashboard";
import SubNavbar from "../../components/Navigation/SubNavbar";
import Spinner from "../../components/Buttons/Spinner";
import Storyteller from "./Storyteller/Storyteller";

export default function ProviderDetail() {
  const { dhc } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const radiusFromUrl = Number(searchParams.get("radius"));
  const marketId = searchParams.get("marketId");
  const [radiusInMiles, setRadiusInMiles] = useState(radiusFromUrl || 10);
  const [showPopup, setShowPopup] = useState(false);
  const [marketName, setMarketName] = useState("");
  const inputRef = useRef(null);

  const { provider, loading, error: providerError } = useProviderInfo(dhc);
  
  const { providers: nearbyProviders, ccns: nearbyDhcCcns } = useNearbyProviders(provider, radiusInMiles);
  const {
    isInSavedMarket,
    currentMarketName,
    editedName,
    editedRadius,
    saveMessage,
    isEditingMarket,
    setEditedName,
    setEditedRadius,
    setIsEditingMarket,
    setSaveMessage,
    handleSaveMarket,
    handleSaveMarketEdits,
  } = useMarketData(marketId, provider?.dhc, radiusInMiles, navigate);



  const [debouncedRadius] = useDebounce(radiusInMiles, 400);



  // Helper to get all relevant provider DHCs (main + competitors)
  const getAllProviderDhcs = useCallback(() => {
    const dhcs = [provider?.dhc, ...nearbyProviders.slice(0, 3).map(p => p.dhc)].filter(Boolean);
    return dhcs;
  }, [provider, nearbyProviders]);



  const handlePopupKeyDown = (e) => {
    if (e.key === "Enter") handleSaveMarket(marketName, radiusInMiles, () => setShowPopup(false));
    if (e.key === "Escape") setShowPopup(false);
  };

  useEffect(() => {
    if (showPopup && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPopup]);

  if (loading || !provider) {
    return <Spinner message="Loading provider details..." />;
  }

  return (
    <div className={styles.container} style={{ marginTop: 0, paddingTop: 0 }}>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveMarketEdits();
                      if (e.key === "Escape") setIsEditingMarket(false);
                    }}
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editedRadius}
                    onChange={(e) => setEditedRadius(Number(e.target.value))}
                    className={styles.editInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveMarketEdits();
                      if (e.key === "Escape") setIsEditingMarket(false);
                    }}
                  />
                  <div className={styles.editIcons}>
                    <button className={styles.iconButton} onClick={handleSaveMarketEdits}>
                      <Check size={16} />
                    </button>
                    <button className={styles.iconButton} onClick={() => setIsEditingMarket(false)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.marketTopRow}>
                    <span className={styles.savedBadge}>Saved</span>
                    <span className={styles.marketName}>{currentMarketName || "(Unnamed)"}</span>
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
              <button onClick={() => handleSaveMarket(marketName, radiusInMiles, () => setShowPopup(false))} className={styles.popupSave}>
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

      <SubNavbar providerId={dhc} />

      <Routes>
        <Route path="overview" element={<OverviewTab provider={provider} />} />
        <Route path="nearby" element={<NearbyTab provider={provider} radiusInMiles={radiusInMiles} providers={[provider, ...nearbyProviders]} isInSavedMarket={isInSavedMarket} />} />
        <Route path="storyteller/*" element={
          <Storyteller
            provider={provider}
            radiusInMiles={radiusInMiles}
          />
        } />
        <Route path="charts" element={<ChartsTab provider={provider} />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </div>
  );
}
