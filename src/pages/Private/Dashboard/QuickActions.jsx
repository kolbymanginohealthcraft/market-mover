import { Link } from 'react-router-dom';
import Button from '../../../components/Buttons/Button';
import styles from './QuickActions.module.css';

export default function QuickLinksSidebar() {
  return (
    <div className={styles.toolGrid}>
      <div className={styles.currentLocation}>
        <Button variant="gray" size="md" className={styles.quickLinkButton} disabled>
          <span className={styles.emoji}>📊</span>
          <span className={styles.buttonText}>Dashboard</span>
          <span className={styles.currentBadge}>You are here</span>
        </Button>
      </div>
      <Link to="/app/search">
        <Button variant="blue" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🔍</span>
          <span className={styles.buttonText}>Search Providers</span>
        </Button>
      </Link>

      <Link to="/app/markets">
        <Button variant="green" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>📍</span>
          <span className={styles.buttonText}>View Saved Markets</span>
        </Button>
      </Link>
      <Link to="/app/market/create">
        <Button variant="gold" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🧪</span>
          <span className={styles.buttonText}>Create Market</span>
        </Button>
      </Link>
      <Link to="/app/settings">
        <Button variant="accent" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>⚙️</span>
          <span className={styles.buttonText}>Settings</span>
        </Button>
      </Link>
      <Link to="/app/feedback">
        <Button variant="purple" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>💬</span>
          <span className={styles.buttonText}>Feedback</span>
        </Button>
      </Link>
    </div>
  );
} 