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
import LandingPage from "../pages/Public/LandingPage";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import PricingPage from "../pages/Public/PricingPage";
import FAQPage from "../pages/Public/FAQPage";
import OverviewPage from "../pages/Public/OverviewPage";
import UseCasesPage from "../pages/Public/UseCasesPage";
import SelectPlan from "../pages/Public/SelectPlan";
import ProfileSetup from "../pages/Auth/ProfileSetup";
import ManageUsers from "../pages/Private/ManageUsers";
import ManageAnnouncements from "../pages/Private/ManageAnnouncements";
import AdminSettings from "../pages/Private/AdminSettings";
import CompleteProfile from "../pages/Private/CompleteProfile";
import TermsAndConditions from "../pages/Public/TermsAndConditions";
import PrivacyPolicy from "../pages/Public/PrivacyPolicy";
import BillingHistory from "../pages/Private/BillingHistory";
import Home from "../pages/Private/Home";
import Explore from "../pages/Private/Explore";
import ProviderSearch from "../pages/Private/ProviderSearch";
import ProviderDetail from "../pages/Private/ProviderDetail";
import UserProfile from "../pages/Private/UserProfile";
import MarketsPage from "../pages/Private/MarketsPage";
// Team-related pages
import OnboardingPage from "../pages/Auth/OnboardingPage";
import PaymentTest from "../pages/Auth/PaymentTest";
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
      navigate("/app/home");
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
            element={session ? <Navigate to="/app/home" /> : <LandingPage />}
          />
          <Route
            path="login"
            element={session ? <Navigate to="/app/home" /> : <Login />}
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
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<Home />} />
          <Route path="search" element={<ProviderSearch />} />
          <Route path="explore" element={<Explore />} />
          <Route path="markets" element={<MarketsPage />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="provider/:dhc/*" element={<ProviderDetail />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="manage-announcements" element={<ManageAnnouncements />} />
          <Route path="admin" element={<AdminSettings />} />
          <Route path="billing-history" element={<BillingHistory />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={session ? "/app/home" : "/"} />} />
      </Routes>
    </>
  );
}

export default App;
