import React from 'react';
import styles from './UseCasesPage.module.css';

export default function UseCasesPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Use Cases</h1>
      <p className={styles.intro}>
        Market Mover is built for teams across the healthcare landscape. Here are just a few ways you can use it.
      </p>

      <div className={styles.useCaseList}>
        <div className={styles.card}>
          <h3>📍 Referral Development</h3>
          <p>Track referral patterns, identify upstream and downstream partners, and prioritize your outreach.</p>
        </div>

        <div className={styles.card}>
          <h3>📊 Market Strategy</h3>
          <p>Define your competitive landscape, assess saturation, and find underserved zones for expansion.</p>
        </div>

        <div className={styles.card}>
          <h3>🤖 Data-Driven Marketing</h3>
          <p>Build smarter campaigns by targeting provider types, locations, or performance tiers that align with your goals.</p>
        </div>

        <div className={styles.card}>
          <h3>👥 Team Collaboration</h3>
          <p>Save markets, share insights, and align your sales and strategy teams with centralized tools.</p>
        </div>
      </div>
    </div>
  );
}
