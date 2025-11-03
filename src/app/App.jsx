import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import { sessionSync, getStoredSession, isSessionValid } from "../utils/sessionSync";
import "../utils/sessionDebug"; // Load debug utilities

// Components
import ScrollToTop from "../components/Navigation/ScrollToTop";
import UnifiedSidebarLayout from "../components/Layouts/UnifiedSidebarLayout";

import { ProviderContextProvider } from "../components/Context/ProviderContext";
import { UserProvider, useUser } from "../components/Context/UserContext";

// Helper component for legacy redirect
function LegacyProviderRedirect() {
  const { dhc } = useParams();
  return <Navigate to={`/app/${dhc}`} replace />;
}

// Helper component for HCO route redirect
function HCORedirect() {
  const { npi } = useParams();
  if (npi) {
    return <Navigate to={`/app/search/orgs/${npi}`} replace />;
  }
  return <Navigate to="/app/search/orgs" replace />;
}

// Pages
import LandingPage from "../pages/Public/Marketing/LandingPage";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import TeamOnboarding from "../pages/Auth/TeamOnboarding";
import SetPassword from "../pages/Auth/SetPassword";
import EmailChangeConfirmation from "../pages/Auth/EmailChangeConfirmation";
import FAQPage from "../pages/Public/FAQ/FAQPage";
import LegalPage from "../pages/Public/Legal/LegalPage";



import Settings from "../pages/Private/Settings/Settings";
import ManageAnnouncements from "../pages/Private/Settings/Platform/ManageAnnouncements";
import ManageFeedback from "../pages/Private/Settings/Platform/ManageFeedback";
import AnalyticsDashboard from "../pages/Private/Settings/Platform/AnalyticsDashboard";
import StyleGuide from "../pages/Private/Settings/Platform/StyleGuide";
import LegalContentEditor from "../pages/Private/Settings/Platform/LegalContentEditor";
import PolicyManagement from "../pages/Private/Settings/Platform/PolicyManagement";

import TermsAndConditions from "../pages/Public/Legal/TermsAndConditions";
import PrivacyPolicy from "../pages/Public/Legal/PrivacyPolicy";
import Dashboard from "../pages/Private/Dashboard/Dashboard";
import Explore from "../pages/Private/Markets/Explore";
import ProviderSearch from "../pages/Private/Search/ProviderSearch";
import AdvancedSearch from "../pages/Private/Search/AdvancedSearch";
import ProviderProfile from "../pages/Private/Results/ProviderProfile";
import ProviderMarketAnalysis from "../pages/Private/Results/ProviderMarketAnalysis";
import MarketDetail from "../pages/Private/Results/MarketDetail";
import MarketsList from "../pages/Private/Markets/MarketsList";

import InteractiveMarketCreation from "../pages/Private/Markets/InteractiveMarketCreation";
import Network from "../pages/Private/Network/Network";
import Procedures from "../pages/Private/Procedures/Procedures";
import Diagnoses from "../pages/Private/Diagnoses/Diagnoses";
import KPIs from "../pages/Private/KPIs/KPIsLayout";
import Taxonomies from "../pages/Private/Taxonomies/TaxonomiesLayout";
import ClaimsDataInvestigation from "../pages/Private/Investigation/ClaimsDataInvestigation";
import GeographyAnalysis from "../pages/Private/GeographyAnalysis/GeographyAnalysis";
import ReferralPathways from "../pages/Private/ReferralPathways/ReferralPathways";

import Feedback from "../pages/Private/Dashboard/Feedback";
import TestProviderOfServices from "../pages/TestProviderOfServices";
import TestProviderOfServicesEnriched from "../pages/TestProviderOfServicesEnriched";

