import { Outlet } from 'react-router-dom';
import Navbar from '../Navigation/Navbar'; // shows login/signup
import DevelopmentBanner from '../Navigation/DevelopmentBanner';
import { Analytics } from '@vercel/analytics/react';
import styles from '../../styles/Layout.module.css';

export default function PublicLayout() {
  return (
    <div className={styles.page}>
      <DevelopmentBanner />
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Analytics />
    </div>
  );
}
