import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  HelpCircle,
  Eye,
  Building2,
  MapPin,
  Search,
  MessageCircle,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Network,
  Settings
} from 'lucide-react';
import { useProviderContext } from '../Context/ProviderContext';
import { supabase } from '../../app/supabaseClient';
import styles from './Header.module.css';

const Header = ({ currentView, selectedMarket }) => {
  const [user, setUser] = useState(null);
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentMarket, setCurrentMarket] = useState(null);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProvider } = useProviderContext();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData) {
          setUserFirstName(profileData.first_name || '');
          setUserLastName(profileData.last_name || '');
          setUserEmail(profileData.email || user.email || '');
        } else {
          setUserEmail(user.email || '');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserEmail(user.email || '');
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch market data when on a market page
  useEffect(() => {
    const fetchMarketData = async () => {
      if (location.pathname.includes('/market/')) {
        const marketMatch = location.pathname.match(/\/market\/([^\/]+)/);
        const marketId = marketMatch ? marketMatch[1] : null;
        
        if (marketId) {
          try {
            const { data: marketData, error: marketError } = await supabase
              .from('markets')
              .select('name, radius_miles')
              .eq('id', marketId)
              .single();

            if (!marketError && marketData) {
              setCurrentMarket(marketData);
            } else {
              setCurrentMarket(null);
            }
          } catch (err) {
            console.error('Error fetching market data:', err);
            setCurrentMarket(null);
          }
        }
      } else {
        setCurrentMarket(null);
      }
    };

    fetchMarketData();
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
    } else {
      navigate("/");
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const getViewTitle = () => {
    if (location.pathname.includes('/dashboard')) {
      return 'Dashboard';
    } else if (location.pathname.includes('/search')) {
      return 'Search the Industry';
    } else if (location.pathname.includes('/markets')) {
      return 'Saved Markets';
    } else if (location.pathname.includes('/provider/')) {
      return 'Provider Analysis';
    } else if (location.pathname.includes('/market/')) {
      return 'Market Analysis';
    } else if (location.pathname.includes('/network')) {
      return 'My Network';
    } else if (location.pathname.includes('/settings')) {
      return 'Settings';
    } else if (location.pathname.includes('/feedback')) {
      return 'Leave Feedback';
    } else {
      return 'Market Mover';
    }
  };

  const getBreadcrumbItems = () => {
    // Provider Analysis Mode
    if (location.pathname.includes('/provider/') && currentProvider) {
      return [
        { text: currentProvider.name, type: 'provider' },
        { text: `${currentProvider.street}, ${currentProvider.city}, ${currentProvider.state} ${currentProvider.zip}`, type: 'location' },
        { text: currentProvider.type, type: 'category' }
      ];
    }
    
    // Market Analysis Mode
    if (location.pathname.includes('/market/')) {
      // Extract market ID from URL
      const marketMatch = location.pathname.match(/\/market\/([^\/]+)/);
      const marketId = marketMatch ? marketMatch[1] : null;
      
      if (marketId && currentMarket) {
        return [
          { text: currentMarket.name, type: 'market' },
          { text: `${currentMarket.radius_miles}-mile radius`, type: 'radius' }
        ];
      } else if (marketId) {
        // Fallback while loading or if market data not found
        return [
          { text: `Market ${marketId}`, type: 'market' },
          { text: '25-mile radius', type: 'radius' }
        ];
      }
    }
    
    // Default Mode (Dashboard, Search, Settings, etc.)
    const currentPath = location.pathname;
    
    if (currentPath.includes('/dashboard')) {
      return [
        { text: 'Performance analytics and market insights', type: 'description' }
      ];
    } else if (currentPath.includes('/search')) {
      return [
        { text: 'Find providers that you want to work with', type: 'description' }
      ];
    } else if (currentPath.includes('/markets')) {
      return [
        { text: 'Geographic market management and intelligence', type: 'description' }
      ];
    } else if (currentPath.includes('/network')) {
      return [
        { text: 'Manage your provider network and relationships', type: 'description' }
      ];
    } else if (currentPath.includes('/settings')) {
      return [
        { text: 'Platform configuration and account settings', type: 'description' }
      ];
    } else if (currentPath.includes('/feedback')) {
      return [
        { text: 'Share your thoughts and suggestions with us', type: 'description' }
      ];
    } else {
      // Fallback for any other pages
      return [
        { text: 'Healthcare intelligence and growth analytics platform', type: 'description' }
      ];
    }
  };

  const getModuleIcon = () => {
    if (location.pathname.includes('/dashboard')) {
      return <LayoutDashboard size={18} />;
    } else if (location.pathname.includes('/search')) {
      return <Search size={18} />;
    } else if (location.pathname.includes('/markets')) {
      return <MapPin size={18} />;
    } else if (location.pathname.includes('/provider/')) {
      return <Building2 size={18} />;
    } else if (location.pathname.includes('/market/')) {
      return <MapPin size={18} />;
    } else if (location.pathname.includes('/network')) {
      return <Network size={18} />;
    } else if (location.pathname.includes('/settings')) {
      return <Settings size={18} />;
    } else {
      return <LayoutDashboard size={18} />;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.titleSection}>
          <div className={styles.moduleIcon}>
            {getModuleIcon()}
          </div>
          <div className={styles.titleContent}>
            <h1 className={styles.pageTitle}>{getViewTitle()}</h1>
            <div className={styles.breadcrumb}>
              {getBreadcrumbItems().map((item, index) => (
                <React.Fragment key={index}>
                  <span className={`${styles.breadcrumbItem} ${styles[item.type]}`}>
                    {item.text}
                  </span>
                  {index < getBreadcrumbItems().length - 1 && (
                    <span className={styles.breadcrumbSeparator}>•</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.userSection}>
          {user && (
            <div className={styles.userProfileContainer} ref={dropdownRef}>
              <button 
                className={styles.userProfile} 
                onClick={toggleDropdown}
              >
                <div className={styles.userAvatar}>
                  {userFirstName ? userFirstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className={styles.userName}>{userFirstName || 'User'}</span>
                <ChevronDown size={16} className={`${styles.chevron} ${isDropdownOpen ? styles.rotated : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownAvatar}>
                      {userFirstName ? userFirstName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className={styles.dropdownUserInfo}>
                      <div className={styles.dropdownName}>
                        {userFirstName && userLastName ? `${userFirstName} ${userLastName}` : userFirstName || 'User'}
                      </div>
                      <div className={styles.dropdownEmail}>
                        {userEmail}
                      </div>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <button onClick={handleLogout} className={styles.dropdownLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
