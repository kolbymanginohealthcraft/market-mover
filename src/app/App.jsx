import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

// Components
import ScrollToTop from "../components/Navigation/ScrollToTop";
import Layout from "../components/Layouts/Layout";
import PublicLayout from "../components/Layouts/PublicLayout";
import LegalLayout from "../components/Layouts/LegalLayout";
import ButtonPlayground from "../pages/ButtonPlayground";

// Pages
import MarketingPage from "../pages/Public/MarketingPage";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import PricingPage from "../pages/Public/PricingPage";
import FAQPage from "../pages/Public/FAQPage";
import OverviewPage from "../pages/Public/OverviewPage";
import UseCasesPage from "../pages/Public/UseCasesPage";
import SelectPlan from "../pages/Public/SelectPlan";
import ProfileSetup from "../pages/Auth/ProfileSetup";
import AdminDashboard from "../pages/Private/AdminDashboard";
import UserSettings from "../pages/Private/UserSettings";
import Settings from "../pages/Private/Settings";
import ManageAnnouncements from "../pages/Private/ManageAnnouncements";
import ManageFeedback from "../pages/Private/ManageFeedback";
import AdminSettings from "../pages/Private/AdminSettings";
import AnalyticsDashboard from "../pages/Private/AnalyticsDashboard";
import CompleteProfile from "../pages/Private/CompleteProfile";
import LegalContentEditor from "../pages/Private/LegalContentEditor";
import PolicyManagement from "../pages/Private/PolicyManagement";

import TermsAndConditions from "../pages/Public/TermsAndConditions";
import PrivacyPolicy from "../pages/Public/PrivacyPolicy";
import BillingHistory from "../pages/Private/BillingHistory";
import Dashboard from "../pages/Private/Dashboard";
import Explore from "../pages/Private/Explore";
import ProviderSearch from "../pages/Private/ProviderSearch";
import ProviderDetail from "../pages/Private/ProviderDetail";
import UserProfile from "../pages/Private/UserProfile";

import Feedback from "../pages/Private/Feedback";
import ServiceLineSearch from "../pages/Private/SupplierMode/ServiceLineSearch";

import MarketOverview from "../pages/Private/Markets/MarketOverview";
import MarketsList from "../pages/Private/Markets/MarketsList";
import InteractiveMarketCreation from "../pages/Private/Markets/InteractiveMarketCreation";
import BannerTest from "../pages/Private/BannerTest";
import SpinnerDemo from "../pages/Private/SpinnerDemo";
// Team-related pages
import OnboardingPage from "../pages/Auth/OnboardingPage";
import PaymentTest from "../pages/Auth/PaymentTest";
import PaymentFlow from "../pages/Auth/PaymentFlow";
import Success from "../pages/Auth/Success";

function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();



  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);



  useEffect(() => {
    if (session && (location.pathname === "/" || location.pathname === "/login")) {
      navigate("/app/dashboard");
    }
  }, [session, location.pathname, navigate]);

  if (isLoading) return null;

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout />}>
          <Route
            index
            element={session ? <Navigate to="/app/dashboard" /> : <MarketingPage />}
          />
          <Route
            path="login"
            element={session ? <Navigate to="/app/dashboard" /> : <Login />}
          />
          <Route path="signup" element={<Signup />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="use-cases" element={<UseCasesPage />} />
          <Route path="select-plan" element={<SelectPlan />} />
          <Route path="profile-setup" element={<ProfileSetup />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/playground" element={<ButtonPlayground />} />
          <Route path="/auth/paymenttest" element={<PaymentTest />} />
          <Route path="/payment-flow" element={<PaymentFlow />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/success" element={<Success />} />
        </Route>

        {/* Legal */}
        <Route path="/legal" element={<LegalLayout />}>
          <Route path="terms" element={<TermsAndConditions />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
        </Route>

        {/* Private */}
        <Route path="/app" element={session ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="search" element={<ProviderSearch />} />
          <Route path="explore" element={<Explore />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="provider/:dhc/*" element={<ProviderDetail />} />
          <Route path="supplier/search" element={<ServiceLineSearch />} />
          <Route path="markets" element={<MarketsList />} />
          <Route path="market/create" element={<InteractiveMarketCreation />} />
          <Route path="market/:marketId/overview" element={<MarketOverview />} />
          <Route path="banner-test" element={<BannerTest />} />
          <Route path="spinner-demo" element={<SpinnerDemo />} />
          <Route path="billing" element={<BillingHistory />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="user-settings" element={<UserSettings />} />
          <Route path="settings/*" element={<Settings />} />
          <Route path="manage-announcements" element={<ManageAnnouncements />} />
          <Route path="manage-feedback" element={<ManageFeedback />} />
          <Route path="admin-settings" element={<AdminSettings />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
          <Route path="billing-history" element={<BillingHistory />} />
          <Route path="legal-content-editor" element={<LegalContentEditor />} />
          <Route path="policy-management" element={<PolicyManagement />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={session ? "/app/dashboard" : "/"} />} />
      </Routes>
    </>
  );
}

export default App;
