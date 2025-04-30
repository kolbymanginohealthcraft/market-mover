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
import ButtonPlayground from "../pages/ButtonPlayground";

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
import UserProfile from "../pages/Private/UserProfile";
import MarketsPage from "../pages/Private/MarketsPage";

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
          <Route path="select-plan" element={<SelectPlan />} />
          <Route path="profile-setup" element={<ProfileSetup />} />
          <Route path="/playground" element={<ButtonPlayground />} />
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
          <Route path="provider/:id/*" element={<ProviderDetail />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={session ? "/app/home" : "/"} />} />
      </Routes>
    </>
  );
}

export default App;
