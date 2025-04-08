// ProviderDetail.jsx with Sub Navbar for Overview and Nearby Providers
import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from './ProviderDetail.module.css';

import OverviewTab from './Overview/OverviewTab';
import NearbyTab from './nearby/NearbyTab'; // New import for Nearby Providers

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      fontSize: '1.5rem',
      color: '#1DADBE'
    }}>
      <div className="loader" />
      Loading provider details...
      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1DADBE;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          margin-right: 10px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('org-dhc')
        .select('id, name, network, type, street, city, state, zip, phone, latitude, longitude')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching provider:', error);
        navigate('/search');
      } else {
        setProvider(data);
      }
      setLoading(false);
    };

    fetchProvider();
  }, [id, navigate]);

  if (loading || !provider) return <Spinner />;

  return (
    <div className={styles.container}>
      <div className={styles.subNavbar}>
        <NavLink
          to={`/provider/${id}/overview`}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.activeTab : ''}`}
        >
          Overview
        </NavLink>
        <NavLink
          to={`/provider/${id}/nearby`}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.activeTab : ''}`}
        >
          Nearby Providers
        </NavLink>
      </div>

      {provider && (
        <Routes>
          <Route path="overview" element={<OverviewTab provider={provider} />} />
          <Route path="nearby" element={<NearbyTab provider={provider} />} /> {/* New route for Nearby Providers */}
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="*" element={<p>404: Page Not Found</p>} />
        </Routes>
      )}
    </div>
  );
}
