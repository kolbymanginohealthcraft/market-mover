import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RadiusContext = createContext();

export const useRadius = () => {
  const context = useContext(RadiusContext);
  if (!context) {
    throw new Error('useRadius must be used within a RadiusProvider');
  }
  return context;
};

export const RadiusProvider = ({ children }) => {
  const [radiusInMiles, setRadiusInMiles] = useState(10);
  const location = useLocation();
  const navigate = useNavigate();

  const updateRadius = (newRadius) => {
    setRadiusInMiles(newRadius);
  };

  const resetRadius = () => {
    setRadiusInMiles(10);
  };

  // Reset radius when navigating away from provider pages
  useEffect(() => {
    const isProviderPage = location.pathname.includes('/provider/');
    console.log('🔍 RadiusContext: Location changed to:', location.pathname, 'isProviderPage:', isProviderPage);
    
    if (!isProviderPage) {
      console.log('🔄 RadiusContext: Resetting radius and clearing URL parameter');
      resetRadius();
      
      // Clear radius parameter from URL when leaving provider pages
      const url = new URL(window.location);
      if (url.searchParams.has('radius')) {
        console.log('🗑️ RadiusContext: Removing radius parameter from URL');
        url.searchParams.delete('radius');
        const newUrl = url.pathname + (url.search || '');
        console.log('🔗 RadiusContext: Navigating to:', newUrl);
        navigate(newUrl, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const value = {
    radiusInMiles,
    updateRadius,
    resetRadius
  };

  return (
    <RadiusContext.Provider value={value}>
      {children}
    </RadiusContext.Provider>
  );
};
