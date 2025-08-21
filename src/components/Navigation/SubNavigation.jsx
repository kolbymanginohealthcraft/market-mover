import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import styles from './SubNavigation.module.css';

const SubNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [marketsViewMode, setMarketsViewMode] = useState('list');
  
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

  // Handle Markets page navigation
  if (isMarketsPage) {
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
    } else if (location.pathname.includes('/enrollment')) {
      currentActiveTab = 'enrollment';
    } else if (location.pathname.includes('/cms-enrollment')) {
      currentActiveTab = 'cms-enrollment';
    } else if (location.pathname.includes('/storyteller')) {
      currentActiveTab = 'storyteller';
    } else if (location.pathname.includes('/overview') || location.pathname.endsWith(`/provider/${pathSegments[dhcIndex]}`)) {
      currentActiveTab = 'overview';
    }

    const tabs = [
      { id: "overview", label: "Overview", icon: BarChart3, path: `${basePath}/overview` },
      { id: "provider-listing", label: "Provider Listing", icon: Users, path: `${basePath}/provider-listing` },
      { id: "provider-density", label: "Provider Density", icon: MapPin, path: `${basePath}/provider-density` },
      { id: "population", label: "Population", icon: Users, path: `${basePath}/population` },
      { id: "claims", label: "Claims", icon: FileText, path: `${basePath}/claims` },
      { id: "enrollment", label: "Enrollment", icon: Activity, path: `${basePath}/enrollment` },
      { id: "cms-enrollment", label: "CMS Enrollment", icon: FileText, path: `${basePath}/cms-enrollment` },
      { id: "storyteller", label: "Storyteller", icon: Shield, path: `${basePath}/storyteller` }
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

  // Handle settings pages
  if (location.pathname.includes('/settings')) {
    const tabs = [
      { id: "profile", label: "Profile", icon: User, path: "/app/settings/profile" },
      { id: "company", label: "Company", icon: Building2, path: "/app/settings/company" },
      { id: "users", label: "Users", icon: Users, path: "/app/settings/users" },
      { id: "branding", label: "Branding", icon: Palette, path: "/app/settings/branding" },
      { id: "subscription", label: "Subscription", icon: CreditCard, path: "/app/settings/subscription" },
      { id: "platform", label: "Platform", icon: Settings, path: "/app/settings/platform" }
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

  // Handle search page
  if (location.pathname.includes('/search')) {
    const searchTab = new URLSearchParams(location.search).get('tab') || 'basic';
    
    const tabs = [
      { id: "basic", label: "Search for a Provider", icon: Search, path: "/app/search?tab=basic" },
      { id: "advanced", label: "Advanced Search", icon: Settings, path: "/app/search?tab=advanced" }
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
