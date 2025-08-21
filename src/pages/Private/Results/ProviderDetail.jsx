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
import useNearbyProviders from "../../../hooks/useNearbyProviders";
import useMarketData from "../../../hooks/useMarketData";
import useQualityMeasures from "../../../hooks/useQualityMeasures";

import OverviewTab from "./Overview/OverviewTab";
import ProviderListingTab from "./Providers/ProviderListingTab";
import ChartsTab from "./Storyteller/ChartDashboard";
import DiagnosesTab from "./Claims/DiagnosesTab";
import ProceduresTab from "./Claims/ProceduresTab";
import ClaimsTab from "./Claims/ClaimsTab";
import PopulationTab from "./Population/PopulationTab";
import ReferralsTab from "./Claims/ReferralsTab";
import CMSEnrollmentTab from "./Enrollment/CMSEnrollmentTab";
import ProviderDensityPage from "./Providers/ProviderDensityPage";

import Spinner from "../../../components/Buttons/Spinner";
import Storyteller from "./Storyteller/Storyteller";
import PageLayout from "../../../components/Layouts/PageLayout";

export default function ProviderDetail() {
  const { dhc } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { setCurrentProvider } = useProviderContext();
  
  // Check if we're on a storyteller route
  const isStorytellerRoute = location.pathname.includes('/storyteller');

  const radiusFromUrl = Number(searchParams.get("radius"));
  const [radiusInMiles, setRadiusInMiles] = useState(radiusFromUrl || 10);
  const [mainProviderCcns, setMainProviderCcns] = useState([]);
  const hasTrackedView = useRef(false);

  const { provider, loading, error: providerError } = useProviderInfo(dhc);
  
  const { providers: nearbyProviders, ccns: nearbyDhcCcns } = useNearbyProviders(provider, radiusInMiles);

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
      trackProviderView(provider.dhc, provider.name);
      hasTrackedView.current = true;
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

  if (loading || !provider) {
    return <Spinner message="Loading provider details..." />;
  }

  // If we're on a storyteller route, render the navigation outside PageLayout
  if (isStorytellerRoute) {
    return (
      <>
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
      </>
    );
  }

  // For all other routes, render normally inside PageLayout
  return (
    <PageLayout>
      <div className={styles.container}>
        <Routes>
          <Route path="overview" element={<OverviewTab provider={provider} />} />
          <Route path="provider-listing" element={<ProviderListingTab provider={provider} radiusInMiles={radiusInMiles} providers={[provider, ...nearbyProviders]} />} />
          <Route path="charts" element={<ChartsTab provider={provider} />} />
          <Route path="diagnoses" element={<DiagnosesTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
          <Route path="procedures" element={<ProceduresTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
          <Route path="claims" element={<ClaimsTab provider={provider} radiusInMiles={radiusInMiles} nearbyProviders={nearbyProviders} />} />
          <Route path="population" element={<PopulationTab provider={provider} radiusInMiles={radiusInMiles} />} />
          <Route path="referrals" element={<ReferralsTab provider={provider} />} />
          <Route path="cms-enrollment" element={<CMSEnrollmentTab provider={provider} radiusInMiles={radiusInMiles} />} />
          <Route path="provider-density" element={<ProviderDensityPage radius={radiusInMiles} />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </PageLayout>
  );
}
