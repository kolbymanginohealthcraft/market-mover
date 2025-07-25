import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navigation/Navbar';
import AccountBanner from '../Navigation/AccountBanner';
import Footer from '../Navigation/Footer';
import styles from '../../styles/Layout.module.css';

export default function Layout() {
  const location = useLocation();
  const isStorytellerPage = location.pathname.includes('/storyteller');
  
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
