import { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route, Navigate, useLocation } from "react-router-dom";
import styles from "./Settings.module.css";
import { hasPlatformAccess, isTeamAdmin } from "../../../utils/roleHelpers";
import { supabase } from "../../../app/supabaseClient";
import {
  ProfileTab,
  UsersTab,
  BrandingTab,
  CompanyTab
} from "./index";
import SubscriptionLayout from "./SubscriptionLayout";
import PlatformLayout from "./Platform/PlatformLayout";
import FAQTab from "./FAQTab";
import LegalTab from "./LegalTab";

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Extract the active tab from the current path
  const pathSegments = location.pathname.split('/');
  const activeTab = pathSegments[pathSegments.length - 1] || "profile";

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const handleTabChange = (newTab) => {
    navigate(`/app/settings/${newTab}`);
  };

  // Check if user can access restricted tabs
  const canAccessPlatform = hasPlatformAccess(userRole);
  const canAccessSubscription = true; // Remove team admin restriction
  const canAccessUsers = isTeamAdmin(userRole);
  const canAccessTaggedProviders = userRole !== null;
  const canAccessColors = userRole !== null;

  // If user tries to access platform tab without permission, redirect to profile
  if (!loading && activeTab === "platform" && !canAccessPlatform) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  // Subscription tab is now accessible to all users

  // If user tries to access company tab without permission, redirect to profile
  if (!loading && activeTab === "company" && !canAccessUsers) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  // If user tries to access users tab without permission, redirect to profile
  if (!loading && activeTab === "users" && !canAccessUsers) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  // If user tries to access branding tab without permission, redirect to profile
  if (!loading && activeTab === "branding" && !canAccessColors) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      <div className={styles.tabContent}>
        <Routes>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfileTab />} />
          <Route path="users" element={<UsersTab />} />
          <Route path="company" element={<CompanyTab />} />
          <Route path="branding" element={<BrandingTab />} />
          <Route path="subscription/*" element={<SubscriptionLayout />} />
          <Route path="platform/*" element={<PlatformLayout />} />
          <Route path="faq" element={<FAQTab />} />
          <Route path="legal" element={<LegalTab />} />
          <Route path="*" element={<Navigate to="profile" replace />} />
        </Routes>
      </div>
    </div>
  );
} 