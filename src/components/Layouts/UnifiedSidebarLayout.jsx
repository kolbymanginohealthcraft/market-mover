import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../Navigation/Sidebar';
import PublicSidebar from '../Navigation/PublicSidebar';
import Header from '../Navigation/Header';
import SubNavigation from '../Navigation/SubNavigation';
import ImpersonationBanner from '../ImpersonationBanner';
import styles from './SidebarLayout.module.css';

export default function UnifiedSidebarLayout({ isPublic = false }) {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarDrawerOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === '[' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && isSidebarDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isSidebarDrawerOpen]);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    if (!isMobile || !isSidebarDrawerOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isSidebarDrawerOpen]);

  const handleDrawerToggle = () => {
    setIsSidebarDrawerOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setIsSidebarDrawerOpen(false);
  };

  const handleMenuToggle = () => {
    if (isMobile) {
      handleDrawerToggle();
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const SidebarComponent = isPublic ? PublicSidebar : Sidebar;

  return (
    <div className={`${styles.page} ${isMobile ? styles.mobile : ''}`}>
      <SidebarComponent
        isCollapsed={isMobile ? false : isSidebarCollapsed}
        onToggleCollapse={isMobile ? handleDrawerToggle : setIsSidebarCollapsed}
        isMobile={isMobile}
        isDrawerOpen={isMobile && isSidebarDrawerOpen}
        onCloseDrawer={handleDrawerClose}
      />
      {isMobile && isSidebarDrawerOpen && (
        <button
          type="button"
          className={styles.drawerBackdrop}
          onClick={handleDrawerClose}
          aria-label="Close navigation overlay"
        />
      )}
      <div
        className={`${styles.contentArea} ${isSidebarCollapsed && !isMobile ? styles.sidebarCollapsed : ''}`}
        aria-hidden={isMobile && isSidebarDrawerOpen}
      >
        <Header
          onMenuToggle={handleMenuToggle}
          isMenuOpen={isMobile ? isSidebarDrawerOpen : !isSidebarCollapsed}
          isMobile={isMobile}
          isSidebarCollapsed={!isMobile && isSidebarCollapsed}
        />
        <ImpersonationBanner />
        <SubNavigation />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
