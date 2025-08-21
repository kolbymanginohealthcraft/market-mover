import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Navigation/Sidebar';
import Header from '../Navigation/Header';
import SubNavigation from '../Navigation/SubNavigation';
import styles from './SidebarLayout.module.css';

export default function SidebarLayout() {
  const location = useLocation();
  const isMarketsPage = location.pathname.includes('/markets') || location.pathname === '/app/markets';

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.contentArea}>
        <Header />
        <SubNavigation />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
