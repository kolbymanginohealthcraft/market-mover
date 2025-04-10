// src/pages/LegalLayout.jsx

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './TermsAndConditions.module.css';
import LegalNavbar from '../components/LegalNavbar';  // Import the updated LegalNavbar

function LegalLayout() {
  // Scroll to top when switching between tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const closeWindow = () => {
    window.close(); // Closes the popup window
  };

  return (
    <div className={styles.container}>
      {/* Render the custom LegalNavbar */}
      <LegalNavbar closeWindow={closeWindow} />

      <div className={styles.contentWrapper}>
        {/* Render the content of the selected tab */}
        <Outlet />
      </div>
    </div>
  );
}

export default LegalLayout;
