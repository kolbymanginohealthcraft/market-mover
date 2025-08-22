import { Outlet, useLocation } from 'react-router-dom';
import PublicSidebar from '../Navigation/PublicSidebar';
import Header from '../Navigation/Header';
import SubNavigation from '../Navigation/SubNavigation';
import styles from './SidebarLayout.module.css';

export default function PublicSidebarLayout() {
  const location = useLocation();
  
  return (
    <div className={styles.page}>
      <PublicSidebar />
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
