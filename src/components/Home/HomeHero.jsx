import styles from './HomeHero.module.css';

export default function HomeHero({ greeting, quote }) {
  return (
    <header className={styles.heroBox}>
      <h1 className={styles.hero}>{greeting}</h1>
      <p className={styles.subtext}>{quote}</p>
    </header>
  );
} 