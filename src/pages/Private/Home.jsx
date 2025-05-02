import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.hero}>Welcome to Market Mover 👋</h1>
        <p className={styles.subtext}>
          Your data-powered command center for smarter growth decisions.
        </p>
      </header>

      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🕘 Recent Activity</h3>
            <ul className={styles.activityList}>
              <li>Viewed provider: <strong>Sunrise Rehab Center</strong></li>
              <li>Explored market: <strong>Chicago Metro</strong></li>
              <li>Compared scorecards in <strong>Dallas-Fort Worth</strong></li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🧰 Recommended Tools</h3>
            <div className={styles.toolGrid}>
              <Link to="/app/markets" className={styles.toolCard}>
                📍 Saved Markets
              </Link>
              <Link to="/app/charts" className={styles.toolCard}>
                📊 Performance Trends
              </Link>
              <Link to="/app/profile" className={styles.toolCard}>
                👤 Manage My Account
              </Link>
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <h2 className={styles.heading}>What would you like to do?</h2>

          <div className={styles.optionsGrid}>
            <Link to="/app/search" className={styles.card}>
              <div className={styles.icon}>🔍</div>
              <div className={styles.label}>Search for a Provider</div>
            </Link>
            <Link to="/app/explore" className={styles.card}>
              <div className={styles.icon}>🌐</div>
              <div className={styles.label}>Explore the Industry</div>
            </Link>
            <Link to="/app/decision" className={styles.card}>
              <div className={styles.icon}>💡</div>
              <div className={styles.label}>Help Me Decide</div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
