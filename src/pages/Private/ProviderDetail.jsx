import { useEffect, useState } from 'react';
import {
  useParams,
  useNavigate,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { supabase } from '../../app/supabaseClient';
import styles from './ProviderDetail.module.css';

import OverviewTab from './OverviewTab';
import NearbyTab from './NearbyTab';
import ScorecardTab from './ScorecardPage';
import ChartsTab from './ChartDashboard';
import SubNavbar from '../../components/Navigation/SubNavbar';
import Spinner from '../../components/Buttons/Spinner';

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
        .select(
          'id, name, network, type, street, city, state, zip, phone, latitude, longitude'
        )
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

  if (loading || !provider) return <Spinner message="Loading provider details..." />;

  return (
    <div className={styles.container}>
      <div className={styles.headerInfo}>
  <div>
    <h2>{provider.name}</h2>
    <p>
  {provider.street}, {provider.city}, {provider.state} {provider.zip}
  <span className={styles.typeBadge}>
    {provider.type || 'Unknown'}
  </span>
</p>

  </div>
  <button
    className={styles.buildMarketButton}
    onClick={() => navigate(`/provider/${id}/market`)}
  >
    Build Market
  </button>
</div>


      <SubNavbar providerId={id} />

      <Routes>
        <Route path="overview" element={<OverviewTab provider={provider} />} />
        <Route path="nearby" element={<NearbyTab provider={provider} />} />
        <Route path="scorecard" element={<ScorecardTab provider={provider} />} />
        <Route path="charts" element={<ChartsTab provider={provider} />} />
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="*" element={<p>404: Page Not Found</p>} />
      </Routes>
    </div>
  );
}
