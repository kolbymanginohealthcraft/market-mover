// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Analytics } from '@vercel/analytics/react';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      <Analytics />
    </div>
  );
}
