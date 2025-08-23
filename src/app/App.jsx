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
import SidebarLayout from "../components/Layouts/SidebarLayout";
import PublicSidebarLayout from "../components/Layouts/PublicSidebarLayout";
import ButtonPlayground from "../pages/Temp/ButtonPlayground";
import { ProviderContextProvider } from "../components/Context/ProviderContext";

// Pages
import MarketingPage from "../pages/Public/Marketing/MarketingPage";
import NewLandingPage from "../pages/Public/Marketing/NewLandingPage";
import LoginTest from "../pages/Auth/LoginTest";
import SignupTest from "../pages/Auth/SignupTest";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import TeamOnboarding from "../pages/Auth/TeamOnboarding";
import SetPassword from "../pages/Auth/SetPassword";
import PricingPage from "../pages/Public/Pricing/PricingPage";
import FAQPage from "../pages/Public/FAQ/FAQPage";
import LegalPage from "../pages/Public/Legal/LegalPage";


import SelectPlan from "../pages/Public/SelectPlan";

import Settings from "../pages/Private/Settings/Settings";
import ManageAnnouncements from "../pages/Private/Settings/Platform/ManageAnnouncements";
import ManageFeedback from "../pages/Private/Settings/Platform/ManageFeedback";
import AnalyticsDashboard from "../pages/Private/Settings/Platform/AnalyticsDashboard";
// import CompleteProfile from "../pages/Private/Settings/CompleteProfile";
import LegalContentEditor from "../pages/Private/Settings/Platform/LegalContentEditor";
import PolicyManagement from "../pages/Private/Settings/Platform/PolicyManagement";

import TermsAndConditions from "../pages/Public/Legal/TermsAndConditions";
import PrivacyPolicy from "../pages/Public/Legal/PrivacyPolicy";
import BillingHistory from "../pages/Private/Settings/Subscription/BillingHistory";
import Dashboard from "../pages/Private/Dashboard/Dashboard";
import Explore from "../pages/Private/Markets/Explore";
import ProviderSearch from "../pages/Private/Search/ProviderSearch";
import ProviderDetail from "../pages/Private/Results/ProviderDetail";
import MarketDetail from "../pages/Private/Results/MarketDetail";
import MarketsList from "../pages/Private/Markets/MarketsList";
import MarketOverview from "../pages/Private/Markets/MarketOverview";
import InteractiveMarketCreation from "../pages/Private/Markets/InteractiveMarketCreation";
import BannerTest from "../pages/Temp/BannerTest";
import SpinnerDemo from "../pages/Temp/SpinnerDemo";
import Network from "../pages/Private/Network/Network";
import ServiceLineSearch from "../pages/Private/SupplierMode/ServiceLineSearch";
import Feedback from "../pages/Private/Dashboard/Feedback";

import PaymentTest from "../pages/Auth/PaymentTest";
import PaymentFlow from "../pages/Auth/PaymentFlow";
import Success from "../pages/Auth/Success";

export default function App() {
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
      <ProviderContextProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicSidebarLayout />}>
              <Route
                index
                element={session ? <Navigate to="/app/dashboard" /> : <NewLandingPage />}
              />
              <Route
                path="login"
                element={session ? <Navigate to="/app/dashboard" /> : <LoginTest />}
              />
              <Route path="signup" element={<SignupTest />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="team-onboarding" element={<TeamOnboarding />} />
              <Route path="set-password" element={<SetPassword />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="faq" element={<FAQPage />} />
              <Route path="legal" element={<LegalPage />} />
      


              <Route path="select-plan" element={<SelectPlan />} />
              {/* <Route path="/complete-profile" element={<CompleteProfile />} /> */}
              <Route path="/playground" element={<ButtonPlayground />} />
              <Route path="/auth/paymenttest" element={<PaymentTest />} />
              <Route path="/payment-flow" element={<PaymentFlow />} />
              <Route path="/success" element={<Success />} />
            </Route>

            {/* Legal */}
            <Route path="/legal" element={<LegalPage />} />

            {/* Private */}
            <Route path="/app" element={session ? <SidebarLayout /> : <Navigate to="/" />}>
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="search" element={<ProviderSearch />} />
              <Route path="explore" element={<Explore />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="provider/:dhc/*" element={<ProviderDetail />} />
              <Route path="supplier/search" element={<ServiceLineSearch />} />
              <Route path="markets/*" element={<MarketsList />} />
              <Route path="market/:marketId/*" element={<MarketDetail />} />
              <Route path="market/create" element={<InteractiveMarketCreation />} />
              <Route path="banner-test" element={<BannerTest />} />
              <Route path="spinner-demo" element={<SpinnerDemo />} />
              <Route path="billing" element={<BillingHistory />} />

              <Route path="settings/*" element={<Settings />} />
              <Route path="manage-announcements" element={<ManageAnnouncements />} />
              <Route path="manage-feedback" element={<ManageFeedback />} />
              <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
              <Route path="billing-history" element={<BillingHistory />} />
              <Route path="legal-content-editor" element={<LegalContentEditor />} />
              <Route path="policy-management" element={<PolicyManagement />} />
              <Route path="network/*" element={<Network />} />
              

            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={session ? "/app/dashboard" : "/"} />} />
          </Routes>
        </ProviderContextProvider>
    </>
  );
}
