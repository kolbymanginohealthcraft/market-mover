import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Building2, 
  Users, 
  Palette, 
  CreditCard, 
  Network,
  Settings,
  BarChart3,
  MapPin,
  FileText,
  Shield,
  Bookmark,
  List,
  Map,
  Plus,
  Lightbulb,
  MessageCircle,
  Search,
  Activity,
  ShoppingCart,
  Lock,
  TrendingUp,
  Target,
  HelpCircle,
  Scale,
  UserCheck,
  Construction,
  Database,
  ChevronDown,
  Layers
} from 'lucide-react';
import styles from './SubNavigation.module.css';
import { useUser } from '../Context/UserContext';
import { useUserTeam } from '../../hooks/useUserTeam';
import Dropdown from '../Buttons/Dropdown';
import { supabase } from '../../app/supabaseClient';
import {
  getNavigationIcon,
  getNavigationIconProps
} from '../../utils/navigationIcons';

const SubNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [marketsViewMode, setMarketsViewMode] = useState('list');
  const { user, profile, permissions, loading: userLoading } = useUser();
  const { hasTeam, loading: teamLoading } = useUserTeam();
  const [enrollmentMarkets, setEnrollmentMarkets] = useState([]);
  const [enrollmentDropdownOpen, setEnrollmentDropdownOpen] = useState(false);

  
  // Extract the active tab from the current path
  const pathSegments = location.pathname.split('/');
  let activeTab = pathSegments[pathSegments.length - 1] || "profile";
  
  // Special handling for storyteller nested routes
  if (location.pathname.includes('/storyteller')) {
    activeTab = 'storyteller';
  }

  // Determine if we're on the Markets page
  const isMarketsPage = location.pathname.includes('/markets') || location.pathname === '/app/markets';

  // Determine if we're on the Network page
  const isNetworkPage = location.pathname.includes('/network') || location.pathname === '/app/network';
  const isEnrollmentRoute = location.pathname.startsWith('/app/enrollment');

  useEffect(() => {
    async function fetchEnrollmentMarkets() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          setEnrollmentMarkets([]);
          return;
        }

        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEnrollmentMarkets(data || []);
      } catch (err) {
        console.error('Error fetching enrollment markets:', err);
        setEnrollmentMarkets([]);
      }
    }

    fetchEnrollmentMarkets();
  }, []);

  const enrollmentParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const enrollmentMarketId = isEnrollmentRoute ? enrollmentParams.get('marketId') : null;

  const selectedEnrollmentMarket = useMemo(() => {
    if (!isEnrollmentRoute) return null;
    if (!enrollmentMarkets.length) return null;
    if (!enrollmentMarketId) return null;
    return enrollmentMarkets.find((market) => String(market.id) === enrollmentMarketId) || null;
  }, [isEnrollmentRoute, enrollmentMarkets, enrollmentMarketId]);

  const handleEnrollmentMarketSelect = (marketId) => {
    if (!isEnrollmentRoute) return;
    const params = new URLSearchParams(location.search);
    if (marketId) {
      params.set('marketId', marketId);
    } else {
      params.delete('marketId');
    }
    const queryString = params.toString();
    navigate(queryString ? `${location.pathname}?${queryString}` : location.pathname);
    setEnrollmentDropdownOpen(false);
  };

  const toggleEnrollmentDropdown = (nextOpen) => {
    if (!isEnrollmentRoute) return;
    if (!enrollmentMarkets.length) return;
    setEnrollmentDropdownOpen(nextOpen);
  };

  // Handle legal page navigation
  if (location.pathname === '/legal') {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'terms';
    
    const tabs = [
      { id: "terms", label: "Terms and Conditions", icon: FileText, path: "/legal?tab=terms" },
      { id: "privacy", label: "Privacy Policy", icon: Shield, path: "/legal?tab=privacy" },
      { id: "refund", label: "Refund Policy", icon: CreditCard, path: "/legal?tab=refund" }
    ];

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle Markets page navigation
  if (isMarketsPage) {
    if (!teamLoading && !hasTeam) {
      return (
        <nav className={styles.subNavigation}>
          <div className={styles.navLeft}>
            <div className={`${styles.tab} ${styles.disabled}`} style={{ cursor: 'not-allowed' }}>
              <Lock size={16} />
              Team Required
            </div>
          </div>
          <div className={styles.navRight}>
            <div className={styles.teamRequiredMessage}>
              Join or create a team to access markets and network features
            </div>
          </div>
        </nav>
      );
    }

    // Determine the current view from the URL
    const currentView = location.pathname.includes('/markets/list') ? 'list' : 
                       location.pathname.includes('/markets/map') ? 'map' : 
                       location.pathname.includes('/markets/create') ? 'create' : 'list';

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <Link
            to="/app/markets/list"
            className={`${styles.tab} ${currentView === 'list' ? styles.active : ''}`}
          >
            <List size={16} />
            List
          </Link>
          <Link
            to="/app/markets/map"
            className={`${styles.tab} ${currentView === 'map' ? styles.active : ''}`}
          >
            <Map size={16} />
            Map
          </Link>
          <Link
            to="/app/markets/create"
            className={`${styles.tab} ${currentView === 'create' ? styles.active : ''}`}
          >
            <Plus size={16} />
            Create New Market
          </Link>
        </div>
      </nav>
    );
  }

  // Handle Network page navigation
  if (isNetworkPage) {
    if (!teamLoading && !hasTeam) {
      return (
        <nav className={styles.subNavigation}>
          <div className={styles.navLeft}>
            <div className={`${styles.tab} ${styles.disabled}`} style={{ cursor: 'not-allowed' }}>
              <Lock size={16} />
              Team Required
            </div>
          </div>
          <div className={styles.navRight}>
            <div className={styles.teamRequiredMessage}>
              Join or create a team to access markets and network features
            </div>
          </div>
        </nav>
      );
    }

    // Determine the current view from the URL
    const currentView = location.pathname.includes('/network/list') ? 'list' : 
                       location.pathname.includes('/network/map') ? 'map' : 'list';

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <Link
            to="/app/network/list"
            className={`${styles.tab} ${currentView === 'list' ? styles.active : ''}`}
          >
            <List size={16} />
            List
          </Link>
          <Link
            to="/app/network/map"
            className={`${styles.tab} ${currentView === 'map' ? styles.active : ''}`}
          >
            <Map size={16} />
            Map
          </Link>
        </div>
      </nav>
    );
  }

  // Handle standalone enrollment navigation
  if (isEnrollmentRoute) {
    const searchSuffix = location.search || '';
    const enrollmentTabs = [
      { id: 'overview', label: 'Overview', icon: BarChart3, path: `/app/enrollment/overview${searchSuffix}` },
      { id: 'listing', label: 'Payer Listing', icon: Users, path: `/app/enrollment/listing${searchSuffix}` },
      { id: 'payer', label: 'Payer Deep Dive', icon: Activity, path: `/app/enrollment/payer${searchSuffix}` }
    ];

    let currentEnrollmentTab = 'overview';
    if (location.pathname.includes('/listing')) {
      currentEnrollmentTab = 'listing';
    } else if (location.pathname.includes('/payer')) {
      currentEnrollmentTab = 'payer';
    }

    const hasEnrollmentMarkets = enrollmentMarkets.length > 0;
    const enrollmentMeta = selectedEnrollmentMarket
      ? {
          location: [selectedEnrollmentMarket.city, selectedEnrollmentMarket.state].filter(Boolean).join(', ') || 'Location unavailable',
          radius: selectedEnrollmentMarket.radius_miles ? `${selectedEnrollmentMarket.radius_miles} mi` : 'Radius not set',
        }
      : null;

    return (
      <>
        <div className={styles.enrollmentControlsRow}>
          <Dropdown
            trigger={
              <button
                type="button"
                className="sectionHeaderButton"
                disabled={!hasEnrollmentMarkets}
              >
                <MapPin size={14} />
                {hasEnrollmentMarkets
                  ? (selectedEnrollmentMarket ? selectedEnrollmentMarket.name : 'Select a saved market')
                  : 'No saved markets yet'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={enrollmentDropdownOpen && hasEnrollmentMarkets}
            onToggle={toggleEnrollmentDropdown}
            className={styles.enrollmentDropdownMenu}
          >
            <div className={styles.enrollmentDropdownList}>
              <button
                type="button"
                className={styles.enrollmentDropdownItem}
                onClick={() => handleEnrollmentMarketSelect(null)}
              >
                <span className={styles.enrollmentDropdownTitle}>No market selected</span>
              </button>
              {enrollmentMarkets.map((market) => (
                <button
                  key={market.id}
                  type="button"
                  className={styles.enrollmentDropdownItem}
                  onClick={() => handleEnrollmentMarketSelect(String(market.id))}
                >
                  <span className={styles.enrollmentDropdownTitle}>{market.name || 'Unnamed market'}</span>
                  <span className={styles.enrollmentDropdownSubtitle}>
                    {[market.city, market.state].filter(Boolean).join(', ')} · {market.radius_miles || 10} mi
                  </span>
                </button>
              ))}
            </div>
          </Dropdown>

          {enrollmentMeta && (
            <div className={styles.enrollmentMeta}>
              <span>{enrollmentMeta.location}</span>
              <span>{enrollmentMeta.radius}</span>
            </div>
          )}
        </div>

        <nav className={`${styles.subNavigation} ${styles.enrollmentSubNav}`}>
          <div className={styles.navLeft}>
            {enrollmentTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`${styles.tab} ${currentEnrollmentTab === tab.id ? styles.active : ''}`}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // Handle Procedures page navigation
  const isProceduresPage = location.pathname.includes('/procedures') || location.pathname === '/app/procedures';
  
  if (isProceduresPage) {
    if (!teamLoading && !hasTeam) {
      return (
        <nav className={styles.subNavigation}>
          <div className={styles.navLeft}>
            <div className={`${styles.tab} ${styles.disabled}`} style={{ cursor: 'not-allowed' }}>
              <Lock size={16} />
              Team Required
            </div>
          </div>
          <div className={styles.navRight}>
            <div className={styles.teamRequiredMessage}>
              Join or create a team to access procedure tagging features
            </div>
          </div>
        </nav>
      );
    }

    // Determine the current view from the URL
    const currentView = location.pathname.includes('/procedures/browse') ? 'browse' : 'tags';

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <Link
            to="/app/procedures/tags"
            className={`${styles.tab} ${currentView === 'tags' ? styles.active : ''}`}
          >
            <Bookmark size={16} />
            My Tags
          </Link>
          <Link
            to="/app/procedures/browse"
            className={`${styles.tab} ${currentView === 'browse' ? styles.active : ''}`}
          >
            <Search size={16} />
            Browse All
          </Link>
        </div>
      </nav>
    );
  }

  // Handle Diagnoses page navigation
  const isDiagnosesPage = location.pathname.includes('/diagnoses') || location.pathname === '/app/diagnoses';
  
  if (isDiagnosesPage) {
    if (!teamLoading && !hasTeam) {
      return (
        <nav className={styles.subNavigation}>
          <div className={styles.navLeft}>
            <div className={`${styles.tab} ${styles.disabled}`} style={{ cursor: 'not-allowed' }}>
              <Lock size={16} />
              Team Required
            </div>
          </div>
          <div className={styles.navRight}>
            <div className={styles.teamRequiredMessage}>
              Join or create a team to access diagnosis tagging features
            </div>
          </div>
        </nav>
      );
    }

    // Determine the current view from the URL
    const currentView = location.pathname.includes('/diagnoses/browse') ? 'browse' : 'tags';

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <Link
            to="/app/diagnoses/tags"
            className={`${styles.tab} ${currentView === 'tags' ? styles.active : ''}`}
          >
            <Bookmark size={16} />
            My Tags
          </Link>
          <Link
            to="/app/diagnoses/browse"
            className={`${styles.tab} ${currentView === 'browse' ? styles.active : ''}`}
          >
            <Search size={16} />
            Browse All
          </Link>
        </div>
      </nav>
    );
  }

  // Handle Metrics page navigation
  const isMetricsPage = location.pathname.includes('/metrics') || location.pathname === '/app/metrics';
  
  if (isMetricsPage) {
    if (!teamLoading && !hasTeam) {
      return (
        <nav className={styles.subNavigation}>
          <div className={styles.navLeft}>
            <div className={`${styles.tab} ${styles.disabled}`} style={{ cursor: 'not-allowed' }}>
              <Lock size={16} />
              Team Required
            </div>
          </div>
          <div className={styles.navRight}>
            <div className={styles.teamRequiredMessage}>
              Join or create a team to access metric tagging features
            </div>
          </div>
        </nav>
      );
    }

    // Determine the current view from the URL
    const currentView = location.pathname.includes('/metrics/browse') ? 'browse' : 'tags';

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <Link
            to="/app/metrics/tags"
            className={`${styles.tab} ${currentView === 'tags' ? styles.active : ''}`}
          >
            <Bookmark size={16} />
            My Tags
          </Link>
          <Link
            to="/app/metrics/browse"
            className={`${styles.tab} ${currentView === 'browse' ? styles.active : ''}`}
          >
            <Search size={16} />
            Browse All
          </Link>
        </div>
      </nav>
    );
  }

  // Handle Taxonomies page navigation
  const isTaxonomiesPage = location.pathname.includes('/taxonomies') || location.pathname === '/app/taxonomies';
  
  if (isTaxonomiesPage) {
    if (!teamLoading && !hasTeam) {
      return (
        <nav className={styles.subNavigation}>
          <div className={styles.navLeft}>
            <div className={`${styles.tab} ${styles.disabled}`} style={{ cursor: 'not-allowed' }}>
              <Lock size={16} />
              Team Required
            </div>
          </div>
          <div className={styles.navRight}>
            <div className={styles.teamRequiredMessage}>
              Join or create a team to access taxonomy tagging features
            </div>
          </div>
        </nav>
      );
    }

    // Determine the current view from the URL
    const currentView = location.pathname.includes('/taxonomies/browse') ? 'browse' : 'tags';

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          <Link
            to="/app/taxonomies/tags"
            className={`${styles.tab} ${currentView === 'tags' ? styles.active : ''}`}
          >
            <Bookmark size={16} />
            My Tags
          </Link>
          <Link
            to="/app/taxonomies/browse"
            className={`${styles.tab} ${currentView === 'browse' ? styles.active : ''}`}
          >
            <Search size={16} />
            Browse All
          </Link>
        </div>
      </nav>
    );
  }

  // Handle new provider market analysis pages (/app/:dhc/market/*)
  if (location.pathname.match(/^\/app\/\d+\/market\//)) {
    const pathSegments = location.pathname.split('/');
    const dhc = pathSegments[2]; // DHC is at position 2 in /app/:dhc/market/*
    const basePath = `/app/${dhc}/market`;
    
    // Preserve query params like ?radius=10
    const search = location.search;

    // Determine the correct active tab
    let currentActiveTab = "overview"; // Default to overview
    
    // Check for specific tab paths
    if (location.pathname.includes('/provider-listing')) {
      currentActiveTab = 'provider-listing';
    } else if (location.pathname.includes('/provider-density')) {
      currentActiveTab = 'provider-density';
    } else if (location.pathname.includes('/population')) {
      currentActiveTab = 'population';
    } else if (location.pathname.includes('/claims')) {
      currentActiveTab = 'claims';
    } else if (location.pathname.includes('/catchment')) {
      currentActiveTab = 'catchment';
    } else if (location.pathname.includes('/enrollment') || location.pathname.includes('/cms-enrollment')) {
      currentActiveTab = 'enrollment';
    } else if (location.pathname.includes('/storyteller')) {
      currentActiveTab = 'storyteller';
    } else if (location.pathname.includes('/overview') || location.pathname.endsWith(`/market`)) {
      currentActiveTab = 'overview';
    }

    const tabs = [
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview${search}`, locked: false },
      { id: "provider-listing", label: "Provider Listing", icon: Users, path: `${basePath}/provider-listing${search}`, locked: false },
      { id: "provider-density", label: "Provider Density", icon: MapPin, path: `${basePath}/provider-density${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "population", label: "Population", icon: Users, path: `${basePath}/population${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "catchment", label: "Catchment", icon: Target, path: `${basePath}/catchment${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "enrollment", label: "Enrollment", icon: Activity, path: `${basePath}/cms-enrollment${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "storyteller", label: "Storyteller", icon: Shield, path: `${basePath}/storyteller${search}`, locked: teamLoading ? false : !hasTeam }
    ];

    // If we're on a storyteller sub-page, render both navigation levels
    if (location.pathname.includes('/storyteller/')) {
      // Determine the correct active storyteller sub-tab
      let currentStorytellerTab = "scorecard"; // Default to scorecard
      
      if (location.pathname.includes('/scorecard')) {
        currentStorytellerTab = 'scorecard';
      } else if (location.pathname.includes('/benchmarks')) {
        currentStorytellerTab = 'benchmarks';
      }

      const storytellerTabs = [
        { id: "scorecard", label: "Scorecard", icon: BarChart3, path: `${basePath}/storyteller/scorecard${search}` },
        { id: "benchmarks", label: "Benchmarks", icon: Activity, path: `${basePath}/storyteller/benchmarks${search}` }
      ];

      return (
        <>
          {/* First level navigation - Provider/Market tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                if (tab.locked) {
                  return (
                    <div
                      key={tab.id}
                      className={`${styles.tab} ${styles.disabled}`}
                      title="Join or create a team to access this feature"
                    >
                      <IconComponent size={16} />
                      {tab.label}
                      <Lock size={12} style={{ marginLeft: '4px' }} />
                    </div>
                  );
                }
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Storyteller sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.storytellerSubNav}`}>
            <div className={styles.navLeft}>
              {storytellerTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentStorytellerTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

    // If we're on an enrollment sub-page, render both navigation levels
    if (location.pathname.includes('/cms-enrollment')) {
      // Determine the correct active enrollment sub-tab
      let currentEnrollmentTab = "overview"; // Default to overview
      
      if (location.pathname.includes('/overview')) {
        currentEnrollmentTab = 'overview';
      } else if (location.pathname.includes('/payers')) {
        currentEnrollmentTab = 'payers';
      }

      const enrollmentTabs = [
        { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/cms-enrollment/overview${search}` },
        { id: "payers", label: "Payers", icon: CreditCard, path: `${basePath}/cms-enrollment/payers${search}` }
      ];

      return (
        <>
          {/* First level navigation - Provider/Market tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                if (tab.locked) {
                  return (
                    <div
                      key={tab.id}
                      className={`${styles.tab} ${styles.disabled}`}
                      title="Join or create a team to access this feature"
                    >
                      <IconComponent size={16} />
                      {tab.label}
                      <Lock size={12} style={{ marginLeft: '4px' }} />
                    </div>
                  );
                }
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Enrollment sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.enrollmentSubNav}`}>
            <div className={styles.navLeft}>
              {enrollmentTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentEnrollmentTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            if (tab.locked) {
              return (
                <div
                  key={tab.id}
                  className={`${styles.tab} ${styles.disabled}`}
                  title="Join or create a team to access this feature"
                >
                  <IconComponent size={16} />
                  {tab.label}
                  <Lock size={12} style={{ marginLeft: '4px' }} />
                </div>
              );
            }
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle simple provider profile pages (/app/:dhc/* without /market)
  if (location.pathname.match(/^\/app\/\d+\//) && !location.pathname.includes('/market')) {
    const pathSegments = location.pathname.split('/');
    const dhc = pathSegments[2]; // DHC is at position 2 in /app/:dhc/*
    const basePath = `/app/${dhc}`;
    
    // Determine the current active tab
    let currentActiveTab = "overview"; // Default to overview
    
    if (location.pathname.includes('/claims')) {
      currentActiveTab = 'claims';
    } else if (location.pathname.includes('/storyteller')) {
      currentActiveTab = 'storyteller';
    } else if (location.pathname.includes('/overview') || location.pathname === basePath) {
      currentActiveTab = 'overview';
    }

    const tabs = [
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview` },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims` },
      { id: "storyteller", label: "Quality Measures", icon: Shield, path: `${basePath}/storyteller` }
    ];

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle legacy provider pages (/app/provider/:dhc/*)
  if (location.pathname.includes('/provider/')) {
    const pathSegments = location.pathname.split('/');
    const providerIndex = pathSegments.findIndex(segment => segment === 'provider');
    const dhcIndex = providerIndex + 1;

    // Construct base path up to the provider DHC
    const basePath = pathSegments.slice(0, dhcIndex + 1).join('/');
    
    // Preserve query params like ?radius=10
    const search = location.search;

    // Determine the correct active tab
    let currentActiveTab = "overview"; // Default to overview
    
    // Check for specific tab paths
    if (location.pathname.includes('/provider-listing')) {
      currentActiveTab = 'provider-listing';
    } else if (location.pathname.includes('/provider-density')) {
      currentActiveTab = 'provider-density';
    } else if (location.pathname.includes('/population')) {
      currentActiveTab = 'population';
    } else if (location.pathname.includes('/claims')) {
      currentActiveTab = 'claims';
    } else if (location.pathname.includes('/catchment')) {
      currentActiveTab = 'catchment';
    } else if (location.pathname.includes('/enrollment') || location.pathname.includes('/cms-enrollment')) {
      currentActiveTab = 'enrollment';
    } else if (location.pathname.includes('/storyteller')) {
      currentActiveTab = 'storyteller';
    } else if (location.pathname.includes('/overview') || location.pathname.endsWith(`/provider/${pathSegments[dhcIndex]}`)) {
      currentActiveTab = 'overview';
    }

    const tabs = [
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview${search}`, locked: false },
      { id: "provider-listing", label: "Provider Listing", icon: Users, path: `${basePath}/provider-listing${search}`, locked: false },
      { id: "provider-density", label: "Provider Density", icon: MapPin, path: `${basePath}/provider-density${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "population", label: "Population", icon: Users, path: `${basePath}/population${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "catchment", label: "Catchment", icon: Target, path: `${basePath}/catchment${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "enrollment", label: "Enrollment", icon: Activity, path: `${basePath}/cms-enrollment${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "storyteller", label: "Storyteller", icon: Shield, path: `${basePath}/storyteller${search}`, locked: teamLoading ? false : !hasTeam }
    ];

    // If we're on a storyteller sub-page, render both navigation levels
    if (location.pathname.includes('/storyteller/')) {
      // Determine the correct active storyteller sub-tab
      let currentStorytellerTab = "scorecard"; // Default to scorecard
      
      if (location.pathname.includes('/scorecard')) {
        currentStorytellerTab = 'scorecard';
      } else if (location.pathname.includes('/benchmarks')) {
        currentStorytellerTab = 'benchmarks';
      }

      const storytellerTabs = [
        { id: "scorecard", label: "Scorecard", icon: BarChart3, path: `${basePath}/storyteller/scorecard${search}` },
        { id: "benchmarks", label: "Benchmarks", icon: Activity, path: `${basePath}/storyteller/benchmarks${search}` }
      ];

      return (
        <>
          {/* First level navigation - Provider/Market tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                if (tab.locked) {
                  return (
                    <div
                      key={tab.id}
                      className={`${styles.tab} ${styles.disabled}`}
                      title="Join or create a team to access this feature"
                    >
                      <IconComponent size={16} />
                      {tab.label}
                      <Lock size={12} style={{ marginLeft: '4px' }} />
                    </div>
                  );
                }
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Storyteller sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.storytellerSubNav}`}>
            <div className={styles.navLeft}>
              {storytellerTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentStorytellerTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

    // If we're on an enrollment sub-page, render both navigation levels
    if (location.pathname.includes('/cms-enrollment')) {
      // Determine the correct active enrollment sub-tab
      let currentEnrollmentTab = "overview"; // Default to overview
      
      if (location.pathname.includes('/overview')) {
        currentEnrollmentTab = 'overview';
      } else if (location.pathname.includes('/payers')) {
        currentEnrollmentTab = 'payers';
      }

      const enrollmentTabs = [
        { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/cms-enrollment/overview${search}` },
        { id: "payers", label: "Payers", icon: CreditCard, path: `${basePath}/cms-enrollment/payers${search}` }
      ];

      return (
        <>
          {/* First level navigation - Provider/Market tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                if (tab.locked) {
                  return (
                    <div
                      key={tab.id}
                      className={`${styles.tab} ${styles.disabled}`}
                      title="Join or create a team to access this feature"
                    >
                      <IconComponent size={16} />
                      {tab.label}
                      <Lock size={12} style={{ marginLeft: '4px' }} />
                    </div>
                  );
                }
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Enrollment sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.enrollmentSubNav}`}>
            <div className={styles.navLeft}>
              {enrollmentTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentEnrollmentTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            if (tab.locked) {
              return (
                <div
                  key={tab.id}
                  className={`${styles.tab} ${styles.disabled}`}
                  title="Join or create a team to access this feature"
                >
                  <IconComponent size={16} />
                  {tab.label}
                  <Lock size={12} style={{ marginLeft: '4px' }} />
                </div>
              );
            }
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle market pages
  if (location.pathname.includes('/market/') && !location.pathname.includes('/market/create')) {
    const pathSegments = location.pathname.split('/');
    const marketIndex = pathSegments.findIndex(segment => segment === 'market');
    const marketIdIndex = marketIndex + 1;

    // Construct base path up to the market ID
    const basePath = pathSegments.slice(0, marketIdIndex + 1).join('/');
    
    // Preserve query params like ?radius=10
    const search = location.search;

    // Determine the correct active tab
    let currentActiveTab = "overview"; // Default to overview
    
    // Check for specific tab paths
    if (location.pathname.includes('/provider-listing')) {
      currentActiveTab = 'provider-listing';
    } else if (location.pathname.includes('/provider-density')) {
      currentActiveTab = 'provider-density';
    } else if (location.pathname.includes('/population')) {
      currentActiveTab = 'population';
    } else if (location.pathname.includes('/claims')) {
      currentActiveTab = 'claims';
    } else if (location.pathname.includes('/catchment')) {
      currentActiveTab = 'catchment';
    } else if (location.pathname.includes('/enrollment') || location.pathname.includes('/cms-enrollment')) {
      currentActiveTab = 'enrollment';
    } else if (location.pathname.includes('/storyteller')) {
      currentActiveTab = 'storyteller';
    } else if (location.pathname.includes('/overview') || location.pathname.endsWith(`/market/${pathSegments[marketIdIndex]}`)) {
      currentActiveTab = 'overview';
    }

    const tabs = [
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview${search}`, locked: false },
      { id: "provider-listing", label: "Provider Listing", icon: Users, path: `${basePath}/provider-listing${search}`, locked: false },
      { id: "provider-density", label: "Provider Density", icon: MapPin, path: `${basePath}/provider-density${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "population", label: "Population", icon: Users, path: `${basePath}/population${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "catchment", label: "Catchment", icon: Target, path: `${basePath}/catchment${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "enrollment", label: "Enrollment", icon: Activity, path: `${basePath}/cms-enrollment${search}`, locked: teamLoading ? false : !hasTeam },
      { id: "storyteller", label: "Storyteller", icon: Shield, path: `${basePath}/storyteller${search}`, locked: teamLoading ? false : !hasTeam }
    ];

    // If we're on a storyteller sub-page, render both navigation levels
    if (location.pathname.includes('/storyteller/')) {
      // Determine the correct active storyteller sub-tab
      let currentStorytellerTab = "scorecard"; // Default to scorecard
      
      if (location.pathname.includes('/scorecard')) {
        currentStorytellerTab = 'scorecard';
      } else if (location.pathname.includes('/benchmarks')) {
        currentStorytellerTab = 'benchmarks';
      }

      const storytellerTabs = [
        { id: "scorecard", label: "Scorecard", icon: BarChart3, path: `${basePath}/storyteller/scorecard${search}` },
        { id: "benchmarks", label: "Benchmarks", icon: Activity, path: `${basePath}/storyteller/benchmarks${search}` }
      ];

      return (
        <>
          {/* First level navigation - Market tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                if (tab.locked) {
                  return (
                    <div
                      key={tab.id}
                      className={`${styles.tab} ${styles.disabled}`}
                      title="Join or create a team to access this feature"
                    >
                      <IconComponent size={16} />
                      {tab.label}
                      <Lock size={12} style={{ marginLeft: '4px' }} />
                    </div>
                  );
                }
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Storyteller sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.storytellerSubNav}`}>
            <div className={styles.navLeft}>
              {storytellerTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentStorytellerTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

     // If we're on an enrollment sub-page, render both navigation levels
     if (location.pathname.includes('/cms-enrollment')) {
       // Determine the correct active enrollment sub-tab
       let currentEnrollmentTab = "overview"; // Default to overview
       
       if (location.pathname.includes('/overview')) {
         currentEnrollmentTab = 'overview';
       } else if (location.pathname.includes('/payers')) {
         currentEnrollmentTab = 'payers';
       }

       const enrollmentTabs = [
         { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/cms-enrollment/overview${search}` },
         { id: "payers", label: "Payers", icon: CreditCard, path: `${basePath}/cms-enrollment/payers${search}` }
       ];

       return (
         <>
           {/* First level navigation - Market tabs */}
           <nav className={styles.subNavigation}>
             <div className={styles.navLeft}>
               {tabs.map((tab) => {
                 const IconComponent = tab.icon;
                 if (tab.locked) {
                   return (
                     <div
                       key={tab.id}
                       className={`${styles.tab} ${styles.disabled}`}
                       title="Join or create a team to access this feature"
                     >
                       <IconComponent size={16} />
                       {tab.label}
                       <Lock size={12} style={{ marginLeft: '4px' }} />
                     </div>
                   );
                 }
                 return (
                   <Link
                     key={tab.id}
                     to={tab.path}
                     className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                   >
                     <IconComponent size={16} />
                     {tab.label}
                   </Link>
                 );
               })}
             </div>
           </nav>
           
           {/* Second level navigation - Enrollment sub-tabs */}
           <nav className={`${styles.subNavigation} ${styles.enrollmentSubNav}`}>
             <div className={styles.navLeft}>
               {enrollmentTabs.map((tab) => {
                 const IconComponent = tab.icon;
                 return (
                   <Link
                     key={tab.id}
                     to={tab.path}
                     className={`${styles.tab} ${currentEnrollmentTab === tab.id ? styles.active : ''}`}
                   >
                     <IconComponent size={16} />
                     {tab.label}
                   </Link>
                 );
               })}
             </div>
           </nav>
         </>
       );
     }

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            if (tab.locked) {
              return (
                <div
                  key={tab.id}
                  className={`${styles.tab} ${styles.disabled}`}
                  title="Join or create a team to access this feature"
                >
                  <IconComponent size={16} />
                  {tab.label}
                  <Lock size={12} style={{ marginLeft: '4px' }} />
                </div>
              );
            }
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle platform pages (separate from settings)
  if (location.pathname.includes('/platform')) {
    const canAccessPlatform = permissions.canAccessPlatform;
    
    if (!canAccessPlatform) {
      return null;
    }

    let currentPlatformTab = "unfinished";
    
    if (location.pathname.includes('/unfinished')) {
      currentPlatformTab = 'unfinished';
    } else if (location.pathname.includes('/users')) {
      currentPlatformTab = 'users';
    } else if (location.pathname.includes('/announcements')) {
      currentPlatformTab = 'announcements';
    } else if (location.pathname.includes('/feedback')) {
      currentPlatformTab = 'feedback';
    } else if (location.pathname.includes('/policies')) {
      currentPlatformTab = 'policies';
    } else if (location.pathname.includes('/style-guide')) {
      currentPlatformTab = 'style-guide';
    }

    const platformTabs = [
      { id: "unfinished", label: "Unfinished", icon: Construction, path: "/app/platform/unfinished" },
      { id: "users", label: "User Management", icon: UserCheck, path: "/app/platform/users" },
      { id: "announcements", label: "System Announcements", icon: MessageCircle, path: "/app/platform/announcements" },
      { id: "feedback", label: "Feedback Approvals", icon: MessageCircle, path: "/app/platform/feedback" },
      { id: "policies", label: "Policy Management", icon: FileText, path: "/app/platform/policies" },
      { id: "style-guide", label: "Style Guide", icon: Palette, path: "/app/platform/style-guide" }
    ];

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {platformTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentPlatformTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle settings pages
  if (location.pathname.includes('/settings')) {
    // Check if user can access restricted tabs
    const canAccessSubscription = true; // Remove team admin restriction - accessible to all users
    const canAccessUsers = permissions.canAccessUsers;
    const canAccessColors = permissions.canAccessUsers; // Require team admin or above for branding

    // Special handling for subscription sub-routes
    let currentActiveTab = activeTab;
    if (location.pathname.includes('/settings/subscription')) {
      // Keep subscription tab active for all subscription-related routes
      currentActiveTab = 'subscription';
    } else if (location.pathname.includes('/settings/legal')) {
      currentActiveTab = 'legal';
    } else if (location.pathname.includes('/settings/faq')) {
      currentActiveTab = 'faq';
    }

    const allTabs = [
      { id: "profile", label: "Profile", icon: User, path: "/app/settings/profile", show: true },
      { id: "company", label: "Company", icon: Building2, path: "/app/settings/company", show: canAccessUsers },
      { id: "users", label: "Users", icon: Users, path: "/app/settings/users", show: canAccessUsers },
      { id: "branding", label: "Branding", icon: Palette, path: "/app/settings/branding", show: canAccessColors },
      { id: "subscription", label: "Subscription", icon: CreditCard, path: "/app/settings/subscription/manage", show: canAccessSubscription },
      { id: "faq", label: "FAQ", icon: HelpCircle, path: "/app/settings/faq", show: true },
      { id: "legal", label: "Legal", icon: Scale, path: "/app/settings/legal", show: true }
    ];

    // Filter tabs based on user permissions
    const visibleTabs = allTabs.filter(tab => tab.show);

    // If we're on a subscription sub-page, render both navigation levels
    if (location.pathname.includes('/settings/subscription/')) {
      // Determine the correct active subscription sub-tab
      const currentSubscriptionTab = 'manage';

      const subscriptionTabs = [
        { id: 'manage', label: 'Manage', icon: Settings, path: '/app/settings/subscription/manage' }
      ];

      return (
        <>
          {/* First level navigation - Settings tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {visibleTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Subscription sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.subscriptionSubNav}`}>
            <div className={styles.navLeft}>
              {subscriptionTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentSubscriptionTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

    // If we're on a legal sub-page, render both navigation levels
    if (location.pathname.includes('/settings/legal')) {
      // Determine the correct active legal sub-tab
      let currentLegalTab = "terms"; // Default to terms
      
      if (location.pathname.includes('?tab=terms') || location.pathname.endsWith('/legal')) {
        currentLegalTab = 'terms';
      } else if (location.pathname.includes('?tab=privacy')) {
        currentLegalTab = 'privacy';
      } else if (location.pathname.includes('?tab=refund')) {
        currentLegalTab = 'refund';
      }

      const legalTabs = [
        { id: "terms", label: "Terms and Conditions", icon: FileText, path: "/app/settings/legal?tab=terms" },
        { id: "privacy", label: "Privacy Policy", icon: Shield, path: "/app/settings/legal?tab=privacy" },
        { id: "refund", label: "Refund Policy", icon: CreditCard, path: "/app/settings/legal?tab=refund" }
      ];

      return (
        <>
          {/* First level navigation - Settings tabs */}
          <nav className={styles.subNavigation}>
            <div className={styles.navLeft}>
              {visibleTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Second level navigation - Legal sub-tabs */}
          <nav className={`${styles.subNavigation} ${styles.legalSubNav}`}>
            <div className={styles.navLeft}>
              {legalTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`${styles.tab} ${currentLegalTab === tab.id ? styles.active : ''}`}
                  >
                    <IconComponent size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      );
    }

    // Regular settings page - just the first level navigation
    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            const iconProps = tab.iconProps || { size: 16 };
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${currentActiveTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent {...iconProps} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle search page
  if (location.pathname.includes('/search')) {
    let searchTab = 'orgs';
    if (location.pathname.includes('/ind')) {
      searchTab = 'individuals';
    } else if (location.pathname.includes('/density')) {
      searchTab = 'density';
    }
    
    const searchOrgIconComponent =
      getNavigationIcon('searchOrganizations') || Building2;
    const defaultSearchIconProps = getNavigationIconProps({ size: 16 });

    const tabs = [
      {
        id: "orgs",
        label: "Search Organizations",
        icon: searchOrgIconComponent,
        iconProps: defaultSearchIconProps,
        path: "/app/search/orgs"
      },
      { 
        id: "individuals", 
        label: "Search Individuals", 
        icon: User, 
        path: "/app/search/ind",
        requiresTeam: true
      },
      {
        id: "density",
        label: "Density",
        icon: Layers,
        path: "/app/search/density"
      }
    ];

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            
            // If tab requires team and user doesn't have one, show disabled version
            const iconProps = tab.iconProps || { size: 16 };
            if (tab.requiresTeam && !teamLoading && !hasTeam) {
              return (
                <div
                  key={tab.id}
                  className={`${styles.tab} ${styles.disabled}`}
                  title="Join or create a team to access advanced search features"
                >
                  <IconComponent {...iconProps} />
                  {tab.label}
                  <Lock size={12} style={{ marginLeft: 'auto' }} />
                </div>
              );
            }
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${searchTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent {...iconProps} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Handle feedback page
  if (location.pathname.includes('/feedback')) {
    const activeTab = new URLSearchParams(location.search).get('tab') || 'feature-requests';
    
    const tabs = [
      { id: "feature-requests", label: "Feature Requests", icon: Lightbulb, path: "/app/feedback?tab=feature-requests" },
      { id: "testimonials", label: "Share Experience", icon: MessageCircle, path: "/app/feedback?tab=testimonials" },
      { id: "my-submissions", label: "My Submissions", icon: FileText, path: "/app/feedback?tab=my-submissions" }
    ];

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <IconComponent size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Default: no sub-navigation
  return null;
};

export default SubNavigation;
