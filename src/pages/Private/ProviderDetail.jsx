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
import { apiUrl } from '../../utils/api';
import { trackProviderView } from '../../utils/activityTracker';

import useProviderInfo from "../../hooks/useProviderInfo";
import useNearbyProviders from "../../hooks/useNearbyProviders";
import useMarketData from "../../hooks/useMarketData";
import useQualityMeasures from "../../hooks/useQualityMeasures";

import OverviewTab from "./OverviewTab";
import ProviderListingTab from "./ProviderListingTab";
import ChartsTab from "./ChartDashboard";
import DiagnosesTab from "./DiagnosesTab";
import ProceduresTab from "./ProceduresTab";
import ClaimsTab from "./ClaimsTab";
import PopulationTab from "./PopulationTab";
import ReferralsTab from "./ReferralsTab";
import MAEnrollmentTab from "./MAEnrollmentTab";
import CMSEnrollmentTab from "./CMSEnrollmentTab";
import ProviderDensityPage from "./ProviderDensityPage";
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
  const [mainProviderCcns, setMainProviderCcns] = useState([]);
  const hasTrackedView = useRef(false);

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

  // Prefetch quality measures data for Storyteller tab
  const {
    matrixLoading: storytellerLoading,
    matrixMeasures: storytellerMeasures,
    matrixData: storytellerData,
    matrixMarketAverages: storytellerMarketAverages,
    matrixNationalAverages: storytellerNationalAverages,
    matrixError: storytellerError,
    allMatrixProviders: storytellerAllProviders,
    availableProviderTypes: storytellerProviderTypes,
    availablePublishDates: storytellerPublishDates,
    currentPublishDate: storytellerCurrentDate
  } = useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, null);

  const [debouncedRadius] = useDebounce(radiusInMiles, 400);

  // Helper to get all relevant provider DHCs (main + competitors)
  const getAllProviderDhcs = useCallback(() => {
    const dhcs = [provider?.dhc, ...nearbyProviders.slice(0, 3).map(p => p.dhc)].filter(Boolean);
    return dhcs;
  }, [provider, nearbyProviders]);

  const handlePopupKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!marketName.trim()) {
        alert('Please enter a market name');
        return;
      }
      handleSaveMarket(marketName, radiusInMiles, () => setShowPopup(false));
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setShowPopup(false);
    }
  };

  useEffect(() => {
    if (showPopup && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPopup]);

  useEffect(() => {
    async function fetchMainProviderCcns() {
      if (!provider?.dhc) return setMainProviderCcns([]);
      console.log('Fetching related CCNs for provider:', provider?.dhc);
      const response = await fetch(apiUrl('related-ccns'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dhc: provider?.dhc })
      })
      .catch(err => { console.error('Fetch error (related-ccns):', err); throw err; });
      console.log('Fetch completed for related CCNs');
      if (!response.ok) return setMainProviderCcns([]);
      const result = await response.json();
      if (result.success) {
        setMainProviderCcns(result.data.map(row => row.ccn));
      } else {
        setMainProviderCcns([]);
      }
    }
    fetchMainProviderCcns();
  }, [provider?.dhc]);

  // Track provider view activity (only once per provider)
  useEffect(() => {
    if (provider && !loading && !hasTrackedView.current) {
      if (!marketId) {
        trackProviderView(provider.dhc, provider.name);
      }
      hasTrackedView.current = true;
    }
  }, [provider, loading, marketId]);

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
              <button 
                onClick={() => {
                  if (!marketName.trim()) {
                    alert('Please enter a market name');
                    return;
                  }
                  console.log('Save market clicked:', { marketName, radiusInMiles, providerDhc: provider?.dhc });
                  handleSaveMarket(marketName, radiusInMiles, () => setShowPopup(false));
                }} 
                className={styles.popupSave}
                disabled={!marketName.trim()}
              >
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
        <Route path="provider-listing" element={<ProviderListingTab provider={provider} radiusInMiles={radiusInMiles} providers={[provider, ...nearbyProviders]} isInSavedMarket={isInSavedMarket} />} />
        <Route path="storyteller/*" element={
          <Storyteller
            provider={provider}
            radiusInMiles={radiusInMiles}
            nearbyProviders={nearbyProviders}
            nearbyDhcCcns={nearbyDhcCcns}
            mainProviderCcns={mainProviderCcns}
            prefetchedData={{
              loading: storytellerLoading,
              measures: storytellerMeasures,
              data: storytellerData,
              marketAverages: storytellerMarketAverages,
              nationalAverages: storytellerNationalAverages,
              error: storytellerError,
              allProviders: storytellerAllProviders,
              providerTypes: storytellerProviderTypes,
              publishDates: storytellerPublishDates,
              currentDate: storytellerCurrentDate
            }}
          />
        } />
        <Route path="charts" element={<ChartsTab provider={provider} />} />
        <Route path="diagnoses" element={<DiagnosesTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="procedures" element={<ProceduresTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="claims" element={<ClaimsTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="population" element={<PopulationTab provider={provider} radiusInMiles={radiusInMiles} />} />
        <Route path="referrals" element={<ReferralsTab provider={provider} />} />
        <Route path="enrollment" element={<MAEnrollmentTab provider={provider} radiusInMiles={radiusInMiles} />} />
        <Route path="cms-enrollment" element={<CMSEnrollmentTab provider={provider} radiusInMiles={radiusInMiles} />} />
        <Route path="provider-density" element={<ProviderDensityPage radius={radiusInMiles} />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </div>
  );
}
