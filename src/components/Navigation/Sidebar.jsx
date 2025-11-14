import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Users,
  BarChart3,
  Settings,
  Lightbulb,
  Lock,
  ChevronLeft,
  ChevronRight,
  Radius,
  Check,
  X,
  LineChart,
  Target
} from 'lucide-react';
import { useUserTeam } from '../../hooks/useUserTeam';
import { useUser } from '../Context/UserContext';
import { useState, useRef, useEffect } from 'react';
import styles from './Sidebar.module.css';
import {
  getSegmentationIcon,
  getSegmentationIconProps
} from '../../utils/segmentationIcons';
import {
  getNavigationIcon,
  getNavigationIconProps
} from '../../utils/navigationIcons';

const Sidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  isDrawerOpen = false,
  onCloseDrawer
}) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasTeam, teamInfo, loading } = useUserTeam();
  const { permissions } = useUser();
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
  const prevUrlRadiusRef = useRef(currentRadius);
  
  // Update pending radius when URL changes
  useEffect(() => {
    if (isProviderPage) {
      const urlRadius = Number(searchParams.get('radius')) || 10;
      if (urlRadius !== prevUrlRadiusRef.current) {
        prevUrlRadiusRef.current = urlRadius;
        setPendingRadius(urlRadius);
      }
    }
  }, [searchParams, isProviderPage]);

  const hasRadiusChanged = pendingRadius !== currentRadius;
  const navigationIcons = {
    claims: getNavigationIcon('claims'),
    enrollment: getNavigationIcon('enrollment'),
    provider: getNavigationIcon('provider')
  };
  const navigationIconProps = getNavigationIconProps({ size: 14 });
  const ClaimsIcon = navigationIcons.claims;
  const EnrollmentIcon = navigationIcons.enrollment;
  const ProviderIcon = navigationIcons.provider;
  const segmentationNavItems = [
    {
      key: 'savedMarkets',
      label: 'My Markets',
      path: '/app/markets',
      tooltip: 'My Markets',
      lockedTooltip:
        'My Markets - Join or create a team to access markets and network features'
    },
    {
      key: 'network',
      label: 'My Network',
      path: '/app/network',
      tooltip: 'My Network',
      lockedTooltip:
        'My Network - Join or create a team to access markets and network features'
    },
    {
      key: 'procedures',
      label: 'My Procedures',
      path: '/app/procedures',
      tooltip: 'My Procedures',
      lockedTooltip:
        'My Procedures - Join or create a team to access procedure tagging features'
    },
    {
      key: 'diagnoses',
      label: 'My Diagnoses',
      path: '/app/diagnoses',
      tooltip: 'My Diagnoses',
      lockedTooltip:
        'My Diagnoses - Join or create a team to access diagnosis tagging features'
    },
    {
      key: 'metrics',
      label: 'My Metrics',
      path: '/app/metrics',
      tooltip: 'My Metrics',
      lockedTooltip:
        'My Metrics - Join or create a team to access metric tagging features'
    },
    {
      key: 'taxonomies',
      label: 'My Taxonomies',
      path: '/app/taxonomies',
      tooltip: 'My Taxonomies',
      lockedTooltip:
        'My Taxonomies - Join or create a team to access taxonomy tagging features'
    }
  ];
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
  
  const handleApplyRadius = () => {
    const params = new URLSearchParams(searchParams);
    params.set('radius', pendingRadius.toString());
    setSearchParams(params, { replace: true });
  };

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
          to="/app/dashboard"
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
          {!isCollapsed && <div className={styles.sectionDivider}>Market Intelligence</div>}
        <Link 
            to="/app/dashboard" 
            className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Dashboard')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            <LayoutDashboard size={14} />
            {!isCollapsed && 'Dashboard'}
          </Link>
        <Link 
            to="/app/search/basic" 
            className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Search the Industry')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            <Search size={14} />
            {!isCollapsed && 'Search the Industry'}
          </Link>
          
        <Link 
            to="/app/claims" 
            className={`${styles.navItem} ${isActive('/claims') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Claims Data Explorer')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            {ClaimsIcon && <ClaimsIcon {...navigationIconProps} />}
            {!isCollapsed && 'Claims Data Explorer'}
          </Link>
          
        <Link 
            to="/app/storyteller" 
            className={`${styles.navItem} ${isActive('/storyteller') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Quality Storyteller')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            <LineChart size={14} />
            {!isCollapsed && 'Quality Storyteller'}
          </Link>

        <Link 
            to="/app/population" 
            className={`${styles.navItem} ${isActive('/population') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Population Demographics')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            <Users size={14} />
            {!isCollapsed && 'Population Demographics'}
          </Link>

        <Link 
            to="/app/enrollment" 
            className={`${styles.navItem} ${isActive('/enrollment') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'CMS Enrollment')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            {EnrollmentIcon && <EnrollmentIcon {...navigationIconProps} />}
            {!isCollapsed && 'CMS Enrollment'}
          </Link>

        <Link 
            to="/app/catchment" 
            className={`${styles.navItem} ${isActive('/catchment') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Catchment')}
          onMouseLeave={handleMouseLeave}
          {...mobileLinkHandlers}
          >
            <Target size={14} />
            {!isCollapsed && 'Catchment'}
          </Link>
          
          {/* Section divider */}
          {!isCollapsed && (
            <div className={styles.sectionDivider}>Segmentation Workbench</div>
          )}

          {segmentationNavItems.map(
            ({ key, label, path, tooltip, lockedTooltip }) => {
              const IconComponent = getSegmentationIcon(key);
              const icon =
                IconComponent && (
                  <IconComponent {...getSegmentationIconProps({ size: 14 })} />
                );
              const isItemActive = isActive(path.replace('/app', ''));

              if (hasTeam) {
                return (
                  <Link
                    key={key}
                    to={path}
                    className={`${styles.navItem} ${
                      isItemActive ? styles.active : ''
                    }`}
                    onMouseEnter={(e) => handleMouseEnter(e, tooltip)}
                    onMouseLeave={handleMouseLeave}
                    {...mobileLinkHandlers}
                  >
                    {icon}
                    {!isCollapsed && label}
                  </Link>
                );
              }

              return (
                <div
                  key={key}
                  className={`${styles.navItem} ${styles.disabled}`}
                  onMouseEnter={(e) => handleMouseEnter(e, lockedTooltip)}
                  onMouseLeave={handleMouseLeave}
                >
                  {icon}
                  {!isCollapsed && label}
                  {!isCollapsed && (
                    <Lock size={12} style={{ marginLeft: 'auto' }} />
                  )}
                </div>
              );
            }
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
              {ProviderIcon ? (
                <ProviderIcon {...navigationIconProps} />
              ) : (
                <BarChart3 size={14} />
              )}
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
          {!isCollapsed && (
            <div className={styles.teamInfo}>
              {hasTeam && teamInfo ? (
                <span className={styles.teamName}>{teamInfo.name}</span>
              ) : (
                <span className={styles.freeUser}>Free user</span>
              )}
            </div>
          )}
          <Link 
            to="/app/settings" 
            className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}
            onMouseEnter={(e) => handleMouseEnter(e, 'Account Settings')}
            onMouseLeave={handleMouseLeave}
            {...mobileLinkHandlers}
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
              {...mobileLinkHandlers}
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
