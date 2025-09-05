import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import styles from './SubNavigation.module.css';
import { hasPlatformAccess, isTeamAdmin } from '../../utils/roleHelpers';
import { supabase } from '../../app/supabaseClient';
import { useUserTeam } from '../../hooks/useUserTeam';

const SubNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [marketsViewMode, setMarketsViewMode] = useState('list');
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasTeam } = useUserTeam();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  
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

  // Handle legal page navigation
  if (location.pathname === '/legal') {
    const currentTab = new URLSearchParams(location.search).get('tab') || 'terms';
    
    const tabs = [
      { id: "terms", label: "Terms", icon: FileText, path: "/legal?tab=terms" },
      { id: "privacy", label: "Privacy", icon: Shield, path: "/legal?tab=privacy" },
      { id: "refund", label: "Refund", icon: CreditCard, path: "/legal?tab=refund" }
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
    if (!hasTeam) {
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
    if (!hasTeam) {
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

  // Handle provider pages
  if (location.pathname.includes('/provider/')) {
    const pathSegments = location.pathname.split('/');
    const providerIndex = pathSegments.findIndex(segment => segment === 'provider');
    const dhcIndex = providerIndex + 1;

    // Construct base path up to the provider DHC
    const basePath = pathSegments.slice(0, dhcIndex + 1).join('/');

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
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview`, locked: false },
      { id: "provider-listing", label: "Provider Listing", icon: Users, path: `${basePath}/provider-listing`, locked: false },
      { id: "provider-density", label: "Provider Density", icon: MapPin, path: `${basePath}/provider-density`, locked: !hasTeam },
      { id: "population", label: "Population", icon: Users, path: `${basePath}/population`, locked: !hasTeam },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims`, locked: !hasTeam },
      { id: "catchment", label: "Catchment", icon: Target, path: `${basePath}/catchment`, locked: !hasTeam },
      { id: "enrollment", label: "Enrollment", icon: Activity, path: `${basePath}/cms-enrollment`, locked: !hasTeam },
      { id: "storyteller", label: "Storyteller", icon: Shield, path: `${basePath}/storyteller`, locked: !hasTeam }
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
        { id: "scorecard", label: "Scorecard", icon: BarChart3, path: `${basePath}/storyteller/scorecard` },
        { id: "benchmarks", label: "Benchmarks", icon: Activity, path: `${basePath}/storyteller/benchmarks` }
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
        { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/cms-enrollment/overview` },
        { id: "payers", label: "Payers", icon: CreditCard, path: `${basePath}/cms-enrollment/payers` }
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
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview`, locked: false },
      { id: "provider-listing", label: "Provider Listing", icon: Users, path: `${basePath}/provider-listing`, locked: false },
      { id: "provider-density", label: "Provider Density", icon: MapPin, path: `${basePath}/provider-density`, locked: !hasTeam },
      { id: "population", label: "Population", icon: Users, path: `${basePath}/population`, locked: !hasTeam },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims`, locked: !hasTeam },
      { id: "catchment", label: "Catchment", icon: Target, path: `${basePath}/catchment`, locked: !hasTeam },
      { id: "enrollment", label: "Enrollment", icon: Activity, path: `${basePath}/cms-enrollment`, locked: !hasTeam },
      { id: "storyteller", label: "Storyteller", icon: Shield, path: `${basePath}/storyteller`, locked: !hasTeam }
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
        { id: "scorecard", label: "Scorecard", icon: BarChart3, path: `${basePath}/storyteller/scorecard` },
        { id: "benchmarks", label: "Benchmarks", icon: Activity, path: `${basePath}/storyteller/benchmarks` }
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
         { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/cms-enrollment/overview` },
         { id: "payers", label: "Payers", icon: CreditCard, path: `${basePath}/cms-enrollment/payers` }
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

  // Handle settings pages
  if (location.pathname.includes('/settings')) {
    // Check if user can access restricted tabs
    const canAccessPlatform = hasPlatformAccess(userRole);
    const canAccessSubscription = true; // Remove team admin restriction - accessible to all users
    const canAccessUsers = isTeamAdmin(userRole);
    const canAccessColors = userRole !== null;

    // Special handling for platform sub-routes
    let currentActiveTab = activeTab;
    if (location.pathname.includes('/settings/platform')) {
      currentActiveTab = 'platform';
    } else if (location.pathname.includes('/settings/subscription')) {
      // Keep subscription tab active for all subscription-related routes
      currentActiveTab = 'subscription';
    }

    const allTabs = [
      { id: "profile", label: "Profile", icon: User, path: "/app/settings/profile", show: true },
      { id: "company", label: "Company", icon: Building2, path: "/app/settings/company", show: canAccessUsers },
      { id: "users", label: "Users", icon: Users, path: "/app/settings/users", show: canAccessUsers },
      { id: "branding", label: "Branding", icon: Palette, path: "/app/settings/branding", show: canAccessColors },
             { id: "subscription", label: "Subscription", icon: CreditCard, path: "/app/settings/subscription/manage", show: canAccessSubscription },
      { id: "platform", label: "Platform", icon: Settings, path: "/app/settings/platform", show: canAccessPlatform }
    ];

    // Filter tabs based on user permissions
    const visibleTabs = allTabs.filter(tab => tab.show);

    // If we're on a platform sub-page, render both navigation levels
    if (location.pathname.includes('/settings/platform/')) {
             // Determine the correct active platform sub-tab
       let currentPlatformTab = "analytics"; // Default to analytics
       
       if (location.pathname.includes('/analytics')) {
         currentPlatformTab = 'analytics';
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
        { id: "analytics", label: "Analytics Dashboard", icon: BarChart3, path: "/app/settings/platform/analytics" },
        { id: "announcements", label: "System Announcements", icon: MessageCircle, path: "/app/settings/platform/announcements" },
        { id: "feedback", label: "Feedback Approvals", icon: MessageCircle, path: "/app/settings/platform/feedback" },
        { id: "policies", label: "Policy Management", icon: FileText, path: "/app/settings/platform/policies" },
        { id: "style-guide", label: "Style Guide", icon: Palette, path: "/app/settings/platform/style-guide" }
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
           
           {/* Second level navigation - Platform sub-tabs */}
           <nav className={`${styles.subNavigation} ${styles.platformSubNav}`}>
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
         </>
       );
    }

         // If we're on a subscription sub-page, render both navigation levels
     if (location.pathname.includes('/settings/subscription/')) {
             // Determine the correct active subscription sub-tab
      let currentSubscriptionTab = "manage"; // Default to manage
      
      if (location.pathname.includes('/checkout')) {
        currentSubscriptionTab = 'checkout';
      } else if (location.pathname.includes('/manage')) {
        currentSubscriptionTab = 'manage';
      }

             const subscriptionTabs = [
        { id: "manage", label: "Manage", icon: Settings, path: "/app/settings/subscription/manage" },
        { id: "checkout", label: "Checkout", icon: Plus, path: "/app/settings/subscription/checkout" },
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

    // Regular settings page - just the first level navigation
    return (
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
    );
  }

  // Handle search page
  if (location.pathname.includes('/search')) {
    const searchTab = location.pathname.includes('/advanced') ? 'advanced' : 'basic';
    
    const tabs = [
      { id: "basic", label: "Search for a Provider", icon: Search, path: "/app/search/basic" },
      { 
        id: "advanced", 
        label: "Advanced Search", 
        icon: Settings, 
        path: "/app/search/advanced",
        requiresTeam: true
      }
    ];

    return (
      <nav className={styles.subNavigation}>
        <div className={styles.navLeft}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            
            // If tab requires team and user doesn't have one, show disabled version
            if (tab.requiresTeam && !hasTeam) {
              return (
                <div
                  key={tab.id}
                  className={`${styles.tab} ${styles.disabled}`}
                  title="Join or create a team to access advanced search features"
                >
                  <IconComponent size={16} />
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
                <IconComponent size={16} />
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
