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
  Code,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUserTeam } from '../../hooks/useUserTeam';
import { useState, useRef, useEffect } from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const { hasTeam, loading } = useUserTeam();
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const tooltipRef = useRef(null);

  const isActive = (path) => location.pathname.includes(path);
  const isProviderPage = location.pathname.includes('/provider/');
  const isMarketPage = location.pathname.includes('/market/') && !location.pathname.includes('/market/create');

  const toggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse(!isCollapsed);
    }
  };

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
      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Brand Section */}
        <div className={styles.brand}>
          <div className={styles.logo}>MM</div>
          {!isCollapsed && (
            <div className={styles.brandText}>
              <div className={styles.brandName}>Market Mover</div>
              <div className={styles.companyName}>Healthcraft Creative Solutions</div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className={styles.navItems}>
          <Link 
            to="/app/dashboard" 
            className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Dashboard')}
            onMouseLeave={handleMouseLeave}
          >
            <LayoutDashboard size={14} />
            {!isCollapsed && 'Dashboard'}
          </Link>
          <Link 
            to="/app/search" 
            className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Search the Industry')}
            onMouseLeave={handleMouseLeave}
          >
            <Search size={14} />
            {!isCollapsed && 'Search the Industry'}
          </Link>
          {hasTeam ? (
            <Link 
              to="/app/markets" 
              className={`${styles.navItem} ${isActive('/markets') ? styles.active : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'My Markets')}
              onMouseLeave={handleMouseLeave}
            >
              <MapPin size={14} />
              {!isCollapsed && 'My Markets'}
            </Link>
          ) : (
            <div 
              className={`${styles.navItem} ${styles.disabled}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'My Markets - Join or create a team to access markets and network features')}
              onMouseLeave={handleMouseLeave}
            >
              <MapPin size={14} />
              {!isCollapsed && 'My Markets'}
              {!isCollapsed && <Lock size={12} style={{ marginLeft: 'auto' }} />}
            </div>
          )}
          {hasTeam ? (
            <Link 
              to="/app/network" 
              className={`${styles.navItem} ${isActive('/network') ? styles.active : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'My Network')}
              onMouseLeave={handleMouseLeave}
            >
              <Network size={14} />
              {!isCollapsed && 'My Network'}
            </Link>
          ) : (
            <div 
              className={`${styles.navItem} ${styles.disabled}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'My Network - Join or create a team to access markets and network features')}
              onMouseLeave={handleMouseLeave}
            >
              <Network size={14} />
              {!isCollapsed && 'My Network'}
              {!isCollapsed && <Lock size={12} style={{ marginLeft: 'auto' }} />}
            </div>
          )}
        </div>

        {/* Provider Analysis Section (only shown on provider pages) */}
        {isProviderPage && (
          <div className={styles.navItems}>
            <div 
              className={`${styles.navItem} ${styles.active}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'Provider Analysis')}
              onMouseLeave={handleMouseLeave}
            >
              <BarChart3 size={14} />
              {!isCollapsed && 'Provider Analysis'}
            </div>
          </div>
        )}

        {/* Market Analysis Section (only shown on market pages) */}
        {isMarketPage && (
          <div className={styles.navItems}>
            <div 
              className={`${styles.navItem} ${styles.active}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'Market Analysis')}
              onMouseLeave={handleMouseLeave}
            >
              <BarChart3 size={14} />
              {!isCollapsed && 'Market Analysis'}
            </div>
          </div>
        )}

        {/* Bottom Navigation - Settings and Feedback */}
        <div className={styles.bottomNav}>
          <Link 
            to="/app/settings" 
            className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Account Settings')}
            onMouseLeave={handleMouseLeave}
          >
            <Settings size={14} />
            {!isCollapsed && 'Account Settings'}
          </Link>
          {hasTeam && (
            <Link 
              to="/app/feedback" 
              className={`${styles.navItem} ${isActive('/feedback') ? styles.active : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'Leave Feedback')}
              onMouseLeave={handleMouseLeave}
            >
              <Lightbulb size={14} />
              {!isCollapsed && 'Leave Feedback'}
            </Link>
          )}
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

export default Sidebar;
