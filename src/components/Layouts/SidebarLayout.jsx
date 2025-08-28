import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../Navigation/Sidebar';
import Header from '../Navigation/Header';
import SubNavigation from '../Navigation/SubNavigation';
import styles from './SidebarLayout.module.css';

export default function SidebarLayout() {
  const location = useLocation();
  const isMarketsPage = location.pathname.includes('/markets') || location.pathname === '/app/markets';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut for sidebar toggle ([ key) - only when button is visible
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only allow shortcut if screen is larger than mobile (button is visible)
      if (window.innerWidth > 768) {
        // Check if [ key is pressed (single key, no modifiers)
        if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
          e.preventDefault(); // Prevent default browser behavior
          setIsSidebarCollapsed(!isSidebarCollapsed);
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarCollapsed]);

  return (
    <div className={styles.page}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
      />
      <div className={`${styles.contentArea} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <Header />
        <SubNavigation />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
