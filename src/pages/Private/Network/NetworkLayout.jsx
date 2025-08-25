import { Routes, Route, Navigate } from 'react-router-dom';
import NetworkListView from './NetworkListView';
import NetworkMapView from './NetworkMapView';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { Lock } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import { useNavigate } from 'react-router-dom';
import styles from './Network.module.css';

export default function NetworkLayout() {
  const { hasTeam, loading } = useUserTeam();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Loading network...
        </div>
      </div>
    );
  }

  if (!hasTeam) {
    return (
      <div className={styles.container}>
        <div className={styles.teamRequiredState}>
          <div className={styles.teamRequiredIcon}>
            <Lock size={48} />
          </div>
          <h3>Team Required</h3>
          <p>Join or create a team to access markets and network features.</p>
          <p>These features help you collaborate with your team and manage provider relationships.</p>
          <div className={styles.teamRequiredActions}>
            <Button variant="gold" size="lg" onClick={() => navigate('/app/settings/company')}>
              Create Team
            </Button>
            <Button variant="blue" size="lg" outline onClick={() => navigate('/app/settings/users')}>
              Join Team
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Routes>
        <Route path="list" element={<NetworkListView />} />
        <Route path="map" element={<NetworkMapView />} />
        <Route path="*" element={<Navigate to="list" replace />} />
      </Routes>
    </div>
  );
}
