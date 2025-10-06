import { useEffect, useRef, useState, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import styles from "./ProviderDetail.module.css";
import { Pencil, Check, X } from "lucide-react";
import { useDebounce } from 'use-debounce';
import { apiUrl } from '../../../utils/api';
import { trackProviderView } from '../../../utils/activityTracker';
import { useProviderContext } from '../../../components/Context/ProviderContext';
import { ProviderAnalysisProvider, useProviderAnalysis } from '../../../components/Context/ProviderAnalysisContext';

import useProviderInfo from "../../../hooks/useProviderInfo";

import OverviewTab from "./Overview/OverviewTab";
import ProviderListingTab from "./Providers/ProviderListingTab";

import ClaimsTab from "./Claims/ClaimsTab";
import CensusDataPanel from "./Population/CensusDataPanel";

import Enrollment from "./Enrollment/Enrollment";
import ProviderDensityPage from "./Providers/ProviderDensityPage";
import CatchmentTab from "./Catchment/CatchmentTab";

import Spinner from "../../../components/Buttons/Spinner";
import DetailedLoadingSpinner from "../../../components/Buttons/DetailedLoadingSpinner";
import Storyteller from "./Storyteller/Storyteller";
import PageLayout from "../../../components/Layouts/PageLayout";

// Inner component that uses the provider analysis context
function ProviderDetailContent() {
  const { dhc } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { setCurrentProvider } = useProviderContext();

  const { provider, loading, error: providerError } = useProviderInfo(dhc);
  
  // Use the unified provider analysis context
  const {
    providers: nearbyProviders,
    ccns: nearbyDhcCcns,
    npis: nearbyNpis,
    censusData,
    counties,
    censusTracts,
    qualityMeasuresDates,
    qualityMeasuresData,
    radiusInMiles, // Get radius from context instead of local state
    loading: marketAnalysisLoading,
    providersLoading,
    ccnsLoading,
    npisLoading,
    censusLoading,
    qualityMeasuresDatesLoading,
    qualityMeasuresLoading,
    batchDataCompleted,
    censusDataCompleted,
    providerIdsCompleted,
    qualityMeasuresCompleted,
    error: marketAnalysisError,
    providersError,
    ccnsError,
    npisError,
    censusError,
    qualityMeasuresDatesError,
    qualityMeasuresError,
    getAllNpis,
    getProviderDhcToCcns,
    getProviderDhcToNpis
  } = useProviderAnalysis();

  const [debouncedRadius] = useDebounce(radiusInMiles, 400);

  // Track provider view activity (only once per provider per session)
  useEffect(() => {
    if (provider && !loading) {
      // Don't track if coming from activity panel
      const urlParams = new URLSearchParams(window.location.search);
      const fromActivity = urlParams.get('fromActivity');
      
      if (fromActivity) {
        // Remove the parameter from URL without triggering a page reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        return;
      }
      
      const viewedProviders = JSON.parse(sessionStorage.getItem('viewedProviders') || '[]');
      const providerKey = `${provider.dhc}`;
      
      if (!viewedProviders.includes(providerKey)) {
        trackProviderView(provider.dhc, provider.name);
        viewedProviders.push(providerKey);
        sessionStorage.setItem('viewedProviders', JSON.stringify(viewedProviders));
      }
    }
  }, [provider, loading]);

  // Set provider information in context for header display
  useEffect(() => {
    if (provider && !loading) {
      setCurrentProvider(provider);
    }
    return () => {
      setCurrentProvider(null);
    };
  }, [provider, loading, setCurrentProvider]);

  if (loading || marketAnalysisLoading || !provider) {
    const loadingStates = {
      batchData: !batchDataCompleted && loading,
      censusData: !censusDataCompleted && loading,
      providerIds: !providerIdsCompleted && loading,
      qualityMeasures: !qualityMeasuresCompleted && qualityMeasuresLoading
    };
    
    return (
      <DetailedLoadingSpinner 
        message="Loading provider analysis..." 
        loadingStates={loadingStates}
        showProgress={true}
      />
    );
  }

  // For all routes, render normally inside PageLayout
  return (
    <PageLayout>
      <Routes>
        <Route path="overview" element={<OverviewTab provider={provider} />} />
        <Route path="provider-listing" element={<ProviderListingTab provider={provider} radiusInMiles={radiusInMiles} providers={[provider, ...nearbyProviders]} />} />

        <Route path="claims" element={<ClaimsTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="catchment" element={<CatchmentTab providerInfo={provider} />} />
        <Route path="population" element={<CensusDataPanel provider={provider} radiusInMiles={radiusInMiles} />} />

        <Route path="cms-enrollment/*" element={<Enrollment provider={provider} radiusInMiles={radiusInMiles} />} />
        <Route path="provider-density" element={<ProviderDensityPage radius={radiusInMiles} provider={provider} />} />
        <Route path="storyteller/*" element={
          (() => {
            console.log('🔍 ProviderDetail - Data being passed to Storyteller:', {
              providerDhc: provider?.dhc,
              nearbyProvidersCount: nearbyProviders?.length || 0,
              nearbyDhcCcnsCount: nearbyDhcCcns?.length || 0,
              nearbyDhcCcnsSample: nearbyDhcCcns?.slice(0, 3),
              hasQualityMeasuresDates: !!qualityMeasuresDates,
              qualityMeasuresDatesKeys: qualityMeasuresDates ? Object.keys(qualityMeasuresDates) : []
            });
            return (
              <Storyteller
                provider={provider}
                radiusInMiles={radiusInMiles}
                nearbyProviders={nearbyProviders}
                nearbyDhcCcns={nearbyDhcCcns}
                prefetchedData={{
                  loading: qualityMeasuresLoading,
                  measures: qualityMeasuresData.measures,
                  data: qualityMeasuresData.providerData,
                  marketAverages: qualityMeasuresData.marketAverages,
                  nationalAverages: qualityMeasuresData.nationalAverages,
                  error: qualityMeasuresError,
                  allProviders: qualityMeasuresData.allProviders,
                  providerTypes: qualityMeasuresData.availableProviderTypes,
                  publishDates: qualityMeasuresData.availablePublishDates,
                  currentDate: qualityMeasuresData.currentPublishDate,
                  qualityMeasuresDates
                }}
              />
            );
          })()
        } />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </PageLayout>
  );
}

// Main component that provides the context
export default function ProviderDetail() {
  const { dhc } = useParams();
  const [searchParams] = useSearchParams();
  const radiusFromUrl = Number(searchParams.get("radius"));
  const [radiusInMiles, setRadiusInMiles] = useState(radiusFromUrl || 10);
  const { provider, loading, error: providerError } = useProviderInfo(dhc);

  // Update radius when URL changes
  useEffect(() => {
    const newRadius = radiusFromUrl || 10;
    if (newRadius !== radiusInMiles) {
      console.log('🔄 ProviderDetail: Updating radius from URL:', radiusFromUrl, '→', newRadius);
      setRadiusInMiles(newRadius);
    }
  }, [radiusFromUrl, radiusInMiles]);

  return (
    <ProviderAnalysisProvider 
      provider={provider} 
      radiusInMiles={radiusInMiles}
    >
      <ProviderDetailContent />
    </ProviderAnalysisProvider>
  );
}
