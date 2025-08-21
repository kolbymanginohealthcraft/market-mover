import React from 'react';
import styles from './OverviewPage.module.css';

export default function OverviewPage() {
  return (
    <div className={`page-centered ${styles.page}`}>
      <h1 className={`text-4xl text-center mb-8 ${styles.title}`}>What is Market Mover?</h1>
      <p className={`text-lg text-center mx-auto mb-12 max-w-3xl ${styles.intro}`}>
        Market Mover is a modern analytics platform that empowers healthcare providers and suppliers
        to explore their markets, understand referral networks, and act on data-driven growth strategies.
      </p>

      <section className="grid gap-8">
        <div>
          <h3 className={`text-xl mb-2 ${styles.featureHeading}`}>📈 Uncover Growth Opportunities</h3>
          <p className={`text-base ${styles.featureText}`}>Visualize referral flows and provider activity to identify leakage, white space, and strategic targets.</p>
        </div>
        <div>
          <h3 className={`text-xl mb-2 ${styles.featureHeading}`}>🧠 Understand Your Market</h3>
          <p className={`text-base ${styles.featureText}`}>Segment by provider type, geography, or performance to sharpen your outreach and marketing efforts.</p>
        </div>
        <div>
          <h3 className={`text-xl mb-2 ${styles.featureHeading}`}>🤝 Equip Your Team</h3>
          <p className={`text-base ${styles.featureText}`}>Give your sales and strategy teams the tools they need to prioritize, share, and act with confidence.</p>
        </div>
      </section>
    </div>
  );
}
