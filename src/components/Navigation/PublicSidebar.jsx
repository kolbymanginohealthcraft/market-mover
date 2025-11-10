import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  HelpCircle,
  DollarSign,
  FileText,
  Shield,
  Mail,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import styles from './Sidebar.module.css';

const PublicSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  isDrawerOpen = false,
  onCloseDrawer
}) => {
  const location = useLocation();
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const tooltipRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const collapsed = isMobile ? false : isCollapsed;
  const sidebarClassName = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    isMobile ? styles.sidebarMobile : '',
    isMobile && isDrawerOpen ? styles.sidebarMobileOpen : ''
  ]
    .filter(Boolean)
    .join(' ');
  const dialogA11yProps = isMobile
    ? {
        role: 'dialog',
        'aria-modal': true,
        'aria-hidden': !isDrawerOpen
      }
    : {};
  const toggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse(!collapsed);
    }
  };

  const handleNavItemClick = () => {
    if (isMobile && onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const mobileLinkHandlers = isMobile ? { onClick: handleNavItemClick } : {};

  const handleMouseEnter = (e, text, alwaysShow = false) => {
    if (!isCollapsed && !alwaysShow) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      text,
      x: rect.right + 12,
      y: rect.top + rect.height / 2
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 });
  };

  useEffect(() => {
    if (tooltip.show && tooltipRef.current) {
      const tooltipElement = tooltipRef.current;
      tooltipElement.style.left = `${tooltip.x}px`;
      tooltipElement.style.top = `${tooltip.y}px`;
      tooltipElement.style.transform = 'translateY(-50%)';
    }
  }, [tooltip]);

  return (
    <>
      <div
        id="app-sidebar"
        className={sidebarClassName}
        tabIndex={isMobile ? -1 : undefined}
        {...dialogA11yProps}
      >
        {/* Brand Section */}
        <Link
          to="/"
          className={styles.brandLink}
          {...mobileLinkHandlers}
        >
          <div className={styles.brand}>
            <div className={styles.logo}>MM</div>
            {!isCollapsed && (
              <div className={styles.brandText}>
                <div className={styles.brandName}>Market Mover</div>
                <div className={styles.companyName}>Healthcraft Creative Solutions</div>
              </div>
            )}
          </div>
        </Link>

        {/* Main Navigation */}
        <div className={styles.navItems}>
          <Link 
            to="/" 
            className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Home')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
          >
            <Home size={14} />
            {!isCollapsed && 'Home'}
          </Link>

          <Link 
            to="/faq" 
            className={`${styles.navItem} ${isActive('/faq') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'FAQ')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
          >
            <HelpCircle size={14} />
            {!isCollapsed && 'FAQ'}
          </Link>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomNav}>
          <Link 
            to="/login" 
            className={`${styles.navItem} ${isActive('/login') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Log In')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
          >
            <Mail size={14} />
            {!isCollapsed && 'Log In'}
          </Link>
          <Link 
            to="/signup" 
            className={`${styles.navItem} ${isActive('/signup') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Sign Up')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
          >
            <UserPlus size={14} />
            {!isCollapsed && 'Sign Up'}
          </Link>
          <Link 
            to="/legal" 
            className={`${styles.navItem} ${isActive('/legal') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Legal Info')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
          >
            <FileText size={14} />
            {!isCollapsed && 'Legal Info'}
          </Link>
          <a 
            href="https://www.healthcraftcreative.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navItem}
            onMouseEnter={(e) => handleMouseEnter(e, 'Visit Healthcraft')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
          >
            <ExternalLink size={14} />
            {!isCollapsed && 'Visit Healthcraft'}
          </a>
        </div>

        {/* Collapse Toggle Button */}
        <button 
          className={styles.collapseButton}
          onClick={toggleSidebar}
          onMouseEnter={(e) => handleMouseEnter(e, isCollapsed ? 'Expand sidebar' : 'Collapse sidebar', true)}
          onMouseLeave={handleMouseLeave}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Custom Tooltip */}
      {tooltip.show && (
        <div 
          ref={tooltipRef}
          className={styles.customTooltip}
          style={{
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div className={styles.tooltipContent}>
            <span>{tooltip.text}</span>
            {tooltip.text.includes('sidebar') && (
              <span className={styles.keyboardShortcut}>[</span>
            )}
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}
    </>
  );
};

export default PublicSidebar;
