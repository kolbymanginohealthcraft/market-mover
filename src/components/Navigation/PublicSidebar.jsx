import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  HelpCircle,
  DollarSign,
  FileText,
  Shield,
  Mail,
  UserPlus
} from 'lucide-react';
import styles from './Sidebar.module.css';

const PublicSidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
        <Link to="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
          <Home size={14} />
          Home
        </Link>

        <Link to="/pricing" className={`${styles.navItem} ${isActive('/pricing') ? styles.active : ''}`}>
          <DollarSign size={14} />
          Pricing
        </Link>
        <Link to="/faq" className={`${styles.navItem} ${isActive('/faq') ? styles.active : ''}`}>
          <HelpCircle size={14} />
          FAQ
        </Link>
      </div>

      {/* Bottom Section */}
      <div className={styles.bottomNav}>
        <Link to="/login" className={`${styles.navItem} ${isActive('/login') ? styles.active : ''}`}>
          <Mail size={14} />
          Log In
        </Link>
        <Link to="/signup" className={`${styles.navItem} ${isActive('/signup') ? styles.active : ''}`}>
          <UserPlus size={14} />
          Sign Up
        </Link>
        <Link to="/legal" className={`${styles.navItem} ${isActive('/legal') ? styles.active : ''}`}>
          <FileText size={14} />
          Legal Info
        </Link>
        

      </div>
    </div>
  );
};

export default PublicSidebar;
