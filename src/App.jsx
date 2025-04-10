// App.jsx
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import LegalLayout from "./pages/LegalLayout"; // ✅ Import LegalLayout

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./components/Login";
import Signup from "./pages/Signup";
import PricingPage from "./pages/PricingPage";
import SelectPlan from "./components/SelectPlan";
import ProfileSetup from "./pages/ProfileSetup";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from './pages/PrivacyPolicy';
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ProviderSearch from "./pages/ProviderSearch";
import ProviderDetail from "./pages/ProviderDetail";
import UserProfile from "./pages/UserProfile";
import MarketsPage from "./pages/MarketsPage"; // Import the Markets page


function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (
        session &&
        (location.pathname === "/" || location.pathname === "/login")
      ) {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <Routes>
      {/* Shared public pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/select-plan" element={<SelectPlan />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
      </Route>

      {/* Legal Pages with Tabbed Layout */}
      <Route path="/" element={<LegalLayout />}>
        <Route path="terms" element={<TermsAndConditions />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
      </Route>

      {/* Private app routes */}
      {session && (
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" />} />
          <Route path="home" element={<Home />} />
          <Route path="search" element={<ProviderSearch />} />
          <Route path="explore" element={<Explore />} />
          <Route path="provider/:id/*" element={<ProviderDetail />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="markets" element={<MarketsPage />} /> {/* New route */}
          <Route
            path="*"
            element={<p style={{ padding: "2rem" }}>Page not found</p>}
          />
        </Route>
      )}

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
