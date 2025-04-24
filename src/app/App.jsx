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
import Layout from "../components/Layouts/Layout"; // private layout
import PublicLayout from "../components/Layouts/PublicLayout";
import LegalLayout from "../components/Layouts/LegalLayout";

// Pages
import LandingPage from "../pages/Public/LandingPage";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import PricingPage from "../pages/Public/PricingPage";
import SelectPlan from "../pages/Public/SelectPlan";
import ProfileSetup from "../pages/Auth/ProfileSetup";
import TermsAndConditions from "../pages/Public/TermsAndConditions";
import PrivacyPolicy from "../pages/Public/PrivacyPolicy";
import Home from "../pages/Private/Home";
import Explore from "../pages/Private/Explore";
import ProviderSearch from "../pages/Private/ProviderSearch";
import ProviderDetail from "../pages/Private/ProviderDetail";
import UserProfile from "../pages/Auth/UserProfile";
import MarketsPage from "../pages/Private/MarketsPage";
import ChartDashboard from "../components/Charts/ChartDashboard";
import ScorecardPage from "../pages/Private/ScorecardPage";

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
    if (session && location.pathname === "/login") {
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
          <Route index element={<LandingPage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="select-plan" element={<SelectPlan />} />
          <Route path="profile-setup" element={<ProfileSetup />} />
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

          {/* Main provider route handles overview + nearby + fallback */}
          <Route path="provider/:id/*" element={<ProviderDetail />} />
          {/* <Route path="provider/:id/scorecard" element={<ScorecardPage />} /> */}
          {/* <Route path="provider/:id/charts" element={<ChartDashboard />} /> */}

          {/* Optional test routes until everything is dynamic */}
          {/* <Route path="scorecard" element={<Navigate to="provider/123456/scorecard" />} /> */}
          {/* <Route path="charts" element={<Navigate to="provider/123456/charts" />} /> */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
