import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  MapPin, 
  Building2,
  Building,
  FileText,
  Shield,
  Users,
  UserCheck,
  BarChart3,
  Bookmark,
  Network,
  Activity,
  Settings,
  Lightbulb,
  Code,
  Lock,
  ChevronLeft,
  ChevronRight,
  Radius,
  Check,
  X,
  FileBarChart,
  Database
} from 'lucide-react';
import { useUserTeam } from '../../hooks/useUserTeam';
import { useState, useRef, useEffect } from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasTeam, loading } = useUserTeam();
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const tooltipRef = useRef(null);

  const isActive = (path) => location.pathname.includes(path);
  // Check for both legacy provider pages and new provider market analysis pages
  const isProviderPage = location.pathname.includes('/provider/') || location.pathname.match(/^\/app\/\d+\/market\//);
  // Market pages are only the standalone market analysis (not provider-based)
  const isMarketPage = location.pathname.match(/^\/app\/market\/[^/]+/) && !location.pathname.includes('/market/create');

  // Read radius from URL params for provider pages
  const currentRadius = isProviderPage ? (Number(searchParams.get('radius')) || 10) : 10;
  const [pendingRadius, setPendingRadius] = useState(currentRadius);
  
  // Update pending radius when URL changes
  useEffect(() => {
    if (isProviderPage) {
      const urlRadius = Number(searchParams.get('radius')) || 10;
      setPendingRadius(urlRadius);
    }
  }, [searchParams, isProviderPage]);

  const hasRadiusChanged = pendingRadius !== currentRadius;
  
  const handleApplyRadius = () => {
    const params = new URLSearchParams(searchParams);
    params.set('radius', pendingRadius.toString());
    setSearchParams(params, { replace: true });
  };

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
        <Link to="/app/dashboard" className={styles.brandLink}>
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
            to="/app/dashboard" 
            className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Dashboard')}
            onMouseLeave={handleMouseLeave}
          >
            <LayoutDashboard size={14} />
            {!isCollapsed && 'Dashboard'}
          </Link>
          <Link 
            to="/app/search/basic" 
            className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Search the Industry')}
            onMouseLeave={handleMouseLeave}
          >
            <Search size={14} />
            {!isCollapsed && 'Search the Industry'}
          </Link>
          
          <Link 
            to="/app/investigation/claims" 
            className={`${styles.navItem} ${isActive('/investigation/claims') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Claims Data Explorer')}
            onMouseLeave={handleMouseLeave}
          >
            <Database size={14} />
            {!isCollapsed && 'Claims Data Explorer'}
          </Link>
          
          <Link 
            to="/app/investigation/geography" 
            className={`${styles.navItem} ${isActive('/investigation/geography') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Geography Analysis (Test)')}
            onMouseLeave={handleMouseLeave}
          >
            <MapPin size={14} />
            {!isCollapsed && 'Geography Analysis (Test)'}
          </Link>
          
          <Link 
            to="/app/investigation/referral-pathways" 
            className={`${styles.navItem} ${isActive('/investigation/referral-pathways') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Referral Pathways')}
            onMouseLeave={handleMouseLeave}
          >
            <Users size={14} />
            {!isCollapsed && 'Referral Pathways'}
          </Link>
          
          <Link 
            to="/app/investigation/hco" 
            className={`${styles.navItem} ${isActive('/investigation/hco') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'HCO Analysis (Test)')}
            onMouseLeave={handleMouseLeave}
          >
            <Building size={14} />
            {!isCollapsed && 'HCO Analysis (Test)'}
          </Link>
          
          <Link 
            to="/app/investigation/hcp" 
            className={`${styles.navItem} ${isActive('/investigation/hcp') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'HCP Analysis (Test)')}
            onMouseLeave={handleMouseLeave}
          >
            <UserCheck size={14} />
            {!isCollapsed && 'HCP Analysis (Test)'}
          </Link>
          
          {/* Section divider */}
          {!isCollapsed && <div className={styles.sectionDivider}>My Parameters</div>}
          
          {hasTeam ? (
            <Link 
              to="/app/markets" 
              className={`${styles.navItem} ${isActive('/markets') ? styles.active : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'Saved Markets')}
              onMouseLeave={handleMouseLeave}
            >
              <MapPin size={14} />
              {!isCollapsed && 'Saved Markets'}
            </Link>
          ) : (
            <div 
              className={`${styles.navItem} ${styles.disabled}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'Saved Markets - Join or create a team to access markets and network features')}
              onMouseLeave={handleMouseLeave}
            >
              <MapPin size={14} />
              {!isCollapsed && 'Saved Markets'}
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
          {hasTeam ? (
            <Link 
              to="/app/procedures" 
              className={`${styles.navItem} ${isActive('/procedures') ? styles.active : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'My Procedures')}
              onMouseLeave={handleMouseLeave}
            >
              <FileBarChart size={14} />
              {!isCollapsed && 'My Procedures'}
            </Link>
          ) : (
            <div 
              className={`${styles.navItem} ${styles.disabled}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'My Procedures - Join or create a team to access procedure tagging features')}
              onMouseLeave={handleMouseLeave}
            >
              <FileBarChart size={14} />
              {!isCollapsed && 'My Procedures'}
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
            
            {/* Radius Selector - only shown when sidebar is expanded and on provider pages */}
            {!isCollapsed && isProviderPage && (
              <div className={styles.radiusControl}>
                <div className={styles.radiusHeader}>
                  <Radius size={12} />
                  <span className={styles.radiusTitle}>Analysis Radius</span>
                  <span className={styles.radiusValue}>{pendingRadius} mi</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={pendingRadius}
                  onChange={(e) => setPendingRadius(Number(e.target.value))}
                  className={styles.radiusSlider}
                />
                {hasRadiusChanged && (
                  <div className={styles.radiusActions}>
                    <button
                      onClick={handleApplyRadius}
                      className={styles.applyButton}
                    >
                      <Check size={12} />
                      Apply
                    </button>
                    <button
                      onClick={() => setPendingRadius(currentRadius)}
                      className={styles.cancelButton}
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
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
