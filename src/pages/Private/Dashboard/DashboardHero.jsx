import styles from './DashboardHero.module.css';

export default function DashboardHero({ greeting, quote }) {
  return (
    <header className={styles.heroBox}>
      <h1 className={styles.hero}>{greeting}</h1>
      <p className={styles.subtext}>{quote}</p>
    </header>
  );
} 