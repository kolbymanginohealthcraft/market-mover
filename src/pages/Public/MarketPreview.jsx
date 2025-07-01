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
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Market Preview</h2>
        <div className={styles.previewBox}>
          <img src={exampleImg} alt="Market Preview" className={styles.previewImage} />
        </div>
        <div className={styles.caption}>A sneak peek at your market opportunity.</div>
      </div>
    </section>
  );
}
