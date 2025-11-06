import React from 'react';
import { UserCheck } from 'lucide-react';
import { useUser } from './Context/UserContext';
import Button from './Buttons/Button';
import styles from './ImpersonationBanner.module.css';

export default function ImpersonationBanner() {
  const { isImpersonating, profile, stopImpersonation } = useUser();
  const [stopping, setStopping] = React.useState(false);

  if (!isImpersonating) {
    return null;
  }

  const handleStopImpersonation = async () => {
    setStopping(true);
    const result = await stopImpersonation();
    if (result.success) {
      window.location.reload();
    } else {
      alert(`Failed to stop impersonation: ${result.error}`);
      setStopping(false);
    }
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <UserCheck className={styles.icon} />
        <span className={styles.text}>
          You are impersonating <strong>{profile?.first_name} {profile?.last_name}</strong> ({profile?.email})
        </span>
        <Button
          size="sm"
          variant="accent"
          onClick={handleStopImpersonation}
          disabled={stopping}
        >
          {stopping ? 'Stopping...' : 'Stop Impersonating'}
        </Button>
      </div>
    </div>
  );
}

