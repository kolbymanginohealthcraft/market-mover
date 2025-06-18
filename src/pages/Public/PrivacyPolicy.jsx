// src/pages/public/PrivacyPolicy.jsx
import React from 'react';
import styles from './TermsAndConditions.module.css';

const PrivacyPolicy = () => {
  return (
    <div className={styles.container}>
      <h1>Privacy Policy</h1>

      <section>
        <h2>1. Overview</h2>
        <p>
          Healthcraft Creative Solutions ("we", "our", or "us") operates the Market Mover platform.
          This Privacy Policy explains how we collect, use, and protect your information.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>Personal details (e.g. name, email, organization)</li>
          <li>Account usage data and preferences</li>
          <li>Location or IP address (if applicable)</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and improve the Market Mover platform</li>
          <li>Manage subscriptions and support requests</li>
          <li>Analyze user behavior for product enhancements</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>
          We do not sell your data. We may share data with service providers that help us operate
          the platform (e.g. Supabase, Stripe), and only as necessary to deliver our services.
        </p>
      </section>

      <section>
        <h2>5. Data Security</h2>
        <p>
          We use industry-standard security measures to protect your data, but no system is completely secure.
          Users are responsible for keeping their login credentials safe.
        </p>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>
          You may request to access, correct, or delete your personal data by contacting us.
        </p>
      </section>

      <section>
        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this policy periodically. Changes will be posted on this page with an updated effective date.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          For questions or concerns, contact us at{' '}
          <a href="mailto:support@healthcraftsolutions.com">support@healthcraftsolutions.com</a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
