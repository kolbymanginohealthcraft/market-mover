// src/pages/public/TermsAndConditions.jsx
import React from 'react';
import styles from './TermsAndConditions.module.css';

const TermsAndConditions = () => {
  return (
    <div className={styles.container}>
      <h1>Terms and Conditions</h1>

      <section>
        <h2>1. Overview</h2>
        <p>
          These Terms and Conditions ("Terms") govern your use of Market Mover, a data analytics
          platform operated by Healthcraft Creative Solutions ("we", "our", or "us").
          By accessing or using the platform, you agree to be bound by these Terms.
        </p>
      </section>

      <section>
        <h2>2. U.S. Only Access</h2>
        <p>
          Market Mover is intended for use within the United States only. You may not use the
          platform if you are located outside the U.S.
        </p>
      </section>

      <section>
        <h2>3. Data Sources</h2>
        <p>
          Market Mover uses publicly available and licensed data sources including but not limited to:
          Medicare Provider Utilization and Payment Data, and Google BigQuery-hosted datasets.
          We do not guarantee the accuracy or completeness of third-party data.
        </p>
      </section>

      <section>
        <h2>4. Test Accounts</h2>
        <p>
          Test accounts are for evaluation purposes only and may include limited access to features.
          We reserve the right to restrict or revoke access to test accounts at our discretion.
        </p>
      </section>

      <section>
        <h2>5. Subscriptions and Billing</h2>
        <p>
          Paid plans are billed monthly or annually depending on your selection. All subscriptions are
          subject to our cancellation and refund policies.
        </p>
      </section>

      <section>
        <h2>6. Privacy</h2>
        <p>
          Our{' '}
          <a href="/legal/privacy">Privacy Policy</a>{' '}
          outlines how we collect and use your data.
        </p>
      </section>

      <section>
        <h2>7. Modifications</h2>
        <p>
          We may update these Terms from time to time. Continued use of Market Mover after any changes
          constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          For questions about these Terms, contact us at{' '}
          <a href="mailto:support@healthcraftsolutions.com">support@healthcraftsolutions.com</a>.
        </p>
      </section>
    </div>
  );
};

export default TermsAndConditions;
