// src/pages/LegalLayout.jsx

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './TermsAndConditions.module.css';
import LegalNavbar from '../components/LegalNavbar';

function LegalLayout() {
  const location = useLocation();

  // Disable automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const closeWindow = () => {
    window.close();
  };

  return (
    <div className={styles.container}>
      <LegalNavbar closeWindow={closeWindow} />
      <div className={styles.contentWrapper}>
        <Outlet />
      </div>
    </div>
  );
}

export default LegalLayout;
