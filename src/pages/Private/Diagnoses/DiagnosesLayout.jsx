import { Routes, Route, Navigate } from 'react-router-dom';
import DiagnosesTagsView from './DiagnosesTagsView';
import DiagnosesBrowseView from './DiagnosesBrowseView';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { Lock } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import { useNavigate } from 'react-router-dom';
import styles from './Diagnoses.module.css';

export default function DiagnosesLayout() {
  const { hasTeam, loading } = useUserTeam();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Loading diagnoses...
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
          <p>Join or create a team to access diagnosis tagging features.</p>
          <p>These features help you collaborate with your team and manage diagnosis relationships.</p>
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
        <Route path="tags" element={<DiagnosesTagsView />} />
        <Route path="browse" element={<DiagnosesBrowseView />} />
        <Route path="*" element={<Navigate to="tags" replace />} />
      </Routes>
    </div>
  );
}

