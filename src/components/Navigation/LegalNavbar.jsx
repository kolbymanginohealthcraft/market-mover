// src/components/LegalNavbar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './LegalNavbar.module.css';

const LegalNavbar = ({ closeWindow }) => {
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      <div className={styles.navLinks}>
        {/* Tabs for Terms & Privacy */}
        <div className={styles.tabContainer}>
          <Link
            to="/legal/terms"
            className={location.pathname === '/legal/terms' ? styles.activeTab : styles.inactiveTab}
          >
            Terms & Conditions
          </Link>
          <Link
            to="/legal/privacy"
            className={location.pathname === '/legal/privacy' ? styles.activeTab : styles.inactiveTab}
          >
            Privacy Policy
          </Link>
        </div>

        {/* Close Window Button */}
        <button onClick={closeWindow} className={styles.closeButton}>
          Close Window
        </button>
      </div>
    </nav>
  );
};

export default LegalNavbar;
