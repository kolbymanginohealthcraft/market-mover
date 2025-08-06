import { Link } from 'react-router-dom';
import Button from '../Buttons/Button';
import styles from './QuickLinksSidebar.module.css';

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
      <Link to="/app/banner-test">
        <Button variant="gray" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🧪</span>
          <span className={styles.buttonText}>Banner Test</span>
        </Button>
      </Link>
      <Link to="/playground">
        <Button variant="teal" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🎨</span>
          <span className={styles.buttonText}>Button Playground</span>
        </Button>
      </Link>
      <Link to="/app/spinner-demo">
        <Button variant="indigo" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🌀</span>
          <span className={styles.buttonText}>Spinner Demo</span>
        </Button>
      </Link>
      
      {/* Paywall Components - Quick Access */}
      <Link to="/payment-flow">
        <Button variant="green" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>💳</span>
          <span className={styles.buttonText}>Payment Flow</span>
        </Button>
      </Link>
      <Link to="/app/billing">
        <Button variant="blue" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>📊</span>
          <span className={styles.buttonText}>Billing History</span>
        </Button>
      </Link>
      <Link to="/app/settings/subscription">
        <Button variant="purple" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🔧</span>
          <span className={styles.buttonText}>Subscription</span>
        </Button>
      </Link>
      <Link to="/auth/paymenttest">
        <Button variant="orange" size="md" className={styles.quickLinkButton}>
          <span className={styles.emoji}>🧪</span>
          <span className={styles.buttonText}>Payment Test</span>
        </Button>
      </Link>
    </div>
  );
} 