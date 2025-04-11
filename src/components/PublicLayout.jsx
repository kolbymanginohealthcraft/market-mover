// src/components/PublicLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Analytics } from '@vercel/analytics/react';
import styles from './Layout.module.css'; // ✅ Match the private layout wrapper

const PublicLayout = () => {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Analytics />
    </div>
  );
};

export default PublicLayout;
