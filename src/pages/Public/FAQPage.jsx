// src/pages/Public/FAQPage.jsx
import React, { useState } from 'react';
import styles from './FAQPage.module.css';

const faqs = [
  {
    question: 'What is Market Mover?',
    answer:
      'Market Mover is a healthcare analytics platform that helps organizations visualize provider networks, analyze market dynamics, and drive strategic growth — all through an intuitive, visual interface.',
  },
  {
    question: 'Who can benefit from using it?',
    answer:
      'While we serve SNFs extensively, Market Mover is designed for all types of healthcare organizations — including hospitals, health systems, home health, therapy, and specialty providers.',
  },
  {
    question: 'Where does your data come from?',
    answer:
      'Our data is sourced from CMS claims (Medicare Part A and B), public directories, provider registries, and partner-supplied insights. We enrich this with proprietary modeling and quarterly refreshes.',
  },
  {
    question: 'Do I need technical skills or an analyst to use it?',
    answer:
      'Not at all. Market Mover is designed to be point-and-click simple. Anyone on your team — from outreach coordinators to senior leaders — can search, compare, and export market intelligence in seconds.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'Most public sources (like Medicare) are updated quarterly. Some provider activity metrics — like volumes and referrals — are refreshed monthly, depending on availability.',
  },
  {
    question: 'Can I test it before buying?',
    answer:
      'Yes. We offer a free version with demo data so you can explore the platform’s features and interface. You can also request a guided walkthrough for your team.',
  },
  {
    question: 'Is onboarding and support included?',
    answer:
      'Every subscription includes onboarding and customer support. We also offer custom training, live demos, and strategic use case guidance upon request.',
  },
  {
    question: 'How is Market Mover different from other market tools?',
    answer:
      'We focus on ease of use, speed to insight, and decision-ready visuals. Our clients say Market Mover combines the clarity of a CRM map with the depth of a claims analyst — without the wait.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Frequently Asked Questions</h1>
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
            onClick={() => toggleIndex(index)}
          >
            <h3 className={styles.question}>
              {faq.question}
              <span className={styles.icon}>{openIndex === index ? '−' : '+'}</span>
            </h3>
            <div className={styles.answerWrapper}>
              <p className={styles.answer}>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.ctaBox}>
        <p className={styles.ctaText}>
          Still have questions?{' '}
          <a href="/contact" className={styles.ctaLink}>
            Contact us
          </a>{' '}
          and we’ll be happy to help.
        </p>
      </div>
    </div>
  );
}
