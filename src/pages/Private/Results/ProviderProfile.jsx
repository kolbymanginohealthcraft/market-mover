import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { trackProviderView } from '../../../utils/activityTracker';
import { useProviderContext } from '../../../components/Context/ProviderContext';

import useProviderInfo from "../../../hooks/useProviderInfo";

import DetailedLoadingSpinner from "../../../components/Buttons/DetailedLoadingSpinner";
import PageLayout from "../../../components/Layouts/PageLayout";
import SimpleOverviewTab from "./Overview/SimpleOverviewTab";
import SimpleClaimsTab from "./Claims/SimpleClaimsTab";
import SimpleStorytellerTab from "./Storyteller/SimpleStorytellerTab";
import { BarChart3, FileText } from "lucide-react";
import styles from "./ProviderDetail.module.css";
import claimsStyles from "./Claims/ClaimsTab.module.css";

export default function ProviderProfile() {
  const { dhc } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentProvider } = useProviderContext();

  const { provider, loading, error: providerError } = useProviderInfo(dhc);
  const [claimsActiveTab, setClaimsActiveTab] = useState('procedures');
  
  const isClaimsRoute = location.pathname.includes('/claims');

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

  if (loading || !provider) {
    return (
      <DetailedLoadingSpinner 
        message="Loading provider information..." 
        showProgress={false}
      />
    );
  }

  if (providerError) {
    return (
      <PageLayout>
        <div className={styles.error}>
          <h2>Error Loading Provider</h2>
          <p>{providerError}</p>
          <button onClick={() => navigate('/app/search/basic')}>
            Back to Search
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      {isClaimsRoute && (
        <div className={claimsStyles.tabNav}>
          <button
            className={`${claimsStyles.tab} ${claimsActiveTab === 'procedures' ? claimsStyles.active : ''}`}
            onClick={() => setClaimsActiveTab('procedures')}
          >
            <BarChart3 size={16} />
            Procedures
          </button>
          <button
            className={`${claimsStyles.tab} ${claimsActiveTab === 'diagnoses' ? claimsStyles.active : ''}`}
            onClick={() => setClaimsActiveTab('diagnoses')}
          >
            <FileText size={16} />
            Diagnoses
          </button>
        </div>
      )}
      <PageLayout>
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SimpleOverviewTab provider={provider} />} />
          <Route path="claims" element={<SimpleClaimsTab provider={provider} activeTab={claimsActiveTab} setActiveTab={setClaimsActiveTab} />} />
          <Route path="storyteller/*" element={<SimpleStorytellerTab provider={provider} />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </PageLayout>
    </>
  );
}

