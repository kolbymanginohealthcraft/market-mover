import { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route, Navigate, useLocation } from "react-router-dom";
import styles from "./Settings.module.css";
import { useUser } from "../../../components/Context/UserContext";
import {
  ProfileTab,
  UsersTab,
  BrandingTab,
  CompanyTab
} from "./index";
import SubscriptionLayout from "./SubscriptionLayout";
import FAQTab from "./FAQTab";
import LegalTab from "./LegalTab";

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, permissions, loading: userLoading } = useUser();
  
  // Extract the active tab from the current path
  const pathSegments = location.pathname.split('/');
  const activeTab = pathSegments[pathSegments.length - 1] || "profile";

  const handleTabChange = (newTab) => {
    navigate(`/app/settings/${newTab}`);
  };

  // Check if user can access restricted tabs
  const canAccessSubscription = true; // Remove team admin restriction
  const canAccessUsers = permissions.canAccessUsers;
  const canAccessTaggedProviders = profile !== null;
  const canAccessColors = permissions.canAccessUsers; // Require team admin or above for branding

  // Subscription tab is now accessible to all users

  // If user tries to access company tab without permission, redirect to profile
  if (!userLoading && activeTab === "company" && !canAccessUsers) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  // If user tries to access users tab without permission, redirect to profile
  if (!userLoading && activeTab === "users" && !canAccessUsers) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  // If user tries to access branding tab without permission, redirect to profile
  if (!userLoading && activeTab === "branding" && !canAccessColors) {
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
          <Route path="faq" element={<FAQTab />} />
          <Route path="legal" element={<LegalTab />} />
          <Route path="*" element={<Navigate to="profile" replace />} />
        </Routes>
      </div>
    </div>
  );
} 