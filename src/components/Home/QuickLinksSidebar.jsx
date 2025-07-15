import { Link } from 'react-router-dom';
import Button from '../Buttons/Button';
import styles from './QuickLinksSidebar.module.css';

export default function QuickLinksSidebar() {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.columnTitle}>🛠️ Quick Links</h2>

      <div className={styles.sidebarSection}>
        <div className={styles.toolGrid}>
          <Link to="/app/search">
            <Button variant="blue" size="md" className={styles.quickLinkButton}>
              <span className={styles.emoji}>🔍</span>
              <span className={styles.buttonText}>Search Markets</span>
            </Button>
          </Link>
          <Link to="/app/markets">
            <Button variant="green" size="md" className={styles.quickLinkButton}>
              <span className={styles.emoji}>📍</span>
              <span className={styles.buttonText}>Saved Markets</span>
            </Button>
          </Link>
          <Link to="/app/profile">
            <Button variant="accent" size="md" className={styles.quickLinkButton}>
              <span className={styles.emoji}>👤</span>
              <span className={styles.buttonText}>My Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
} 