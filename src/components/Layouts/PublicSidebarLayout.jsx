import { Outlet, useLocation } from 'react-router-dom';
import PublicSidebar from '../Navigation/PublicSidebar';
import Header from '../Navigation/Header';
import styles from './SidebarLayout.module.css';

export default function PublicSidebarLayout() {
  return (
    <div className={styles.page}>
      <PublicSidebar />
      <div className={styles.contentArea}>
        <Header />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
