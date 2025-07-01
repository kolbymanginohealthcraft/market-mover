import React, { useEffect } from 'react';
import styles from './MarketPreview.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import exampleImg from '../../assets/example.png'; // ✅ Adjusted import path

export default function MarketPreview() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className={styles.section} data-aos="fade-up">
      <div className={styles.container}>
        <h2 className={styles.title}>See a Market in Action</h2>
        <p className={styles.subtitle}>
          Explore how Market Mover visualizes providers, performance, and referrals in a real geographic market.
        </p>
        <div className={styles.previewBox}>
          <img
            src={exampleImg} // ✅ Use imported image
            alt="Market Mover Snapshot"
            className={styles.previewImage}
          />
        </div>
        <p className={styles.caption}>A snapshot from Market Mover's Storyteller tool</p>
      </div>
    </section>
  );
}
