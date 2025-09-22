import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import { sessionSync, getStoredSession, isSessionValid } from "../utils/sessionSync";
import "../utils/sessionDebug"; // Load debug utilities

// Components
import ScrollToTop from "../components/Navigation/ScrollToTop";
import UnifiedSidebarLayout from "../components/Layouts/UnifiedSidebarLayout";

import { ProviderContextProvider } from "../components/Context/ProviderContext";
import { UserProvider, useUser } from "../components/Context/UserContext";

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
import ProviderDetail from "../pages/Private/Results/ProviderDetail";
import MarketDetail from "../pages/Private/Results/MarketDetail";
import MarketsList from "../pages/Private/Markets/MarketsList";

import InteractiveMarketCreation from "../pages/Private/Markets/InteractiveMarketCreation";
import Network from "../pages/Private/Network/Network";

import Feedback from "../pages/Private/Dashboard/Feedback";

// Inner App component that has access to UserContext
function AppContent({ session, location }) {
  const { loading: userLoading } = useUser();
  
  // Show loading if either App or UserContext is still loading
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
              element={session ? <Navigate to="/app/dashboard" /> : <LandingPage />}
            />
            <Route
              path="login"
              element={session ? <Navigate to="/app/dashboard" /> : <Login />}
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
          <Route path="/app" element={session ? <UnifiedSidebarLayout isPublic={false} /> : <Navigate to="/" />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="search" element={<Navigate to="search/basic" />} />
            <Route path="search/basic" element={<ProviderSearch />} />
            <Route path="search/advanced" element={<AdvancedSearch />} />
            <Route path="explore" element={<Explore />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="provider/:dhc/*" element={<ProviderDetail />} />

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
          </Route>

          {/* Fallback */}
          <Route path="*" element={
            session && location.pathname !== "/reset-password" 
              ? <Navigate to="/app/dashboard" /> 
              : <Navigate to="/" />
          } />
        </Routes>
      </ProviderContextProvider>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRedirectCheck, setLastRedirectCheck] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for stored session first to handle tab duplication
    const storedSession = getStoredSession();
    if (storedSession && isSessionValid(storedSession)) {
      setSession(storedSession);
      setIsLoading(false);
    }

    // Get current session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Only broadcast significant auth state changes to prevent loops
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        sessionSync.broadcastAuthStateChange(event, session);
      }
    });

    // Listen for session updates from other tabs
    const unsubscribeSync = sessionSync.subscribe((event, data) => {
      if (event === 'sessionUpdate' && data) {
        setSession(data);
      } else if (event === 'sessionClear') {
        setSession(null);
      } else if (event === 'authStateChange') {
        setSession(data.session);
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeSync();
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
    
    if (session && (location.pathname === "/" || location.pathname === "/login") && location.pathname !== "/reset-password") {
      navigate("/app/dashboard");
    }
  }, [session, location.pathname, navigate, lastRedirectCheck]);

  if (isLoading) return null;

  return (
    <UserProvider>
      <AppContent session={session} location={location} />
    </UserProvider>
  );
}
