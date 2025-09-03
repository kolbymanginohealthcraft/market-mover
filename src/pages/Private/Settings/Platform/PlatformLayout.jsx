import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Settings, 
  FileText, 
  MessageCircle,
  Megaphone
} from 'lucide-react';
import { hasPlatformAccess } from '../../../../utils/roleHelpers';
import { supabase } from '../../../../app/supabaseClient';
import AnalyticsDashboard from './AnalyticsDashboard';
import ManageAnnouncements from './ManageAnnouncements';
import ManageFeedback from './ManageFeedback';
import PolicyManagement from './PolicyManagement';
import StyleGuide from './StyleGuide';
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

  // If user tries to access platform without permission, redirect to profile
  if (!loading && !canAccessPlatform) {
    return <Navigate to="/app/settings/profile" replace />;
  }

  return (
    <div className={styles.content}>
      <Routes>
        <Route index element={<Navigate to="analytics" replace />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="announcements" element={<ManageAnnouncements />} />
        <Route path="feedback" element={<ManageFeedback />} />
        <Route path="policies" element={<PolicyManagement />} />
        <Route path="style-guide" element={<StyleGuide />} />
        <Route path="*" element={<Navigate to="analytics" replace />} />
      </Routes>
    </div>
  );
}
