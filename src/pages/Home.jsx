import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Welcome! What would you like to do?</h2>
      <div className={styles.optionsGrid}>
        <Link to="/search" className={styles.card}>
          <div className={styles.icon}>🔍</div>
          <div className={styles.label}>Search for a Provider</div>
        </Link>
        <Link to="/explore" className={styles.card}>
          <div className={styles.icon}>🌐</div>
          <div className={styles.label}>Explore the Industry</div>
        </Link>
        <Link to="/decision" className={styles.card}>
          <div className={styles.icon}>💡</div>
          <div className={styles.label}>Help Me Decide</div>
        </Link>
      </div>
    </div>
  );
}
