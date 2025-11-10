import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  Settings, 
  FileText, 
  MessageCircle,
  Megaphone,
  Users
} from 'lucide-react';
import { hasPlatformAccess } from '../../../../utils/roleHelpers';
import { supabase } from '../../../../app/supabaseClient';
import ManageAnnouncements from './ManageAnnouncements';
import ManageFeedback from './ManageFeedback';
import PolicyManagement from './PolicyManagement';
import StyleGuide from './StyleGuide';
import UserList from '../../../../features/admin/components/UserList';
import UnfinishedItems from './UnfinishedItems';
import MobileNavigationWorkshop from './MobileNavigationWorkshop';
import GeographyAnalysis from '../../GeographyAnalysis/GeographyAnalysis';
import TestProviderOfServices from '../../../TestProviderOfServices';
import TestProviderOfServicesEnriched from '../../../TestProviderOfServicesEnriched';
import ReferralPathways from '../../ReferralPathways/ReferralPathways';
import styles from './PlatformLayout.module.css';

export default function PlatformLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Check if user can access platform
  const canAccessPlatform = hasPlatformAccess(userRole);

  // If user tries to access platform without permission, redirect to dashboard
  if (!loading && !canAccessPlatform) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className={styles.content}>
      <div className={styles.routeArea}>
        <Routes>
          <Route index element={<Navigate to="unfinished" replace />} />
          <Route
            path="users"
            element={
              <div className={styles.usersLayout}>
                <UserList />
              </div>
            }
          />
          <Route path="announcements" element={<ManageAnnouncements />} />
          <Route path="feedback" element={<ManageFeedback />} />
          <Route path="policies" element={<PolicyManagement />} />
          <Route path="style-guide" element={<StyleGuide />} />
          <Route path="unfinished" element={<UnfinishedItems />} />
          <Route path="unfinished/geography" element={<GeographyAnalysis />} />
          <Route path="unfinished/medicare-pos" element={<TestProviderOfServices />} />
          <Route path="unfinished/medicare-pos-enriched" element={<TestProviderOfServicesEnriched />} />
          <Route path="unfinished/referral-pathways" element={<ReferralPathways />} />
          <Route path="unfinished/mobile-workshop" element={<MobileNavigationWorkshop />} />
          <Route path="*" element={<Navigate to="unfinished" replace />} />
        </Routes>
      </div>
    </div>
  );
}
