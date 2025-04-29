// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from '../Navigation/Navbar'; // ✅ This is your only Navbar file
import Footer from '../Navigation/Footer';
import styles from '../../styles/Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.page}>
      <Navbar /> {/* ✅ use the shared Navbar */}
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
