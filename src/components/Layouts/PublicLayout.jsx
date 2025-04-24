import { Outlet } from 'react-router-dom';
import Navbar from '../Navigation/Navbar'; // shows login/signup
import { Analytics } from '@vercel/analytics/react';
import styles from './Layout.module.css';

export default function PublicLayout() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Analytics />
    </div>
  );
}
