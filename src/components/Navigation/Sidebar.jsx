import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  MapPin, 
  Building2,
  FileText,
  Shield,
  Users,
  BarChart3,
  Bookmark,
  Network,
  Activity,
  Settings,
  Lightbulb,
  Code
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);
  const isProviderPage = location.pathname.includes('/provider/');
  const isMarketPage = location.pathname.includes('/market/') && !location.pathname.includes('/market/create');

  return (
    <div className={styles.sidebar}>
      {/* Brand Section */}
      <div className={styles.brand}>
        <div className={styles.logo}>MM</div>
        <div className={styles.brandText}>
          <div className={styles.brandName}>Market Mover</div>
          <div className={styles.companyName}>Healthcraft Creative Solutions</div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className={styles.navItems}>
        <Link to="/app/dashboard" className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}>
          <LayoutDashboard size={14} />
          Dashboard
        </Link>
        <Link to="/app/search" className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}>
          <Search size={14} />
          Search the Industry
        </Link>
        <Link to="/app/markets" className={`${styles.navItem} ${isActive('/markets') ? styles.active : ''}`}>
          <MapPin size={14} />
          My Markets
        </Link>
        <Link to="/app/network" className={`${styles.navItem} ${isActive('/network') ? styles.active : ''}`}>
          <Network size={14} />
          My Network
        </Link>

      </div>

            {/* Provider Analysis Section (only shown on provider pages) */}
      {isProviderPage && (
        <div className={styles.navItems}>
          <div className={`${styles.navItem} ${styles.active}`}>
            <Building2 size={14} />
            Provider Analysis
          </div>
        </div>
      )}

      {/* Market Analysis Section (only shown on market pages) */}
      {isMarketPage && (
        <div className={styles.navItems}>
          <div className={`${styles.navItem} ${styles.active}`}>
            <MapPin size={14} />
            Market Analysis
          </div>
        </div>
      )}

      {/* Bottom Navigation - Settings and Feedback */}
      <div className={styles.bottomNav}>
        <Link to="/app/settings" className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}>
          <Settings size={14} />
          Account Settings
        </Link>
        <Link to="/app/feedback" className={`${styles.navItem} ${isActive('/feedback') ? styles.active : ''}`}>
          <Lightbulb size={14} />
          Leave Feedback
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
