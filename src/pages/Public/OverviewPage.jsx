import React from 'react';
import styles from './OverviewPage.module.css';

export default function OverviewPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>What is Market Mover?</h1>
      <p className={styles.intro}>
        Market Mover is a modern analytics platform that empowers healthcare providers and suppliers
        to explore their markets, understand referral networks, and act on data-driven growth strategies.
      </p>

      <section className={styles.features}>
        <div>
          <h3>📈 Uncover Growth Opportunities</h3>
          <p>Visualize referral flows and provider activity to identify leakage, white space, and strategic targets.</p>
        </div>
        <div>
          <h3>🧠 Understand Your Market</h3>
          <p>Segment by provider type, geography, or performance to sharpen your outreach and marketing efforts.</p>
        </div>
        <div>
          <h3>🤝 Equip Your Team</h3>
          <p>Give your sales and strategy teams the tools they need to prioritize, share, and act with confidence.</p>
        </div>
      </section>
    </div>
  );
}
