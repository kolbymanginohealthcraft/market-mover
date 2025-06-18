// src/pages/public/RefundPolicy.jsx
import React from 'react';
import styles from './TermsAndConditions.module.css';

const RefundPolicy = () => {
  return (
    <div className={styles.container}>
      <h1>Refund Policy</h1>
      <section>
        <h2>Free 7-Day Trial Terms</h2>
        <ul>
          <li>This is an auto-renewing subscription.</li>
          <li>
            If you do not cancel during your 7-day trial, your payment method will automatically be charged <strong>$2,500</strong> for the Starter level plan after the trial ends on <em>[Insert Trial End Date]</em>.
          </li>
          <li>
            Healthcraft Market Mover will continue to charge <strong>$2,500 per month</strong> thereafter until you cancel. Applicable taxes will be added based on your location and may vary over time.
          </li>
          <li>You may cancel your trial or subscription at any time from the Account page on the Healthcraft Market Mover website.</li>
          <li>You may upgrade your plan or add additional users at any time from the same Account page.</li>
          <li>
            If you cancel before the end of your subscription period, no partial refund will be issued. Your access will continue until the end of the billing cycle.
          </li>
        </ul>

        <p>
          By starting your free trial, you agree to the terms of the 7-day trial and the auto-renewing subscription as described above.
        </p>
      </section>

      <hr />

      <section>
        <h2>General Refund Policy</h2>
        <p>
          The Healthcraft Creative Solutions Market Mover platform operates on a recurring subscription basis. You may cancel your subscription at any time from the Account page.
        </p>
        <p>
          <strong>No partial refunds are provided.</strong> If you cancel your subscription before the current billing period ends (whether monthly or annual), your access will remain active through the remainder of that period, but you will not receive a prorated or partial refund.
        </p>
        <p>
          If you have questions about your subscription or refund eligibility, please contact our support team at{' '}
          <a href="mailto:info@healthcraftcreative.com" className={styles.link}>info@healthcraftcreative.com</a>.
        </p>
      </section>
    </div>
  );
};

export default RefundPolicy;
