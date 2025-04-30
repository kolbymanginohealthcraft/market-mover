// src/pages/Public/FAQPage.jsx
import React from 'react';
import styles from './FAQPage.module.css';

export default function FAQPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Frequently Asked Questions</h1>
      <div className={styles.faqList}>
        <div className={styles.faqItem}>
          <h3>What is Market Mover?</h3>
          <p>Market Mover is a data-driven analytics tool designed to help healthcare providers and suppliers explore provider networks, identify opportunities, and grow their business.</p>
        </div>

        <div className={styles.faqItem}>
          <h3>Who is it for?</h3>
          <p>Our platform is ideal for strategy teams, provider outreach managers, marketers, and anyone responsible for referral development or competitive analysis in healthcare.</p>
        </div>

        <div className={styles.faqItem}>
          <h3>Where does the data come from?</h3>
          <p>We source data from Medicare, CMS claims, and proprietary integrations with healthcare directories and partner networks.</p>
        </div>

        <div className={styles.faqItem}>
          <h3>Do I need technical skills to use it?</h3>
          <p>No! Market Mover was built to be user-friendly and visual. You can search, filter, and analyze markets with just a few clicks — no code required.</p>
        </div>

        <div className={styles.faqItem}>
          <h3>How fresh is the data?</h3>
          <p>We update data quarterly for most public sources and monthly for provider activity metrics where available.</p>
        </div>

        <div className={styles.faqItem}>
          <h3>Can I try it before I subscribe?</h3>
          <p>Yes! You can create a free account and explore a limited version of the platform with demo data before upgrading.</p>
        </div>
      </div>
    </div>
  );
}
