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

import useProviderInfo from "../../../hooks/useProviderInfo";
import useMarketAnalysis from "../../../hooks/useMarketAnalysis";
import useQualityMeasures from "../../../hooks/useQualityMeasures";

import OverviewTab from "./Overview/OverviewTab";
import ProviderListingTab from "./Providers/ProviderListingTab";
import ChartsTab from "./Storyteller/ChartDashboard";
import DiagnosesTab from "./Claims/DiagnosesTab";
import ProceduresTab from "./Claims/ProceduresTab";
import ClaimsTab from "./Claims/ClaimsTab";
import PopulationTab from "./Population/PopulationTab";
import ReferralsTab from "./Claims/ReferralsTab";
import Enrollment from "./Enrollment/Enrollment";
import ProviderDensityPage from "./Providers/ProviderDensityPage";

import Spinner from "../../../components/Buttons/Spinner";
import DetailedLoadingSpinner from "../../../components/Buttons/DetailedLoadingSpinner";
import Storyteller from "./Storyteller/Storyteller";
import PageLayout from "../../../components/Layouts/PageLayout";

export default function ProviderDetail() {
  const { dhc } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { setCurrentProvider } = useProviderContext();
  
  const radiusFromUrl = Number(searchParams.get("radius"));
  const [radiusInMiles, setRadiusInMiles] = useState(radiusFromUrl || 10);

  const { provider, loading, error: providerError } = useProviderInfo(dhc);
  
  // Market analysis hook - unified data source
  const {
    providers: nearbyProviders,
    ccns: nearbyDhcCcns,
    npis: nearbyNpis,
    censusData,
    counties,
    censusTracts,
    qualityMeasuresDates,
    loading: marketAnalysisLoading,
    providersLoading,
    ccnsLoading,
    npisLoading,
    censusLoading,
    qualityMeasuresDatesLoading,
    error: marketAnalysisError,
    providersError,
    ccnsError,
    npisError,
    censusError,
    qualityMeasuresDatesError,
    getAllNpis,
    getProviderDhcToCcns,
    getProviderDhcToNpis
  } = useMarketAnalysis(provider, radiusInMiles, 'provider');

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
  } = useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, null, qualityMeasuresDates);

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
      provider: loading,
      nearbyProviders: providersLoading,
      ccns: ccnsLoading,
      npis: npisLoading,
      censusData: censusLoading,
      qualityMeasures: storytellerLoading
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
        <Route path="charts" element={<ChartsTab provider={provider} />} />
        <Route path="diagnoses" element={<DiagnosesTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="procedures" element={<ProceduresTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="claims" element={<ClaimsTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
        <Route path="population" element={<PopulationTab provider={provider} radiusInMiles={radiusInMiles} />} />
        <Route path="referrals" element={<ReferralsTab provider={provider} />} />
        <Route path="cms-enrollment/*" element={<Enrollment provider={provider} radiusInMiles={radiusInMiles} />} />
        <Route path="provider-density" element={<ProviderDensityPage radius={radiusInMiles} provider={provider} />} />
        <Route path="storyteller/*" element={
          <Storyteller
            provider={provider}
            radiusInMiles={radiusInMiles}
            nearbyProviders={nearbyProviders}
            nearbyDhcCcns={nearbyDhcCcns}
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
              currentDate: storytellerCurrentDate,
              qualityMeasuresDates
            }}
          />
        } />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </PageLayout>
  );
}