// Inner App component that has access to UserContext
function AppContent({ location }) {
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  
  
  // Handle redirects based on auth state
  useEffect(() => {
    if (user && (location.pathname === "/" || location.pathname === "/login") && location.pathname !== "/reset-password") {
      navigate("/app/dashboard");
    }
  }, [user, location.pathname, navigate]);

  // Show loading if UserContext is still loading
  if (userLoading) return null;
  
  return (
    <>
      <ScrollToTop />
      <ProviderContextProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<UnifiedSidebarLayout isPublic={true} />}>
            <Route
              index
              element={user ? <Navigate to="/app/dashboard" /> : <LandingPage />}
            />
            <Route
              path="login"
              element={user ? <Navigate to="/app/dashboard" /> : <Login />}
            />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="set-password" element={<SetPassword />} />
            <Route path="team-onboarding" element={<TeamOnboarding />} />
            <Route path="email-change-confirmation" element={<EmailChangeConfirmation />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="legal" element={<LegalPage />} />
          </Route>

          {/* Legal */}
          <Route path="/legal" element={<LegalPage />} />

          {/* Private */}
          <Route path="/app" element={user ? <UnifiedSidebarLayout isPublic={false} /> : <Navigate to="/" />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="search" element={<Navigate to="/app/search/orgs" replace />} />
            <Route path="search/basic" element={<Navigate to="/app/search/orgs" replace />} />
            <Route path="search/advanced" element={<Navigate to="/app/search/ind" replace />} />
            <Route path="search/orgs" element={<ProviderSearch />} />
            <Route path="search/ind" element={<AdvancedSearch />} />
            <Route path="explore" element={<Explore />} />
            <Route path="feedback" element={<Feedback />} />
            
            {/* Provider market analysis view - must come before the simpler provider route */}
            <Route path=":dhc/market/*" element={<ProviderMarketAnalysis />} />
            
            {/* New simplified provider view with tabs */}
            <Route path=":dhc/*" element={<ProviderProfile />} />
            
            {/* Legacy route - redirect to new format */}
            <Route 
              path="provider/:dhc/*" 
              element={
                <LegacyProviderRedirect />
              } 
            />

            <Route path="markets/*" element={<MarketsList />} />
            <Route path="market/:marketId/*" element={<MarketDetail />} />
            <Route path="market/create" element={<InteractiveMarketCreation />} />
            <Route path="settings/*" element={<Settings />} />
            <Route path="manage-announcements" element={<ManageAnnouncements />} />
            <Route path="manage-feedback" element={<ManageFeedback />} />
            <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
            <Route path="legal-content-editor" element={<LegalContentEditor />} />
            <Route path="policy-management" element={<PolicyManagement />} />
            <Route path="style-guide" element={<StyleGuide />} />
            <Route path="network/*" element={<Network />} />
            <Route path="procedures/*" element={<Procedures />} />
            <Route path="diagnoses/*" element={<Diagnoses />} />
            <Route path="kpis/*" element={<KPIs />} />
            <Route path="taxonomies/*" element={<Taxonomies />} />
            <Route path="claims" element={<ClaimsDataInvestigation />} />
            {/* Redirect old HCO/HCP Directory routes to Search the Industry */}
            <Route path="hco" element={<Navigate to="/app/search/orgs" replace />} />
            <Route path="hco/:npi" element={<HCORedirect />} />
            <Route path="hcp" element={<Navigate to="/app/search/ind" replace />} />
            <Route path="geography" element={<GeographyAnalysis />} />
            <Route path="referral-pathways" element={<ReferralPathways />} />
            <Route path="test-pos" element={<TestProviderOfServices />} />
            <Route path="test-pos-enriched" element={<TestProviderOfServicesEnriched />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={
            user && location.pathname !== "/reset-password" 
              ? <Navigate to="/app/dashboard" /> 
              : <Navigate to="/" />
          } />
        </Routes>
      </ProviderContextProvider>
    </>
  );
}

export default function App() {
  const [lastRedirectCheck, setLastRedirectCheck] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Listen for auth state changes to broadcast to other tabs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only broadcast significant auth state changes to prevent loops
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        sessionSync.broadcastAuthStateChange(event, session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Debounce redirect checks to prevent rapid redirects
    const now = Date.now();
    const timeSinceLastCheck = now - lastRedirectCheck;
    
    // Only check redirects if enough time has passed (500ms debounce)
    if (timeSinceLastCheck < 500 && lastRedirectCheck > 0) {
      return;
    }
    
    setLastRedirectCheck(now);
    
    // Note: Redirect logic is now handled in AppContent using UserContext
  }, [location.pathname, navigate, lastRedirectCheck]);

  return (
    <UserProvider>
      <AppContent location={location} />
    </UserProvider>
  );
}
